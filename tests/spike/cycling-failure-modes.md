# Spike S9-001 — Context Cycling Failure Modes

**Date:** 2026-05-06
**Trigger:** dungeon-game session 2026-05-06 (design rev-15 work). Multi-file logical commit interrupted by cycle hook; manual workarounds (Bash + Python file rewrites) used to complete edits. Resume chain failed after `/exit`. Forced manual transcript paste in new session.

This document is the spike output for S9-001. Each failure mode below has: trigger conditions, observed behavior, root-cause hypothesis (grounded in source), and a deterministic local repro. Findings drive implementation specs S9-002 through S9-006.

---

## F1 — Stale `.context-usage` blocks fresh session

**Trigger:** Prior session terminated (cycle or otherwise) with `.context-usage` containing `"should_cycle": true`. New session starts. Status line hasn't run yet (no tool calls processed). First Edit fires PreToolUse hook, which reads the stale file, sees `should_cycle=true`, and blocks.

**Source evidence:**
- `project/.claude/scripts/context-cycle-hook.sh:83` — `should_cycle=$(jq -r '.should_cycle // false' "$USAGE_FILE")`. No "is this current-session data" check.
- `project/.claude/scripts/context-monitor.sh` — status line; runs on UI refresh, not on every tool call. There is a window between "session start" and "status line first runs" where the on-disk file reflects the previous session.
- No SessionStart hook clears `.context-usage`.

**Repro recipe:**
1. In a clean test repo with v4.3.0 template and active SPRINT.md (`Status: in-progress`):
   ```
   echo '{"should_cycle":true,"used_tokens":900000,"threshold":580000,"used_pct":90,"window_size":1000000,"total_input":900000,"total_output":0,"exceeds_200k":true,"model":"claude-opus"}' > .context-usage
   ```
2. Start a new `claude` session.
3. First message: "Edit README.md to add a period." Or any tool call other than Bash/Write/Read.
4. **Observed:** PreToolUse hook blocks with "BLOCKED — CONTEXT CYCLE REQUIRED".
5. **Expected:** Hook recognizes the file is stale (no current-session token activity) and exits 0, allowing Edit.

**Hypothesis:** F1 root cause is the absence of a SessionStart-time reset. Fix: SessionStart hook deletes `.context-usage` (and `.sprint-tool-count`) so the first hook invocation in a session has nothing to act on until the status line writes fresh data.

---

## F2 — Status line reasserts `should_cycle=true` after manual reset

**Trigger:** User (or hook) resets `.context-usage` mid-session. Status line runs on next UI refresh, reads current cumulative token counts (which already exceed threshold from the prior session's accumulated state), and immediately writes `should_cycle=true` again.

**Source evidence:**
- `project/.claude/scripts/context-monitor.sh:30-46` — threshold is an absolute token count (e.g., 580000 for opus, capped to 70% of window_size). Compared against `used_tokens = used_pct * window_size`. If the user's prior conversation already consumed >580k tokens (large context), AND the status line reports cumulative `used_pct` from the conversation window (not from session start), the new session inherits the high count.
- Status line input includes `total_input_tokens` and `total_output_tokens` from `.context_window` — these are conversation-cumulative, not session-cumulative.
- No `session_floor` baseline: there's no notion of "tokens used since this session began."

**Repro recipe:**
1. Run a `claude --continue` session that has accumulated 700k tokens.
2. Manually `rm .context-usage`.
3. Observe status line on next UI refresh — writes `should_cycle=true` because `used_tokens >= threshold`.
4. **Expected:** Newly-started status-line invocation establishes a session_floor and computes delta. `should_cycle=false` until session-local delta crosses threshold.

**Hypothesis:** F2 is a session-vs-conversation conflation. Status line reports conversation totals; cycle threshold should apply to session-relative growth. Fix: status line records `session_floor` on first invocation; `should_cycle = (used_tokens - session_floor) >= threshold`.

**Note:** F1 and F2 compound. Even with F1's SessionStart reset in place, F2 means the status line will quickly re-flip to `should_cycle=true` at the next UI refresh on a resumed session. F1+F2 fixes are both required.

---

## F3 — SessionEnd → SessionStart resume chain didn't fire (dungeon-game)

**Trigger:** User completed cycle protocol (commit + `/exit`). SessionEnd hook should have written `.sprint-continuation.md` and `.sprint-continue-signal`. New session should have auto-injected the continuation content. Neither happened in dungeon-game; user had to paste the prior transcript manually.

**Source evidence (multiple candidates; spike enumerates without picking):**

1. **Matcher mismatch.** `settings.json.tpl:64-77` registers `session-start-continuation.sh` with `"matcher": "startup"`. Per Claude Code hooks docs, matcher values are `"startup"`, `"resume"`, or `"clear"`. `claude --continue` uses `"resume"`. If the user ran `claude --continue` after `/exit`, the continuation hook does NOT fire. Only `session-start-hook.sh` (matcher `""` = all) fires, and it merely emits a brief `additionalContext` instruction — it does NOT pump the continuation file content into the session.

2. **Template version drift.** dungeon-game may be on an older template (pre-v4.3) without these hooks. Verify by checking `dungeon-game/.claude/settings.json` for SessionEnd/SessionStart entries and the matcher value. If matcher is missing or scripts absent, no resume chain runs.

3. **SessionEnd timing.** `session-end-cycle.sh` is configured (`settings.json.tpl:49-62`) but Claude Code doesn't always wait for SessionEnd hooks to complete before exiting. If the user `/exit`s and the process terminates before the hook finishes writing files, no continuation exists.

4. **`.context-usage` already deleted.** If something cleared the file before SessionEnd ran, the hook short-circuits at line 30 (`[ ! -f "$USAGE_FILE" ] && exit 0`).

5. **`session-start-continuation.sh` deletes after read.** `session-start-continuation.sh:51` removes both files after first injection. If a prior session injected and the user re-`/exit`ed without a new cycle, no continuation exists for the next start. Not the dungeon-game cause but a related footgun.

**Repro recipe:**
1. In a clean test repo with v4.3.0 template:
   ```
   echo '{"should_cycle":true,...}' > .context-usage
   ```
2. Start `claude`. Type `/exit`. **Verify:** `.sprint-continuation.md` and `.sprint-continue-signal` exist.
3. Branch A: `claude` (matcher `"startup"`). **Expected:** Continuation injected and files deleted.
4. Branch B: `claude --continue` (matcher `"resume"`). **Expected per current code:** No injection. Only brief additionalContext from `session-start-hook.sh`. **This is likely the dungeon-game case.**
5. Branch C: dungeon-game has older template. Check `dungeon-game/.claude/settings.json` — if SessionStart entries are absent or matchers differ, the chain can't run.

**Hypothesis:** F3 is most likely **matcher misconfiguration**. The continuation hook should also fire on `"resume"` (or use matcher `""`). Spike recommends S9-005 verify this empirically by inspecting both branches in a test directory and decide whether the hook should run on all matchers or whether `"startup"` is correct and `--continue` flow needs separate handling.

---

## F4 — PreToolUse hook fires for non-sprint sessions

**Trigger:** Any session in any aiagentminder-template-installed repo where `.context-usage` exists with `should_cycle=true`. The hook blocks regardless of whether a sprint is active. dungeon-game's design-doc work (no active sprint) was treated as if it were a strict-protocol sprint cycle.

**Source evidence:**
- `project/.claude/scripts/context-cycle-hook.sh:37-75` — fallback path (no `.context-usage`) checks `SPRINT.md` status before applying the tool-counter heuristic. **Normal path (with `.context-usage`) has no such check.** Lines 83-128 act on `should_cycle` regardless of sprint state.
- The fallback's design intent (lines 38-41 comments) explicitly says cycling fallback applies only when sprint is in-progress. The normal path should mirror this.

**Repro recipe:**
1. In a clean test repo with v4.3.0 template, **no SPRINT.md** OR `SPRINT.md` with `Status: proposed` / archive-only:
   ```
   echo '{"should_cycle":true,...}' > .context-usage
   ```
2. Try to Edit any file.
3. **Observed:** Hard block, "CONTEXT CYCLE REQUIRED".
4. **Expected:** Soft warning ("Context approaching threshold; consider /exit when convenient"), exit 0, Edit allowed.

**Hypothesis:** F4 is a normal-path/fallback-path inconsistency. Fix: read `SPRINT.md` Status in normal path; if not `in-progress`, downgrade to soft warning. Sprint-active sessions retain the strict block (the cycle protocol is sprint-machinery-specific).

---

## F5 — Edit blocked during cycle forces Bash workarounds

**Trigger:** During an active cycle (`should_cycle=true` + sprint in-progress), the agent needs to commit work as part of the cycle protocol. Often this involves finalizing in-flight files. Edit is blocked; Write requires re-reading the entire file; Bash works for git commands only. Agents end up doing Python-via-Bash (`awk`, `python -c`) to perform what should be a one-line Edit.

**Source evidence:**
- `project/.claude/scripts/context-cycle-hook.sh:99-107` — allowlist is `Bash|Write|Read`. Edit, NotebookEdit, MultiEdit are all blocked.
- The dungeon-game transcript at the point of failure shows exactly this: agent used `awk '/^## Known Debt/{system("cat .tmp-adrs-rev15.md")}{print}' DECISIONS.md > DECISIONS.md.new && mv ...` to insert ADR content. That's a manual file rewrite via Bash — exactly the workaround the gating intends to prevent, except the gating CAUSED it.

**Repro recipe:**
1. In a clean repo with sprint in-progress and `should_cycle=true`:
2. Try `Edit some-file.md` to make a small change.
3. **Observed:** Blocked.
4. **Expected:** Edit allowed (it's functionally Write-equivalent for cycle-step commits).

**Hypothesis:** F5 is overcorrection. Edit is no more dangerous than Write during cycle. Including Edit in the allowlist removes the workaround pressure without weakening the cycle protocol. (The protocol's real purpose is preventing *new exploration* — not preventing finalization edits to already-known files.)

---

## F6 — Cycle fires mid-multi-file logical commit

**Trigger:** Agent is partway through a multi-file logical commit (e.g., add subdoc + 2 ADRs + roadmap update + glossary update — all referencing each other). Cycle hook fires after file 1 is written. Files 2-5 must be deferred. Branch ends in an inconsistent state where the subdoc references entries that don't exist yet.

**Observed in dungeon-game transcript:** `design/character-mechanics.md` was written and committed alone. ADRs in DECISIONS.md, GAME_DESIGN.md updates, and roadmap updates were all blocked by the hook. Subdoc references (e.g., `See DECISIONS.md "Character mechanics framework" ADR`) point to entries that don't yet exist on the branch.

**Source evidence:**
- F6 is a *consequence* of F4+F5, not a separate root cause. If F4 (sprint-gating) is fixed, non-sprint multi-file commits aren't gated. If F5 (Edit allowed) is fixed, sprint-active multi-file commits can still be edited mid-cycle to finalize.
- However, F6 also implies a design question: should the cycle hook offer a "defer until X tool calls" grace period if the agent declares it's mid-commit? Out of scope for S9; surfaced for future consideration in BACKLOG.md if the user wants.

**Repro recipe:** Combination of F2+F4+F5 reproductions. Once those are fixed, F6 is no longer reproducible in non-sprint mode.

**Hypothesis:** F6 is fully resolved by F4 (non-sprint sessions don't get blocked) plus F5 (Edit allowed during sprint cycle). No separate fix required.

---

## Cross-cutting hypothesis (informs S9-006 ADR)

The current cycling system was designed for one mode of operation: **sprint-in-progress, near-end-of-context, agent autonomously continuing work across sessions**. It was not designed for:

- Non-sprint sessions in template-consuming downstream repos (dungeon-game, accessi-shield).
- Resumed `--continue` sessions where conversation tokens already exceed threshold at session start.
- Multi-file logical commits where mid-flight Edit is the safest path to a clean state.

The fixes (S9-002 through S9-005) re-scope the system to fire only when (a) a sprint is actually active and (b) the *current session* has exceeded the threshold. In every other case the system either does nothing or emits a soft warning. This matches the actual operating model and removes the work-loss class of bugs.

---

## Spec impact

After this spike, no S9-002 through S9-006 specs require revision. All findings align with the as-drafted approach. Spike confirms:

- S9-002 fix (SessionStart reset) addresses F1 directly.
- S9-003 fix (warmup hysteresis) addresses F2 directly.
- S9-004 fix (sprint gating + Edit allowed) addresses F4 and F5; together with S9-002+S9-003 also resolves F6.
- S9-005 (resume chain investigation) is the right shape for F3 — needs empirical investigation; matcher mismatch is the leading hypothesis.
- S9-006 (docs/ADR) captures the cross-cutting policy shift.

S9-001 spike complete. Proceeding to S9-002.

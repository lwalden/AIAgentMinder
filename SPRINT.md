# SPRINT.md - Sprint Header

> Sprint scope and status. Loaded via @import each session when an active sprint exists.
> Individual issues are tracked as native Claude Code Tasks (persistent across sessions).
> Archived to git history when a sprint completes.
>
> **Post-Merge column:** `n/a` = no post-merge tests needed, `pending: {desc}` = awaiting validation,
> `pass` = validated, `fail` = failed (rework task created).

## Archive

S1 archived (2026-03-29): 7 planned, 5 completed, 2 deferred (S1-005 npm publish pending, S1-006 GH Actions blocked on PR #84 human review), 0 rework. 0 scope changes, 0 blocked (at completion). Shipped automated correction capture, stop hook enforcement, zero-token-cost scripts, cross-model review gate, README rewrite, v3.3.0 GitHub Release. Deferred release automation items to post-v4.0.
<!-- sizing: 5-7 -->

S2 archived (2026-03-30): 9 planned, 9 completed, 0 rework. 0 scope changes, 0 blocked. Shipped skills migration, 1M context cycling, negative test enforcement, UX friction lens, judge agent pass, setup auto-detection, SessionStart/StopFailure hooks, hooks schema fix. Closes v4.0 Tier 1; Tier 2 partial (custom subagents and rule compression deferred — subsumed by session profiles approach).
<!-- sizing: 5-7 -->

S3 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Shipped session profiles (5 agents, rule reorganization, sprint-runner --agent flag), backlog capture system (backlog-capture.sh, BACKLOG.md, /aam-backlog skill, integration touchpoints). 81 new tests (175→256). PRs #96-101.
<!-- sizing: 5-7 -->

S4 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.1.0 version bump + GitHub Release, migration integration tests, custom review subagents (5 agents), self-review agent architecture refactor, roadmap/README update. PRs #102-106.
<!-- sizing: 5-7 -->

S5 archived (2026-03-30): 7 planned, 7 completed, 0 rework. 0 scope changes, 0 blocked. Shipped deterministic sync CLI (lib/sync.js, lib/migrations.js, lib/settings-merge.js), CLI sync command, /aam-update rewrite (404→112 lines), plugin skill removal (13 packages), manifest consistency tests. 60 new tests (285→345). PRs #107-113.
<!-- sizing: 5-7 -->

S6 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.2.0 release, /aam-setup CLI delegation (183→139 lines), roadmap/README update, v4.2 migration entry, e2e sync test (v3.3→v4.2 full upgrade path). 12 new tests (345→357). PRs #115-119.
<!-- sizing: 5-7 -->

S7 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Fixed init --force data-loss bug (settings.json merge), stale debug-checkpoint/PROGRESS.md references, added jq dependency check to sync/init, pruned 82 remote + 51 local stale branches, updated README rules table for v4.1 session profiles. 63 new tests (357→420). PRs #122, #124–127.
<!-- sizing: 5-7 -->

S8 archived (2026-05-06): 10 planned, 10 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v5.0-pre orchestrator architecture: sprint-master state-machine router, 6 phase agents (sprint-planner, sprint-speccer, item-executor, quality-reviewer, pr-pipeliner, sprint-retro), 5 review lens sub-agents, sprint-metrics collection, integration test suite, v4.2→v5.0 migration. sprint-executor removed in #142. PR #143 (v4.3.0 quality-gate hardening) shipped as interim release; v5.0 cut deferred to S9. Sprint sized at 10 (oversized — pre-approved); recommend S9 returns to 5-7.
<!-- sizing: 5-7 -->

---

**Sprint:** S9 — Context Cycling Robustness
**Status:** in-progress
**Phase:** v4.3.x stabilization (precedes v5.0 release)
**Issues:** 6 proposed
**Goal:** Eliminate work-loss risk surfaced by dungeon-game transcript (2026-05-06). Cycling must (a) only fire when warranted, (b) survive session boundaries cleanly, (c) not require Bash workarounds to keep editing.

| ID | Title | Type | Risk | Status | Post-Merge |
|---|---|---|---|---|---|
| S9-001 | Spike: reproduce F1–F6 deterministically [risk] | spike | ⚠ | done | n/a |
| S9-002 | F1 — SessionStart clears stale `.context-usage` | fix | | in-progress | n/a |
| S9-003 | F2 — status-line warmup hysteresis | fix | | in-progress | n/a |
| S9-004 | F4+F5 — sprint-state gating + Edit allowed during cycle | fix | | in-progress | n/a |
| S9-005 | F3 — verify+fix SessionEnd→SessionStart resume chain [risk] | fix | ⚠ | todo | n/a |
| S9-006 | Docs — update `context-cycling.md` + ADR for revised policy | docs | | todo | n/a |

---

## Specs

### S9-001: Spike — reproduce F1–F6 deterministically [risk]
**Approach:** Build a deterministic local reproduction for each failure mode in `tests/spike/cycling-failure-modes.md`. Use a throwaway test directory with v4.3.0 template installed. For each F#, document: trigger conditions, observed behavior, root-cause hypothesis. Findings drive any spec revisions for S9-002 through S9-006.
**Failure modes:**
- F1: Stale `.context-usage` from prior session blocks first Edit in fresh session.
- F2: Status line rewrites `should_cycle=true` immediately after manual reset.
- F3: SessionEnd→SessionStart auto-resume chain failed in dungeon-game; `.sprint-continuation.md` not picked up.
- F4: PreToolUse hook fires for non-sprint sessions (no `SPRINT.md` status check on normal path).
- F5: Edit blocked during cycle; only Bash/Write/Read allowed; forces Bash-based workarounds.
- F6: Cycle fires mid-multi-file logical commit, leaving incomplete state.
**Test Plan (TDD RED):** N/A — spike. Validation = each F# has a documented repro recipe.
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `tests/spike/cycling-failure-modes.md` | Modify: `SPRINT.md` (revise specs if findings warrant)
**Dependencies:** None — first item.
**Upgrade Impact:** N/A
**Custom Instructions:** Pre-approved — spec revisions in this phase do not require human checkpoint.

### S9-002: F1 — SessionStart clears stale `.context-usage`
**Approach:** Extend (or add) a SessionStart hook that deletes `.context-usage` and `.sprint-tool-count` on every session start. Cycle decisions must be based on the current session's actual usage, not residue. Status line will recreate `.context-usage` on its first run with current-session token math. Hook registered in `project/.claude/settings.json.tpl` under `SessionStart`.
**Test Plan (TDD RED):**
1. With pre-existing `.context-usage` containing `should_cycle=true`, SessionStart hook fires and removes/resets it.
2. With pre-existing `.sprint-tool-count` > threshold, SessionStart resets to 0.
3. First Edit in new session is not blocked when prior session left stale state.
4. Hook is idempotent (safe to fire multiple times).
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/scripts/session-start-cycle-reset.sh` | Modify: `project/.claude/settings.json.tpl`, `lib/sync.js` manifest if needed, `tests/manifest.test.js`
**Dependencies:** S9-001
**Upgrade Impact:** New hook entry in settings.json.tpl; sync merge will add it on `/aam-update`.
**Custom Instructions:** None

### S9-003: F2 — status-line warmup hysteresis
**Approach:** `context-monitor.sh` (status line) tracks per-session token-floor. On first invocation in a session it records the starting token count and writes `should_cycle=false` regardless of absolute value. The `should_cycle` flag flips to `true` only when **current-session delta** (used_tokens − session_floor) crosses the threshold. Prevents cross-session bleedthrough and the "resumed at 80%" thrash. Per-session state lives in `.context-usage` itself with a new `session_floor` field.
**Test Plan (TDD RED):**
1. First invocation in fresh session writes `session_floor` = current used_tokens.
2. `should_cycle=false` until `used_tokens - session_floor` ≥ threshold.
3. After SessionStart reset (S9-002), session_floor recomputes from new baseline.
4. Existing `used_pct` calculation unchanged for status-line display.
5. Backward compatibility: missing `session_floor` field treated as 0 (legacy behavior).
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Modify: `project/.claude/scripts/context-monitor.sh`, `tests/` (new test file)
**Dependencies:** S9-001, S9-002 (SessionStart reset enables clean session_floor init)
**Upgrade Impact:** `.context-usage` schema gains optional `session_floor` field. Hook tolerates absence.
**Custom Instructions:** None

### S9-004: F4+F5 — sprint-state gating + Edit allowed during cycle
**Approach:** Two changes to `context-cycle-hook.sh`:
1. **Sprint gating (F4):** Mirror the fallback-path sprint-status check into the normal `.context-usage` path. Read `SPRINT.md` Status; if not `in-progress`, exit 0 with a soft warning (no block) regardless of `should_cycle`. Sprint sessions retain hard block.
2. **Edit allowed (F5):** Expand allowed-tool list from `Bash|Write|Read` to `Bash|Write|Read|Edit`. Edit is functionally equivalent to Write for in-flight files — blocking it forces Bash-via-Python workarounds that are riskier than the cycle protocol they bypass. Update messaging.
**Test Plan (TDD RED):**
1. With `SPRINT.md` Status=`proposed` and `should_cycle=true`, Edit is NOT blocked (warn-only).
2. With `SPRINT.md` Status=`in-progress` and `should_cycle=true`, Edit IS allowed (new behavior).
3. With `SPRINT.md` Status=`in-progress` and `should_cycle=true`, non-allowed tools (e.g., WebFetch) are still blocked.
4. With no `SPRINT.md`, hook exits 0 (warn-only) — non-aiagentminder repo case.
5. Soft-warning message references which mode is active and why.
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Modify: `project/.claude/scripts/context-cycle-hook.sh`, `tests/` (extend existing hook tests)
**Dependencies:** S9-001
**Upgrade Impact:** Behavior change for non-sprint downstream consumers (e.g., dungeon-game). Soft warnings replace hard blocks; documented in S9-006.
**Custom Instructions:** None

### S9-005: F3 — verify+fix SessionEnd→SessionStart resume chain [risk]
**Approach:** Investigate why dungeon-game's resume failed. Likely candidates:
- User invoked `claude` rather than `claude --continue`, and the SessionStart hook only injects continuation under `--continue`.
- `session-end-cycle.sh` didn't fire (not registered, error silently swallowed).
- `.sprint-continue-signal` not written, or SessionStart looks in wrong path.
- Timing: SessionEnd ran but didn't finish before exit.

Read `session-end-cycle.sh` and any SessionStart hook. Add an end-to-end integration test that simulates the full loop in a temp directory. Where the test reveals broken behavior, fix it. Document the actual user contract (e.g., "must use `claude --continue` after a hook-triggered cycle") in `context-cycling.md`.
**Test Plan (TDD RED):**
1. Simulate `should_cycle=true` → write commit → /exit → assert `.sprint-continuation.md` and `.sprint-continue-signal` exist.
2. Simulate fresh `claude --continue` start → assert SessionStart hook reads continuation, injects context, deletes signal.
3. Simulate fresh `claude` (no --continue) start → document expected behavior (likely: warn that continuation exists, instruct user).
4. Simulate SessionEnd hook missing/failing → cycle still safe (work committed before /exit).
**Integration/E2E:** Yes — add integration test under `tests/integration/cycling-resume-chain.test.js`.
**Post-Merge Validation:** None (logic is offline-testable).
**Files:** Read: `project/.claude/scripts/session-end-cycle.sh`, any SessionStart hook | Modify: as findings indicate | Create: `tests/integration/cycling-resume-chain.test.js`
**Dependencies:** S9-001
**Upgrade Impact:** May change documented user contract for resume.
**Custom Instructions:** None

### S9-006: Docs — update `context-cycling.md` + ADR for revised policy
**Approach:** Add a new ADR to `DECISIONS.md`: "Cycling is sprint-gated; non-sprint sessions self-manage." Capture rationale (dungeon-game incident, work-loss risk, F1–F6), alternatives considered (always-on, never-on, opt-in flag), decision (sprint-gated). Update `project/.claude/rules/context-cycling.md` to describe new behavior: when sprint is active vs not, what the warm-up hysteresis means, the SessionStart reset, the expanded allowed-tools list during sprint cycle. Update README rule table if needed.
**Test Plan (TDD RED):**
1. `context-cycling.md` describes both sprint-active and non-sprint behavior.
2. ADR exists in `DECISIONS.md` under standard heading format.
3. ADR includes Decision, Why, Alternatives, Consequences sections.
4. README rule table accurate (if present).
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Modify: `project/.claude/rules/context-cycling.md`, `DECISIONS.md`, possibly `README.md`
**Dependencies:** S9-002, S9-003, S9-004, S9-005 (docs reflect actual behavior).
**Upgrade Impact:** Doc-only.
**Custom Instructions:** None

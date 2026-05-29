# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.
> Not auto-loaded. Add `@DECISIONS.md` to CLAUDE.md to auto-load.
>
> **When to log:** command/rule design choices, hook architecture, install mechanism changes, naming conventions.

---

### Replace autonomous context-cycle protocol with a passive Stop-hook warning | 2026-05 | Status: Active

Chose: Retire the v5.0 auto-cycle system (PreToolUse blocking, `.sprint-continuation.md` writing via SessionEnd, `session-start-continuation.sh` consumption, `.sprint-tool-count` fallback) and replace it with a single `Stop` hook (`context-warning-hook.sh`) that injects an advisory message when `.context-usage` says `should_cycle=true`. The user picks wrap-up (`/aiagentminder:handoff` + `/exit` → "resume work" via Auto Memory) or continue. Also split `sprint-phase-guard.sh`: phase blocking stays on `PreToolUse` but moves from empty matcher to `matcher: "Agent"`; periodic phase reminders move to a new `Stop` hook `sprint-phase-reminder.sh`.

Why: The autonomous protocol never worked reliably in practice. Specifically: (a) requires slash commands the user can't issue from the mobile Claude app (the primary monitoring surface for long CLI sessions); (b) self-termination disconnects the mobile observer from the session; (c) is dormant on Claude Code web (no `.context-usage` produced) yet docs and rules suggested the protocol applies there; (d) blocks tool calls during finalization, forcing Bash-via-Python rewrites; (e) the empty-matcher PreToolUse spawned bash on every tool call (flagged in #152); (f) bundled phase-blocking + reminder injection in one script, which meant a single matcher had to serve two different trigger surfaces.

Alternatives considered: (a) keep the protocol but harden it — rejected; the fundamental failure modes are environmental (mobile, web) not implementation bugs; (b) leave the matcher empty and just optimize the script — rejected; doesn't address #152's actual concern and leaves the autonomous protocol's UX problems unresolved; (c) move reminders to UserPromptSubmit instead of Stop — considered; Stop is closer to a natural decision point and fires at the right cadence (per turn) without requiring user input to surface; (d) drop reminders entirely — considered but kept since they're cheap and useful for orientation, and pairing with the new context-warning Stop hook gives a consistent "Stop is where guidance lands" pattern.

Tradeoff: Sprint runs no longer have an autonomous-cycling safety net. Users running long unattended `sprint-runner.sh` loops must either size sprints to fit a single session or insert their own checkpoint cadence. Mitigated by: the per-turn warning re-fires until the user wraps up, `/aiagentminder:handoff` produces a clean Auto Memory record, and `claude --continue` still works for general resumption. Net code reduction: 3 scripts (~344 lines) + 3 test files (~566 lines) deleted; 2 new scripts (~80 lines) + 2 new tests (~140 lines) added. Shipped in v5.1.0.

---

## Format: Lightweight

```
### [Title] | Date | Status: Active
Chose: [X] over [alternatives considered]. Why: [rationale]. Tradeoff: [what you gave up].
```

---

### Architecture fitness: concrete defaults over blank template | 2026-03 | Status: Active

Chose: Ship 4 concrete, stack-agnostic rules (file size 300-line flag, secrets in source, test isolation, layer boundaries) with commented stack-specific examples over (a) keeping the blank placeholder template or (b) dropping the feature entirely. Why: competitive analysis of 70+ repos showed 0/9 installed repos ever customized the placeholder, but cross-repo analysis confirmed 4 universal patterns survive across all stacks. Competitors that ship concrete rules (ai-rules, Spec-Flow) make them language-specific — only stack-agnostic rules work as defaults. Tradeoff: defaults may not apply to every project (e.g., single-file projects, markdown-only repos), mitigated by escape clause in enforcement section.

---

### Competitive analysis backlog sourcing | 2026-03 | Status: Active

Chose: Populate roadmap backlog from structured competitive analysis (70+ repos, 3 parallel research agents) over ad-hoc feature ideas. Why: ensures backlog items are grounded in market reality and differentiation gaps rather than speculation. Identified 8 items across 4 themes. Key finding: AAM's unique moat is the governance *workflow* (sprint state machine + quality gates + context cycling), not rules — cross-platform tools can sync rules but can't replicate the workflow.

---

### Stop hook exit code semantics: exit 0 = allow, non-zero = error | 2026-04 | Status: Active

Chose: `exit 0` (no stdout JSON) to allow stop, and `exit 0` + `{"decision":"block"}` JSON on stdout to block stop in `sprint-stop-guard.sh`, over using `exit 2` for "allow" (as was done from v3.3 through early S8 fix attempts). Why: for Stop hooks, Claude Code treats any non-zero exit code as an error and injects "Stop hook error: No stderr output" into the conversation UI as feedback text. Claude responds to this injected text, which triggers another stop hook execution — an infinite loop. The `exit 2` convention applies only to PreToolUse hooks (where exit 2 = block the tool call). Stop hooks use stdout JSON for the block/allow decision, not exit codes. Tradeoff: since exit 0 is the only valid non-error exit, the distinction between allow and block is entirely in stdout content (JSON present = block, no JSON = allow). Applied to template and accessishield (PR #277).

---

### Sprint continuation counter via HTML comment in SPRINT.md | 2026-03 | Status: Active

Chose: `<!-- ai-continues: N -->` HTML comment written directly into SPRINT.md at runtime over tracking via PR labels or a separate state file. Why: self-contained with no external dependencies, survives worktree removal, is invisible in rendered markdown, and resets naturally when the sprint is archived. Counter is NOT committed — it is ephemeral state that controls runaway protection within a single sprint execution. Tradeoff: if SPRINT.md is reset by hand mid-sprint, the counter resets too (acceptable — manual sprint intervention implies human oversight).

---

### nohup + disown spawn pattern for continuation agent | 2026-03 | Status: Superseded

Superseded by in-session pipeline execution (v2.1). The background `claude -p` spawn approach was replaced — the sprint workflow now invokes `/aam-pr-pipeline` directly in-session.

Original: Chose `nohup claude -p ... >> log 2>&1 & disown $!` over Node.js `spawn({detached: true})` for spawning the continuation agent from bash.

---

### PostToolUse hook over webhook-only for PR pipeline trigger | 2026-03 | Status: Superseded

Superseded by in-session pipeline execution (v2.1). The PostToolUse hook and background spawn approach were removed entirely — the sprint workflow now invokes `/aam-pr-pipeline` directly in-session.

Original: Chose PostToolUse hook on `Bash` detecting `gh pr create` output to spawn background `claude -p` in a worktree over relying solely on GitHub webhook → n8n → spawn.

---

### Autonomous context cycling via self-kill + profile hook | 2026-03 | Status: Active

Chose: Process self-termination with shell prompt hook restart over (a) subagent-per-item (loses interactive flow), (b) `RemoteTrigger` chaining (server-side, loses terminal env), (c) manual handoff only. Why: The profile hook fires when the shell prompt renders after Claude dies — same terminal, same env vars (BW_SESSION, etc.), zero human intervention. Works whether Claude was started via wrapper or directly. Cross-platform: Windows uses `/proc/$$/winpid` → WMI → `taskkill`; macOS/Linux uses `ps -o ppid=` chain → `kill -9`. Profile hooks: PowerShell `prompt` function (Windows), `PROMPT_COMMAND`/`precmd` (bash/zsh). Tradeoff: Hard kill — no exit hooks fire, so all state must be persisted before the kill. First cycle in a non-wrapper session requires one user action (type `/exit`) only if the profile hook isn't installed.

---

### aam- command prefix | 2025-11 | Status: Active

Chose: `aam-` prefix for all commands over unprefixed names (e.g., `/handoff`, `/milestone`). Why: Claude Code ships built-in commands (`/plan`, `/doctor`, `/review`) and other plugins use short names — collisions break silently. `aam-` is a namespace that cannot collide. Tradeoff: slightly more typing for users.

---

### rules/ over guidance/ | 2025-10 | Status: Active

Chose: `.claude/rules/` directory name over `.claude/guidance/`. Why: Claude Code natively auto-loads all `.md` files from `.claude/rules/` without any hook configuration. The `guidance/` name required hooks to load files. Switching to `rules/` eliminated a hook entirely. Tradeoff: none meaningful.

---

### compact-reorient.js fires on compact only | 2025-10 | Status: Superseded

Superseded by v3.2 decision to drop compact-reorient.js entirely. See below.

Original: Chose compact matcher (post-compaction only) over SessionStart for the sprint reorientation hook. Why: Firing on every SessionStart added noise to sessions that didn't need reorientation. The only session where sprint context is truly lost is after context compaction. Tradeoff: sprint reorientation won't fire on fresh sessions — acceptable because fresh sessions have full history.

---

### Drop compact-reorient.js hook | 2026-03 | Status: Active

Chose: Remove compact-reorient.js entirely over keeping it as a fallback. Why: v3.1's CONTEXT_CYCLE state proactively prevents compaction during sprints — the hook's reactive reorientation is redundant in the common case. SPRINT.md is already available via CLAUDE.md's `@SPRINT.md` import for the rare cases where compaction still occurs despite cycling. Removing it eliminates the project's only Node.js dependency. The "compaction has occurred" heuristic in CONTEXT_CYCLE is replaced by the three remaining signals (item count, debugging intensity, rework). Tradeoff: If compaction occurs in a non-sprint session, there is no automatic reorientation — Claude must re-read SPRINT.md manually. Acceptable because CLAUDE.md already imports it.

---

### Drop /aam-update dry-run mode from backlog | 2026-03 | Status: Superseded

Superseded by v4.2 deterministic sync decision (2026-03-30). Dry-run is now a CLI flag.

Original: Chose: Drop the dry-run backlog item over implementing it. Why: The update command is 374 lines with three file categories and multi-version migration paths. A real dry-run adds ~40-50% code overhead.

---

### Stop hook removed | 2025-08 | Status: Active

Chose: remove auto-commit Stop hook and replace with `git-workflow.md` rule over keeping the hook. Why: the hook committed on session end regardless of intent, creating noise commits. `git-workflow.md` encodes the same discipline as a behavioral rule — Claude follows it without automation. Tradeoff: relies on Claude following the rule rather than enforcement.

---

### No AGENTS.md, single-agent only | 2025-10 | Status: Active

Chose: single-agent Claude Code sessions over multi-agent (AGENTS.md / Copilot layer). Why: AIAgentMinder targets solo developers using Claude Code. Multi-agent coordination adds complexity that the target audience doesn't need. Tradeoff: not applicable to team/multi-agent setups (by design).

---

### PROGRESS.md pruned | 2025-10 | Status: Active

Chose: remove PROGRESS.md entirely over keeping it as a session continuity file. Why: Claude Code's native Session Memory and `--continue` flag handle cross-session continuity. PROGRESS.md was maintenance overhead with no unique value. Tradeoff: none; native tooling is strictly better for this use case.

---

### Commands split: meta vs installed | 2025-11 | Status: Active

Chose: keep `aam-setup.md` and `aam-update.md` in the repo root `.claude/commands/` (meta-commands) while all other commands live in `project/.claude/commands/` (installed to targets). Why: setup and update commands operate on the AIAgentMinder repo itself — they don't belong in target projects. All governance commands (`aam-brief`, `aam-handoff`, etc.) belong to the target. Tradeoff: two locations to be aware of; this file documents the split to prevent confusion.

---

### Versioning scheme: continue v3.x with strict semver | 2026-03 | Status: Active

Chose: Continue v3.x lineage with unified versioning (npm, plugin, marketplace, stamp all match) and strict semver (MAJOR = breaking/migration, MINOR = new features/backwards-compatible, PATCH = bug fixes only) over (a) resetting to v1.0.0 for "first public release" or (b) splitting npm and internal versions. Why: 9+ target repos carry 3.2.0 stamps — a reset reads as a downgrade with no semver-aware comparison logic; validate.js enforces all 4 version points match — a hybrid scheme breaks this; cosmetic benefit of v1.0.0 doesn't justify migration cost. Batching policy: multiple PRs land in one version; bump once at release time, not per-PR. Sprint boundaries are the natural release trigger. Tradeoff: external npm users see v3.x on a "new" package — acceptable since the number carries no user-facing confusion.

---

### GitHub Releases: adopt manual release checklist | 2026-03 | Status: Active

Chose: Start using GitHub Releases with git tags and auto-generated notes over (a) continuing "main = released" with no markers or (b) adding CI-driven publish automation. Why: releases are invisible without tags — users can't subscribe, npm publish is disconnected from any git marker, and there's no changelog attached to a version. Manual checklist (bump → commit → tag → gh release → npm publish) is appropriate for a solo developer shipping a few releases per month. CI automation is a future backlog item, not a prerequisite. Tradeoff: manual process has human error risk — mitigated by the release checklist in docs/RELEASING.md.

---

### Stop hook for sprint continuation enforcement | 2026-03 | Status: Active

Chose: `Stop` hook (`sprint-stop-guard.sh`) that blocks premature turn endings during active sprints over (a) relying solely on instruction text in sprint-workflow.md (soft directive — proved insufficient, Claude stopped between items) or (b) PostToolUse context injection alone (fires at tool boundaries, not turn boundaries). Why: the Stop hook fires at exactly the failure point — when Claude tries to end its turn. Combined with `.sprint-human-checkpoint` signal file for REWORK and SPRINT.md state inspection for all other checkpoints. Tradeoff: adds a shell script execution on every turn ending; mitigated by fast-path exit (no SPRINT.md = instant exit 2). Conservative design: when in doubt, allows the stop rather than forcing continuation past a checkpoint.

---

### Automated correction capture via PostToolUse hook | 2026-03 | Status: Superseded (see "Retire correction-capture — Auto Memory supersedes it", 2026-05)

Chose: PostToolUse hook (`correction-capture-hook.sh`) that tracks sequential tool calls and detects corrections (failed → retry with different args) over (a) keeping the passive self-reporting rule only or (b) PreToolUse hook (can't see results). Why: PostToolUse receives `tool_response` with success/failure data, enabling mechanical detection. Logs to `.corrections.jsonl` with pattern keys (e.g., `Bash:npm`) for grouping. Outputs `hookSpecificOutput.additionalContext` on 2nd occurrence so Claude sees the alert. Excludes transient errors (ETIMEDOUT, ECONNREFUSED, rate limits). Tradeoff: fires on every tool call; mitigated by fast jq-check path and fail-open without jq.

---

### Retire correction-capture — Auto Memory supersedes it | 2026-05-15 | Status: Active

Chose: Delete the `correction-capture.md` rule and `correction-capture-hook.sh` PostToolUse hook entirely, relying on Claude Code's native Auto Memory (v2.1.59+) for repeated-mistake capture, over (a) keeping AAM's implementation in parallel with Auto Memory or (b) refactoring AAM's hook to integrate with Auto Memory. Why: Auto Memory captures build commands, debugging insights, and repeated-mistake patterns across sessions automatically, without an AAM-specific shell hook on every tool call. Field experience from this repo's primary user: the AAM implementation provided no observed value over the native equivalent. The two-strike "propose a permanent `.claude/rules/` entry" loop was the unique part; in practice it didn't fire often enough to justify the PostToolUse cost. Tradeoff: AAM loses control over what gets captured and how it's surfaced — Auto Memory is opaque-ish. Acceptable given the maintenance burden of the prior implementation and the consistent behavior of the native feature. Migration: v4.6.0 deletes both files; the settings-merge logic gained an obsolete-pattern entry so existing installs are cleaned up on next `sync`.

---

### S1 deferred with pending items for v4.0 priority | 2026-03-29 | Status: Active

Chose: Archive S1 with S1-005 (npm publish) and S1-006 (GH Actions workflow) deferred rather than completing them before starting v4.0 work. Why: spike research identified high-priority gaps (negative test enforcement, UX friction lens, commands→skills migration) that should ship before the first public release. Completing S1-005/S1-006 (release automation) after v4.0 Tier 1+2 ensures the public release includes the quality improvements. S1-006 PR #84 remains open for human review. Tradeoff: npm package stays at v3.3.0 longer; GitHub Actions publish workflow delayed. Acceptable — manual release process works for current volume.

---

### v4.0 spike: platform alignment and quality gaps | 2026-03-29 | Status: Active

Chose: Invest in v4.0 (skills migration, negative test enforcement, UX friction lens, hooks expansion, context recalibration) before public release over shipping v3.3 as-is. Why: three production-observed quality gaps (LLM amnesia → hooks, smoke test illusion → UX lens, happy-path bias → negative test gate) directly impact user trust. Claude Code platform changes (skills system, 26 hooks, 1M context, custom subagents) create alignment debt if ignored. See `docs/spike-v4-research.md` for full research. Tradeoff: delays public npm/marketplace launch by one sprint cycle.

---

### context: fork only for quality-gate, not self-review | 2026-03-29 | Status: Active

Chose: Apply `context: fork` to `aam-quality-gate.md` only, not `aam-self-review.md`, over forking both. Why: self-review spawns multiple reviewer subagents (security, performance, API design, cost lenses). Claude Code subagents cannot spawn sub-subagents — running self-review with `context: fork` would make it a subagent, breaking its ability to spawn review lenses. Quality-gate runs sequential checks with no subagent spawning, so fork is safe. Tradeoff: self-review output pollutes the main sprint context; acceptable because it produces a structured summary, not verbose tool output.

---

### Drop plugin skill packages — project-local only | 2026-03-30 | Status: Active

Chose: Remove `skills/` directory (13 plugin packages) and make all skills project-local only over (a) keeping both and deduplicating at setup time, (b) making plugin skills authoritative and dropping project-local, or (c) making plugin skills stubs pointing to project-local. Why: Plugin skills had already drifted from project-local versions (still referenced PROGRESS.md, had different frontmatter). Duplication costs ~400-600 tokens per session in every target project. Plugin marketplace discoverability is not a current concern — the product has only been installed locally. Project-local skills are the maintained versions. Tradeoff: If plugin marketplace becomes relevant later, skill packages would need to be re-added or a new discovery mechanism created.

---

### Deterministic sync over prompt-driven update | 2026-03-30 | Status: Active

Chose: CLI `sync` command (`lib/sync.js`, `lib/migrations.js`, `lib/settings-merge.js`) that derives file operations from the filesystem at runtime over maintaining hardcoded file lists in the `/aam-update` prompt. Why: The 404-line prompt drifted from `project/` — audit found 6 obsolete rules still being copied, 10 agent files never mentioned, 5 new scripts missing, and contradictory instructions (marking files as obsolete then copying them). Root cause: two sources of truth (`lib/init.js` manifest vs prompt prose). The prompt retains judgment-heavy work (CLAUDE.md merge, optional feature prompts, edge cases) while the CLI handles deterministic operations (copy, delete, settings merge, migration chaining). Tradeoff: adds CLI complexity; mitigated by existing test infrastructure (160+ tests) and the `init` command pattern already proven.

---

### Drop /aam-update dry-run mode from backlog | 2026-03 | Status: Superseded

Superseded by v4.2 deterministic sync. Dry-run is now a first-class CLI flag (`npx aiagentminder sync --dry-run`), not a prompt behavior. The original rationale (too much code overhead for a prompt-based dry-run) no longer applies — the CLI naturally supports it.

Original: Chose: Drop the dry-run backlog item over implementing it. Why: The update command is 374 lines with three file categories and multi-version migration paths. A real dry-run adds ~40-50% code overhead.

---

### Orchestrator spike: rules auto-load, sub-sub-agents blocked | 2026-03-30 | Status: Active

Chose: Proceed with orchestrator architecture (Approach C from spike doc) based on spike validation of all 6 prerequisites. Key findings: (a) `.claude/rules/` auto-load for sub-agents — eliminates base instructions problem entirely, (b) sub-agent spawning latency ~21s avg (acceptable), (c) parallel agent spawning works, (d) structured prompts/output contracts survive agent boundary, (e) sub-sub-agent spawning is NOT possible (Agent tool unavailable to sub-agents). Why: All prerequisites met or have clean workarounds. The sub-sub-agent constraint affects quality-reviewer (S8-006) — sprint-master must dispatch review lenses directly as first-level sub-agents. Tradeoff: orchestrator grows slightly for quality review orchestration; mitigated by parallel lens execution.

---

### settings-merge supports N AAM hooks per hook type | 2026-04-11 | Status: Active

Chose: Rewrite `mergeHookType` in `lib/settings-merge.js` to treat all template entries as authoritative and prepend them after stripping any existing AAM-managed entries from the target, over the v4.2 logic that assumed exactly one AAM entry per hook type and updated it in place. Why: v4.3's hook-based quality gate adds a second PreToolUse entry (`pre-pr-gate-hook.sh`, matcher `Bash`) and a second PostToolUse entry (`post-write-lint-hook.sh`, matcher `Write|Edit`). The old single-entry logic would have silently dropped the second AAM hook during `/aam-update` on existing installations, breaking the feature for every downstream repo. Alternatives considered: (a) keep one entry and bundle both hooks under a single matcher — rejected because Claude Code matchers are not multi-value and the hooks target different tools, (b) ship a migration that rewrites `settings.json` — rejected because the deterministic merge path is the correct place for authoritative template→target reconciliation. Tradeoff: user-added hook entries that happen to reference `.claude/scripts/` paths get treated as AAM-managed and replaced on merge; mitigated by the convention that user hooks live outside `.claude/scripts/`. Shipped in v4.3.0 alongside the quality gate hardening backport (PR #143).

---

### Context cycling: sprint-gated with session-relative thresholds | 2026-05-07 | Status: Active

Chose: Re-scope the context-cycling system to fire only when (a) `SPRINT.md` Status is `in-progress` AND (b) the **current session** has used delta tokens above threshold from a recorded session_floor, over the prior design that fired whenever `.context-usage` said `should_cycle=true` regardless of sprint state or whether tokens were session-cumulative or conversation-cumulative. Also: expanded the allowed-tool list during an active cycle from `Bash|Write|Read` to `Bash|Write|Read|Edit`, and registered the continuation hook under both `startup` AND `resume` SessionStart matchers (was `startup` only). Why: the dungeon-game 2026-05-06 incident exposed six failure modes (F1–F6) where the old design caused work-loss instead of preventing it — non-sprint sessions in template-consuming repos got blocked during creative work; resumed sessions hit `should_cycle=true` immediately because conversation totals already exceeded threshold; mid-edit cycles forced agents into Bash-via-Python file rewrites; `claude --continue` resumes silently skipped continuation injection. Alternatives considered: (a) always-on cycling (rejected — punishes non-sprint work), (b) opt-in flag per repo (rejected — friction; users won't remember to enable for sprints), (c) keep absolute-token threshold and rely on SessionStart reset alone (rejected — F2 would still re-trigger on next status-line tick), (d) block ALL tools during cycle including Bash/Write/Read (rejected — cycle protocol requires git commit). Tradeoff: non-sprint sessions no longer get auto-cycle protection — users must manage their own context for design/research work. Mitigated by the soft advisory the hook still emits at threshold, which is enough signal for a human to /exit when convenient. Shipped in S9 (PRs #154, #155, #156, #157, #158).

---

### SessionStart hook output must carry hookEventName; tests assert the envelope | 2026-05-28 | Status: Active

Chose: Always include `"hookEventName":"SessionStart"` in `session-start-hook.sh`'s `hookSpecificOutput` JSON, and assert that envelope field (not just `additionalContext`) in `tests/session-start-hook.test.js`, over the prior output that emitted `additionalContext` alone. Why: Claude Code's SessionStart hook contract rejects a `hookSpecificOutput` object lacking `hookEventName` with "missing required field hookEventName" — which surfaced in the field as a `SessionStart hook error` and silently dropped the injected context. It shipped because the test suite asserted the payload (`additionalContext`) but never the envelope contract, so the malformed JSON passed CI. (Discovered against the v5.0 context-cycle resume path; v5.1.0 concurrently retired that protocol — see the entry above — so `session-start-hook.sh` now emits only the active-sprint reminder, which carried the identical defect via its `jq` output and is fixed the same way.) General principle: any hook emitting structured `hookSpecificOutput` must include the matching `hookEventName`, and hook tests must validate the full envelope Claude Code requires, not only the payload field under test. Tradeoff: none material — the envelope value is a fixed string per hook event. See issue #170 / PR #171.

---

## Known Debt

> Record shortcuts, workarounds, and deferred quality work here.

| ID | Description | Impact | Logged | Sprint |
|---|---|---|---|---|
<!-- Debt entries go here -->

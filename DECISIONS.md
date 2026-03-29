# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.
> Not auto-loaded. Add `@DECISIONS.md` to CLAUDE.md to auto-load.
>
> **When to log:** command/rule design choices, hook architecture, install mechanism changes, naming conventions.

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

### Drop /aam-update dry-run mode from backlog | 2026-03 | Status: Active

Chose: Drop the dry-run backlog item over implementing it. Why: The update command is 374 lines with three file categories and multi-version migration paths. A real dry-run adds ~40-50% code overhead and creates a parallel path that must stay in sync. Risk is already mitigated — git tracks all changes, the command is idempotent, and user-owned files are explicitly never touched. If more safety is needed later, a pre-flight summary expansion (~20 lines) gives 80% of the value. Tradeoff: Users cannot preview changes before committing — but they can `git diff` after and `git reset --hard` if unhappy.

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

### Automated correction capture via PostToolUse hook | 2026-03 | Status: Active

Chose: PostToolUse hook (`correction-capture-hook.sh`) that tracks sequential tool calls and detects corrections (failed → retry with different args) over (a) keeping the passive self-reporting rule only or (b) PreToolUse hook (can't see results). Why: PostToolUse receives `tool_response` with success/failure data, enabling mechanical detection. Logs to `.corrections.jsonl` with pattern keys (e.g., `Bash:npm`) for grouping. Outputs `hookSpecificOutput.additionalContext` on 2nd occurrence so Claude sees the alert. Excludes transient errors (ETIMEDOUT, ECONNREFUSED, rate limits). Tradeoff: fires on every tool call; mitigated by fast jq-check path and fail-open without jq.

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

## Known Debt

> Record shortcuts, workarounds, and deferred quality work here.

| ID | Description | Impact | Logged | Sprint |
|---|---|---|---|---|
<!-- Debt entries go here -->

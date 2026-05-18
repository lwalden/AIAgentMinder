# Roadmap

This document tracks version history and future direction.

---

## v1.0 — Governance Maturity (shipped)

All v1.0 features have been implemented and merged. See [CHANGELOG.md](CHANGELOG.md) for details.

**Shipped:** `/aam-checkup` command, `/aam-scope-check` command, `approach-first.md` rule, `debug-checkpoint.md` rule, complexity budget in `/aam-milestone`, technical debt tracker (Known Debt in DECISIONS.md), risk-flagged issues in sprint planning, adaptive sprint sizing formalization, PROGRESS.md pruned, `/aam-handoff` refactored, CLAUDE.md context budget simplified.

## v1.1 — Command Prefix + Housekeeping (shipped)

**Shipped:** All commands renamed with `aam-` prefix to avoid collision with Claude Code built-in commands and other plugins. Docs reviewed and updated for accuracy. Analysis docs archived. Examples modernized.

---

## v1.2 — `/aam-revise` (shipped)

**Shipped:** Mid-stream plan revision command. Add, change, drop, or reprioritize features directly in `docs/strategy-roadmap.md` with decision logging and active sprint impact checks.

---

## v1.3 — Backlog Clearance (shipped)

**Shipped:** Roadmap versioning (`## Roadmap History` table + `/aam-revise` logging), GitHub Issues bridge (`/aam-sync-issues` optional command), missing skill packages for `aam-checkup` and `aam-scope-check`.

---

## v1.4.1 — Tool-First Autonomy (shipped)

**Shipped:** `tool-first.md` rule (always active) — Directs Claude to use CLI tools, APIs, and package managers instead of asking the user to perform actions manually.

---

## v1.4 — Development Methodology Skills (shipped)

Three new skills adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), reshaped for AIAgentMinder conventions:

- **`/aam-tdd`** — Guided TDD workflow (plan, tracer bullet, incremental RED-GREEN loop, refactor). Complements `code-quality.md`'s one-liner with the full methodology.
- **`/aam-triage`** — Structured bug triage: reproduce, diagnose root cause, design durable fix plan, create GitHub issue. Complements the debug checkpoint pattern (triage = structured start, checkpoint = structured pause).
- **`/aam-grill`** — Plan interrogation: walk every branch of the decision tree before implementation. Intensive counterpart to `approach-first.md`.

---

## v1.5 — Correction Capture (shipped)

**Shipped:** `correction-capture.md` rule (default-on) — self-monitors for repeated wrong-first-approach patterns within a session, proposes permanent `.claude/rules/` instructions on recurrence. `default-on` update category added to `/aam-update` taxonomy.

---

## v2.0 — Autonomous PR Pipeline (shipped)

- **`/aam-pr-pipeline` skill** — Autonomous review-fix-test-merge pipeline for PRs. Reviews with full repo context (not just the diff), evaluates each issue with a developer perspective, applies fixes, runs the test suite, waits for external CI checks, and auto-merges when everything is green. Escalates to the user via email or PR label for high-risk files, cycle limit, blocked tests, or unresolvable merge blockers.
- **`.pr-pipeline.json` config template** — Per-repo configuration for high-risk file patterns, cycle limit, auto-merge preference, merge method, notification email, and external check timeout.
- **Sprint workflow integration** — `sprint-workflow.md` invokes `/aam-pr-pipeline` in-session after PR creation. On success (merged), the sprint continues to the next issue. On escalation, the sprint stops for human intervention.

---

## v2.1 — In-Session Pipeline Execution (shipped)

Replaced the background hook-based pipeline with in-session execution. The sprint workflow now invokes `/aam-pr-pipeline` directly after creating a PR, eliminating the headless `claude -p` worktree approach and its associated issues (command files not loading, insufficient turns, context gaps).

### Changes from v2.0

- **Removed `pr-pipeline-trigger.js` hook** — No longer needed. The PostToolUse Bash hook that detected `gh pr create` output and spawned a background agent is gone.
- **Sprint continuation simplified** — After the pipeline merges a PR, control returns to the sprint workflow which naturally continues to the next issue. No headless spawning, no `autoContinueSprint` / `continueMaxIssues` config needed.
- **Reduced hook count** — Down to 1 hook script (`compact-reorient.js`).
- **`/aam-update` migration** — Removes the old hook file and PostToolUse settings entry from target projects.

---

## v3.0 — Autonomous Sprint Execution (shipped)

Complete rework of the sprint execution model. Addresses quality regression when users request reduced interruptions — Claude was conflating "stop asking permission" with "skip quality steps."

### Changes

- **State machine sprint workflow** — `sprint-workflow.md` rewritten as a numbered state machine (PLAN → SPEC → APPROVE → EXECUTE → TEST → REVIEW → MERGE → VALIDATE → NEXT → COMPLETE) with mandatory steps and defined transitions. Replaces prose-style guidance.
- **Mandatory quality checklist** — Non-skippable ordered checklist per item: TDD, full test suite, quality gate, self-review, PR pipeline. Explicit "NEVER SKIP" directive that overrides user requests to go faster.
- **Autonomous execution directive** — After spec approval, execute all items without asking permission between items. Human checkpoints only for: blockers, debug checkpoint, tests requiring human action, post-merge failures.
- **Spec phase** — New phase between sprint approval and execution. Each item gets a detailed implementation spec with approach, test plan (TDD RED targets), integration tests, post-merge validation tasks, file list, and dependencies. Specs are presented for human approval before coding begins.
- **Post-merge validation** — New `Post-Merge` column in SPRINT.md. Items can define tests that require deployment or external services. Sprint cannot close until all post-merge validations pass. Failed validations create rework tasks.
- **Rework cycle** — Defined path for test failures: diagnose → create rework task → execute through full cycle → re-validate. Sprint tracks rework count as a stress indicator.
- **Default to Comprehensive** — `/aam-brief` no longer asks about quality tiers or optional features. Defaults to Comprehensive with all governance features enabled. One-line notification instead of multi-round ceremony.
- **Quality gate always full** — `/aam-quality-gate` runs all checks every time (build, tests, coverage, lint, security). No tier-dependent skipping.
- **Self-review always runs** — `/aam-self-review` runs for every item, not just risk-tagged or high-tier items.
- **Retrospective tracks rework** — `/aam-retrospective` includes rework count and post-merge validation metrics as stress indicators for adaptive sizing.

---

## v3.1 — Autonomous Context Cycling (shipped)

Addresses context degradation during long sprint sessions. After 3+ items, conversation context fills up, compaction loses fidelity, and quality drops on remaining items. Claude now detects this and cycles to a fresh session autonomously.

### Changes

- **CONTEXT_CYCLE state** — New state in the sprint state machine. At each NEXT transition, Claude evaluates context pressure (items completed, compaction history, debugging intensity). When warranted, persists state and self-terminates.
- **Self-termination mechanism** — `context-cycle.sh` traces `/proc/$$/winpid` up the Windows process tree via WMI to find `claude.exe`, then kills it with `taskkill`. Same terminal, same env vars.
- **PowerShell profile hook** — `install-profile-hook.ps1` adds a prompt function to `$PROFILE` that catches the signal file after Claude exits and auto-starts a fresh instance. Works regardless of how Claude was started — no wrapper required.
- **Sprint-runner wrapper** — `sprint-runner.ps1` provides a loop-based alternative for dedicated sprint sessions.
- **Continuation file format** — `.sprint-continuation.md` captures resume point, completed items, and critical ephemeral context. New session reads it alongside CLAUDE.md, rules, and SPRINT.md (all auto-loaded).
- **Cross-platform** — Windows (PowerShell + Git Bash WMI tracing), macOS, and Linux (bash/zsh + native `ps` ppid tracing). Scripts provided for both platforms.

---

## v3.2 — Real-Time Context Monitoring (shipped)

Replace heuristic-based context cycling with real token count monitoring via Claude Code's status line system. Also removes the `compact-reorient.js` hook and its Node.js dependency — the status line detects context pressure *before* compaction, making the reactive hook redundant.

### Changes

- **`context-monitor.sh` status line data bridge** — New script in `project/.claude/scripts/`. Receives status line JSON (context window metrics, model info) after every assistant message. Writes `.context-usage` to project root with `should_cycle` boolean based on model-specific token thresholds (250k Sonnet, 350k Opus, 35% fallback for unknown models).
- **`settings.json` updated** — `statusLine` config replaces the `SessionStart` compact hook. Points to `context-monitor.sh`.
- **Remove `compact-reorient.js`** — Delete the hook script and `project/.claude/hooks/` directory.
- **Sprint workflow CONTEXT_CYCLE** — Primary signal is now `.context-usage` file. Falls back to heuristics (3+ items, debugging, rework) when file doesn't exist (status line not configured). "Compaction occurred" heuristic removed.
- **Zero Node.js dependency** — The project becomes pure Markdown + shell scripts. Requires `jq` for JSON parsing.
- **`/aam-update` migration** — Removes the compact hook, adds status line config, copies `context-monitor.sh`.

---

## v3.3 — Architecture Fitness, CLI Distribution & Versioning (shipped)

Concrete architecture fitness defaults, npm/npx distribution, plugin marketplace, and a formal versioning policy.

### Architecture Fitness Defaults

- Replace the blank placeholder `architecture-fitness.md` with 4 concrete, stack-agnostic rules: file size (300-line flag), secrets in source, test isolation, and layer boundaries.
- Commented stack-specific examples (C#/.NET, TypeScript/React, Python, Java/Spring) that users can uncomment.
- Auto-customize rules during `/aam-setup` based on codebase fingerprinting (detected stack).

### CLI Distribution

- **npm/npx installer** — `npx aiagentminder init` with `--all`/`--core`/interactive modes. Zero runtime dependencies.
- **AGENTS.md generation** — `npx aiagentminder agents-md` reads installed governance files and exports an AGENTS.md for non-Claude tools.
- **Codebase fingerprinting** — Auto-detects language, framework, test runner, CI provider, and lint config during setup.
- **Plugin marketplace listing** — `.claude-plugin/` manifests aligned to 3.3.0. `npx aiagentminder validate` for CI.

### Efficiency

- **`sprint-update.sh`** — Zero-token-cost SPRINT.md table updater. Mechanically updates status, post-merge, and sprint-status cells so the LLM doesn't burn tokens on file I/O.

### Versioning & Release

- **Strict semver policy** — MAJOR = breaking/migration, MINOR = new features, PATCH = bug fixes. Unified across npm, plugin, marketplace, and version stamp.
- **GitHub Releases adoption** — Each version gets a git tag and release with auto-generated notes. Manual checklist documented in `docs/RELEASING.md`.
- **Batching policy** — Multiple PRs land per version; bump once at release time. Sprint boundaries as natural release trigger.

---

## v4.0 — Platform Alignment & Quality Gap Closure (shipped)

Driven by spike research (see `docs/spike-v4-research.md`) identifying three systemic problems — LLM amnesia (instructions ignored mid-execution), smoke test illusion (tests pass but UX is broken), and happy-path bias (no negative test coverage) — plus Claude Code platform changes (26 hook events, skills system, 1M context, custom subagents).

### Tier 1 — Directly addresses identified problems (shipped)

- **Commands → skills migration** — Migrated 14 `aam-*` files from `project/.claude/commands/` to `project/.claude/skills/`. Key wins: `context: fork` for quality gate (isolated context), per-skill `effort` levels. (S2-001)
- **Context cycling recalibration** — Updated thresholds for 1M context: 500k Sonnet, 580k Opus (was 250k/350k). (S2-002)
- **Negative test enforcement** — Quality-gate check verifying test files contain error-path/negative assertions. Configurable via `negativeTestEnforcement` in `.pr-pipeline.json`. (S2-003)
- **UX friction review lens** — 5th self-review lens covering error messages, feedback, output consistency, and discoverability. (S2-004)
- **Judge agent pass** — Post-review filter in `/aam-self-review`: judge subagent evaluates collective review quality for missed issues and cross-cutting concerns. (S2-005)
- **Setup auto-detection** — `detectExistingInstall()` detects version stamp, aam- skills, and managed rules. Init warns on existing installation. (S2-006)

### Tier 2 — Strategic strengthening (shipped)

- **New hooks integration** — Added SessionStart (sprint continuation auto-detection) and StopFailure (API error logging, sprint state preservation). PermissionRequest deferred — needs design for auto-approval policies. (S2-007)
- **Hooks schema fix** — PostToolUse and Stop hooks in settings template corrected to `{ matcher, hooks: [...] }` format. (S2-009)
- **Custom subagents for review lenses** — 5 reviewer agents (`security-reviewer`, `performance-reviewer`, `api-reviewer`, `cost-reviewer`, `ux-reviewer`) with `disallowedTools: [Edit, Write, Bash]` (read-only), per-lens `model`/`effort`. `/aam-self-review` spawns agents by name instead of inline prompts. (S4-003, S4-005)
- ~~**Rule file compression**~~ — Subsumed by session profiles (v4.1). Mode-specific rules load only in relevant agent profiles, eliminating the need to compress individual files.
- ~~**Ephemeral task context injection**~~ — Subsumed by session profiles (v4.1). Agent definitions ARE the phase-specific rule loading mechanism.

---

## v4.1 — Session Profiles & Backlog Management (shipped)

Based on session architecture spike (see `docs/spike-session-architecture.md`, Approach B). Reduces context loading by 75% for non-sprint sessions and formalizes backlog capture.

### Session Profiles

- **5 session profile agents** — `sprint-executor` (full sprint state machine), `dev` (TDD + architecture fitness), `debug` (checkpoint + triage), `hotfix` (minimal ceremony), `qa` (quality review). Use via `claude --agent <name>`. (S3-001)
- **Rule reorganization** — Mode-specific rules moved from `.claude/rules/` to agent definitions. Universal rules only: `git-workflow`, `tool-first`, `correction-capture`, `context-cycling` (new, decoupled from sprint). (S3-002)
- **Sprint-runner `--agent` flag** — Defaults to `sprint-executor`. Both PS1 and bash versions. (S3-003)
- **Updated setup/update** — `/aam-setup` installs agents as core files. `/aam-update` handles v3.x→v4.1 migration (adds agents, marks old rules as obsolete). (S3-003)

### Backlog Capture System

- **`backlog-capture.sh`** — Zero-token-cost script with 5 subcommands: `add`, `list`, `promote`, `detail`, `count`. B-NNN auto-incrementing IDs, input validation, atomic file updates. (S3-004)
- **`BACKLOG.md`** — Work inbox template managed by the script. (S3-005)
- **`/aam-backlog`** — Capture/review/promote skill. All file I/O through the script. (S3-005)
- **Integration touchpoints** — Scope guardian offers "capture to backlog" option. Sprint PLAN reads backlog. `/aam-revise` gains "defer to backlog" option. (S3-006)

---

## v4.2 — Deterministic Sync (shipped)

Replaced `/aam-update`'s 404-line hardcoded prompt with a CLI-driven sync command. File operations derived from the filesystem at runtime — no hardcoded file lists. Also removed plugin skill packages to eliminate context duplication in target projects.

**Shipped:** `lib/sync.js` (diff engine), `lib/migrations.js` (version-chained registry, 7 migrations v0.7–v4.1), `lib/settings-merge.js` (additive merge), CLI `sync` command (`--dry-run`/`--apply`/`--force`), `/aam-update` rewrite (404→112 lines), `/aam-setup` rewrite (183→139 lines), plugin skill removal (13 packages, ~600 tokens/session saved), manifest consistency tests. 60 new tests. PRs #107-116.

### Plugin Skill Removal

- **Remove `skills/` directory** — 13 plugin skill packages deleted. Skills are project-local only (copied by `/aam-setup`), not loaded via plugin.
- **Update `plugin.json`** — Remove `"skills": "./skills/"` reference. Plugin provides CLI only.
- **Update `npx aiagentminder validate`** — Stop validating skill packages (they no longer exist).
- **Context savings** — Eliminates ~400-600 tokens of duplicate skill index loaded per session in every target project that also has the plugin installed.

### Deterministic CLI (`lib/`)

- **`lib/sync.js`** — Reads `project/` template and target installation, computes a structured diff (files to add, update, delete). No hardcoded manifest — walks the filesystem. Outputs a plan object consumed by both CLI and `/aam-update`.
- **`lib/migrations.js`** — Version-chained migration registry. Each version bump registers: files made obsolete, renames, structural changes (e.g., `commands/ → skills/`, `rules/ → agents/`). `sync` walks the chain from installed version → current and accumulates operations. New migrations = add a data entry, not edit a prompt.
- **`lib/settings-merge.js`** — Additive merge of `settings.json.tpl` into target's `settings.json`. Adds/updates AIAgentMinder-managed hooks, preserves user-added hooks. Deterministic JSON operation.
- **CLI `sync` command** — `npx aiagentminder sync [target-path]`. `--dry-run` (default) shows the plan. `--apply` executes. `--force` overwrites user-owned files.

### Prompt Rewrite

- **`/aam-update` rewrite** — Thin orchestration (~100 lines). Calls `npx aiagentminder sync --dry-run` for the plan, presents it to the user, handles optional feature prompts and CLAUDE.md surgical merge, then calls `sync --apply`.
- **Manifest unification** — `getCoreFiles()` and `getOptionalFiles()` in `lib/init.js` become the single source of truth for both `init` and `sync`. Or replaced entirely by filesystem walking in `sync.js`.

### Acceptance Criteria

- `npx aiagentminder sync D:\Source\accessi-shield --dry-run` produces correct add/update/delete plan for v3.3→v4.2 upgrade
- `npx aiagentminder sync --apply` executes all file operations deterministically (copy, delete, merge settings)
- Migration registry correctly chains v3.3→v4.0→v4.1→v4.2 operations
- `/aam-update` prompt is ≤120 lines and delegates all file operations to CLI
- Settings merge preserves user-added hooks while adding/updating AIAgentMinder hooks
- No hardcoded file lists in `/aam-update` prompt — all derived from template or migration registry
- Tests cover: sync diff computation, migration chaining, settings merge (additive, idempotent), CLI flags
- `skills/` directory removed; `plugin.json` has no `skills` key; `validate` passes without skill packages
- Target projects with plugin installed show no duplicate skill entries in `/` menu

---

## Direction

v4.2 shipped deterministic sync. The roadmap is informed by the March 2026 architecture assessment (`docs/architecture-assessment-2026-03.md`), which mapped AAM against 30+ competing tools. Key finding: AAM's moat is execution governance (sprint state machine + quality gates + context cycling), not rules — the market is converging on rules sync, but nobody else is attempting enforcement at this depth.

Unscheduled work is tracked in `BACKLOG.md`. Run `/aiagentminder:backlog` to capture, review, or promote items.

---

## v5.0 — Plugin Packaging + Worktree Isolation (shipped)

Distribution model changed from npm to Claude Code plugin. AAM is now installed via `/plugin marketplace add lwalden/AIAgentMinder` followed by `/plugin install aiagentminder@lwalden-aiagentminder`, then `/aiagentminder:setup` in the target project. The npm CLI (`npx aiagentminder init`) is retired.

### Plugin Distribution

- **Repo restructured** to plugin convention: `agents/`, `skills/<name>/SKILL.md`, `bin/`, `hooks/hooks.json` at root. Project-bootstrap templates live in `templates/` and are copied into the target by `/aiagentminder:setup`.
- **Skills namespaced** under `/aiagentminder:X` (e.g. `/aiagentminder:tdd`). The defensive `aam-` prefix is dropped since plugin namespacing handles collision avoidance.
- **`/aiagentminder:setup` skill** replaces `npx aiagentminder init`. Interactive — detects existing installs, fingerprints codebase, prompts for project identity, runs `bin/aam-bootstrap.sh` for mechanical file copies, customizes `CLAUDE.md`, augments `.gitignore`.
- **npm CLI retired.** `bin/aam.js`, `lib/init.js`, `lib/sync.js`, `lib/migrations.js`, `lib/settings-merge.js`, `lib/agents-md.js`, `lib/cli.js`, `lib/prompt.js`, `lib/detect.js` deleted. `lib/validate.js` kept for CI version-consistency checks.

### Worktree-Isolated Sprint Items

- **`isolation: "worktree"`** — sprint-master spawns item-executor in an isolated git worktree off `origin/<default-branch>` (Claude Code's `worktree.baseRef: fresh`). Each item runs in its own working tree, eliminating contention between concurrent items and keeping unrelated in-flight work on `main` out of new items.
- **Push-before-return contract** — item-executor pushes its branch to origin before reporting `done`. pr-pipeliner runs in the main worktree and fetches the branch.
- **Output contract change** — `"done: branch={name} commit={hash}"` (was `"done: {hash}"`) so sprint-master can forward the branch name to pr-pipeliner during REVIEW.

### `/goal` Compatibility

- Documented Claude Code 2.1.139's native `/goal` command as a lightweight alternative to AAM's executive-layer dispatch mode. Sprint-master's human-checkpoint protocol is unchanged: `.sprint-human-checkpoint` + end-of-turn output stops the `/goal` evaluator from auto-resuming.

### Cleanup

- Retired `correction-capture` rule and PostToolUse hook (superseded by Claude Code's native Auto Memory, 2.1.59+).
- Retired root meta-commands `/aam-setup` and `/aam-update` — replaced by the bundled `/aiagentminder:setup` skill.

### Community Presence (no code)

- **List on buildwithclaude** — Primary Claude Code extension discovery hub.
- **List on awesome-claude-code-toolkit** — Secondary discovery hub.

---

## v5.1 — Context Redesign + Web-Compat Docs (shipped)

Two-patch release line that resimplified AAM's context management and clarified where the plugin runs.

### v5.1.0 — Auto-cycle protocol retired

- **`context-warning-hook.sh`** — new `Stop` hook that injects an advisory warning when `.context-usage` shows over-threshold. User picks `/aiagentminder:handoff` + `/exit` or keeps going. No tool blocking, no auto-restart, no `.sprint-continuation.md` writing.
- **Deleted** — `context-cycle-hook.sh`, `session-end-cycle.sh`, `session-start-continuation.sh`, and three corresponding test files (~910 lines). Replaced with `context-warning-hook.sh` + `sprint-phase-reminder.sh` (~220 lines).
- **`sprint-phase-guard.sh` split** (issue #152) — phase blocking stays on `PreToolUse` but moves to `matcher: "Agent"`. Per-turn phase reminders move to a new `Stop` hook (`sprint-phase-reminder.sh`). Eliminates the empty-matcher per-tool-call bash spawn.
- **JSON safety** (issue #152) — `hlpm-ping.sh` and `session-start-hook.sh` rebuilt with `jq -n --arg` instead of `printf`/`sed`. Repos/branches/events with quotes, backslashes, or control chars no longer corrupt JSON.
- **Backlog acceptance criterion completed** (issue #95) — "Capture to backlog" added as fourth option in `skills/scope-check/SKILL.md`.
- **Stale command refs cleaned up** — five `/aam-X` references in templates and roadmap updated to `/aiagentminder:X`.
- Rationale: see DECISIONS.md → "Replace autonomous context-cycle protocol with a passive Stop-hook warning".

### v5.1.1 — Web-session compatibility callout

- **`README.md`** — Added "Where this works" table directly under Quick Start. States plainly that AAM runs on Claude Code CLI and the VS Code / JetBrains extensions but **not** on `claude.ai/code` web sessions (no plugin loader → no slash commands, sub-agents, hooks, or `bin/` scripts). Notes that `/aiagentminder:setup`-installed repo artifacts remain readable from web because they live in the repo itself. Mobile / Claude desktop app parity declared a non-goal.
- **README cleanup** — folded in stale v5.0 cycle-protocol references the v5.1.0 PR missed: hook/script table, rules table, "Context cycling" section, top-level "What It Does" bullet, doc-link footer.

---

## v5.2+ — Portability & Ecosystem (deferred indefinitely)

Originally scoped as v5.1. Three items, all blocked on the v5.0 npm CLI removal, plus a marketing item that has no technical blocker but doesn't fit the current direction:

- **AGENTS.md bidirectional sync** — Originally `npx aiagentminder agents-md --import`. Deferred: the npm CLI was retired in v5.0; reshape required (plugin skill or `bin/` script) before this can be built. The export side (`npx aiagentminder agents-md`) likewise no longer exists.
- **Cross-tool rule export** — Originally `npx aiagentminder export --format cursorrules|copilot|agents-md`. Same blocker as above.
- **Release automation (GitHub Actions publish)** — Originally targeted npm publish. Plugin distribution doesn't go through npm anymore; if revived, would need to be reshaped around plugin marketplace + GitHub Release publishing. Deferred from S1 (PR #84 closed).
- **"Mechanical Enforcement" blog post** — No technical blocker, but pure marketing work; not on the current build path.

No active intent to revisit. If you want any of these, file an issue and we'll evaluate fresh against the v5.1 architecture.

---

## Future Direction (monitor)

- **Claude Code native marketplace** — If Anthropic launches one, be a first-mover. `.claude-plugin/` manifest already positions AAM.
- **Agent Teams stability** — Claude Code agent teams (experimental, Feb 2026). Multi-agent sprints with TeammateIdle/TaskCreated/TaskCompleted hooks. When it exits experimental, multi-agent sprint execution becomes possible.
- **Path-scoped rules** — Copilot supports `.instructions.md` per path; Cursor supports glob-scoped rules. If Claude Code adds native path-scoped rule support, adopt immediately. Relevant for monorepos with mixed stacks.
- **Auto mode compatibility** — Claude Code auto mode (research preview, Mar 2026). Test interaction with AAM's PermissionRequest hooks and stop guards.
- **AGENTS.md spec evolution** — Track spec changes. Currently moot — bidirectional sync deferred indefinitely (see v5.2+).

### Dropped

- **`/aam-release` command** — Release automation (changelog, version bump, GitHub release). Not needed — GitHub releases aren't part of the current workflow.
- **`/aam-handoff` JSON digest** — Speculative value. Nobody has asked for it.
- **`/onboard` command** — `/aam-brief` Starting Point E (existing project audit) covers this use case.
- **Quality tier selection** — Replaced with always-Comprehensive default in v3.0.
- **`/aam-update` dry-run mode (as a prompt feature)** — Superseded by v4.2 deterministic sync. Dry-run is now a CLI flag (`npx aiagentminder sync --dry-run`), not a prompt behavior.
- **HTTP hook support** — Node.js dependency already removed in v3.2.
- **Versioning scheme reset to v1.0.0** — Resolved: continue v3.x with strict semver. See DECISIONS.md.
- **Cross-platform portability as a major initiative** — Assessment: "own the Claude Code positioning rather than trying to be everything." The governance workflow (hooks, stop guards, context cycling) is inherently Claude Code-specific. Rules portability is addressed by v5.1 export, not by rebuilding the framework for other tools.
- **Worktree-native sprint items** — Each sprint item in `isolation: "worktree"`. Removed from monitor — not identified as a priority by the competitive assessment, and context cycling already handles multi-item session management.

---

## Roadmap History

| Date | Change | Reason |
|---|---|---|
| 2026-03-30 | Added: v4.2 Deterministic Sync | `/aam-update` prompt drifted from template — 6 obsolete rules still copied, 10 agent files missing, 5 scripts missing. Two sources of truth (prompt vs `lib/init.js`) always out of sync. |
| 2026-03-30 | Changed: `/aam-update` dry-run → Dropped (superseded) | Dry-run is now a CLI flag on `npx aiagentminder sync`, not a prompt behavior. |
| 2026-03-30 | Added: Plugin skill removal (v4.2) | Plugin skills duplicate project-local skills — ~600 tokens dead weight per session. Plugin provides CLI only; discoverability is a future concern. |
| 2026-03-30 | Changed: Release Automation note | PR #84 closed — npm infrastructure not yet configured. |
| 2026-03-30 | Post-v4.2 hardening (S7) | Fix `init --force` settings merge, stale skill references, jq check in sync, branch cleanup, README rules table update for v4.1 session profiles. |
| 2026-03-30 | Roadmap refinement from architecture assessment | Assessment (`docs/architecture-assessment-2026-03.md`) mapped AAM vs. 30+ tools. Refined v5.0 (added metrics collection, community listings), added v5.1 (AGENTS.md bidirectional sync, cross-tool export, mechanical enforcement publication), restructured Future Direction into monitor/dropped tiers, dropped cross-platform portability initiative and worktree-native items. |

*Last revised 2026-03-30 (architecture assessment refinement)*

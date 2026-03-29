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
- **`/aam-triage`** — Structured bug triage: reproduce, diagnose root cause, design durable fix plan, create GitHub issue. Complements `debug-checkpoint.md` (triage = structured start, checkpoint = structured pause).
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

## Direction

The current design is stable. The backlog below was populated from a competitive landscape analysis (March 2026) covering 70+ repos and tools. Items are grouped by theme, not priority.

---

## Backlog (unscheduled)

### Distribution & Visibility

- ~~**npm/npx installer**~~ — Shipped in v3.3.
- ~~**Plugin marketplace listing**~~ — Shipped in v3.3.
- ~~**AGENTS.md generation**~~ — Shipped in v3.3.

### Architecture Fitness Defaults

- ~~**Ship concrete universal rules**~~ — Shipped in v3.3.
- ~~**Stack-aware template selection in `/aam-setup`**~~ — Shipped in v3.3 (codebase fingerprinting + auto-customize).

### Quality & Review

- **Automated correction capture** — claude-reflect (858 stars) automates what `correction-capture.md` does passively — it uses hooks to detect correction patterns and auto-queues learnings. Upgrade from passive rule guidance to active hook-based detection, making corrections discoverable without relying on Claude self-reporting.
- ~~**Multi-model review gate**~~ — Shipped. `/aam-self-review` Step 3b spawns a cross-model review subagent when `crossModelReview.enabled` is set in `.pr-pipeline.json`. Degrades gracefully when second model is unavailable.

### Efficiency

- ~~**Zero-token-cost tracking**~~ — Shipped in v3.3 (`sprint-update.sh`, `version-bump.sh`, `decisions-log.sh`).
- ~~**Codebase fingerprinting in setup**~~ — Shipped in v3.3.

### Release Automation

- **GitHub Actions publish workflow** — Automate npm publish + plugin manifest validation on GitHub Release creation. Currently manual (see `docs/RELEASING.md`).

### Dropped

- **`/aam-release` command** — Release automation (changelog, version bump, GitHub release). Not needed — GitHub releases aren't part of the current workflow.
- **`/aam-handoff` JSON digest** — Speculative value. Nobody has asked for it.
- **`/onboard` command** — `/aam-brief` Starting Point E (existing project audit) covers this use case.
- **Quality tier selection** — Replaced with always-Comprehensive default in v3.0.
- **`/aam-update` dry-run mode** — Git already tracks all changes, the command is idempotent, and user-owned files are never touched. The risk dry-run mitigates is already low enough.
- **HTTP hook support** — Node.js dependency already removed in v3.2. No further work needed in this area.
- **Versioning scheme reset to v1.0.0** — Resolved: continue v3.x with strict semver and unified versioning. See DECISIONS.md.

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

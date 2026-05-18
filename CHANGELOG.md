# Changelog

All notable changes to AIAgentMinder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [5.1.1] - 2026-05-17

### Changed

#### README — first major revision since v4.3

The README has been rewritten with a value-first structure. Previous versions opened with category ("adds project governance") and front-loaded internal architecture; new version leads with concrete wins, surfaces the five hub features readers actually use day-to-day, and pushes reference tables into collapsible sections so first-time visitors aren't drowning in command/rule/hook inventories.

New / reorganized sections:

- **"The 30-second case"** — 5 concrete wins (autonomous sprints, cross-model self-review, autonomous PR pipeline, clean handoff, plan/decision discipline) replacing the prior 3-bullet abstract "What It Does".
- **"Where this works"** — explicit table showing ✅ for CLI / VS Code / JetBrains and ❌ for `claude.ai/code` web sessions. (Originally added under Quick Start in this release; promoted to a top-level section.)
- **"What you actually use"** — five hub features with trigger and outcome rather than a flat command table.
- **"See it in action"** — links to `examples/demo-transcript.md` for a concrete walkthrough.
- **"When NOT to use this"** — merged honesty section combining the prior "When to Use" and "Non-Goals".
- **"Reference"** — collapsible `<details>` blocks for skills, sub-agents, hooks/scripts, and installed files. Same content as before, no longer in the reader's face.

Stale content removed:

- **Mode-specific rules table** that listed six retired rule files (`approach-first.md`, `debug-checkpoint.md`, `code-quality.md`, `scope-guardian.md`, `architecture-fitness.md`, `sprint-workflow.md`). These were retired in v4.x but the README still listed them as if they shipped. Replaced with the current 3-rule baseline (`git-workflow`, `tool-first`, `context-warnings`).
- **Stale session-profiles section** demoted from its own top-level section into the Reference → Sub-agents block. Most users never reach for these.

Net: 245 lines → ~225 lines, with significantly less stale content and the first-impression surface focused on what's worth the install.

### Fixed

- **`SKILL.md` (repo root)** — Deleted. This was a v0.x/v1.x placeholder labeled "Status: v3.3.0", referencing the retired `npx aiagentminder init` and `/aam-setup`. Modern plugin metadata lives in `.claude-plugin/plugin.json`; legitimate `SKILL.md` files all live at `skills/<name>/SKILL.md`. The root file was dead weight that misrepresented current state.
- **`examples/demo-transcript.md`** — Updated five stale `/aam-X` command references to `/aiagentminder:X` (brief, handoff, quality-gate, self-review, retrospective).
- **`examples/README.md`** — Updated `project/` directory reference to `templates/` (the directory was renamed in v5.0).
- **`CONTRIBUTING.md`** — Same `project/` → `templates/` fix. Also clarified the three change categories: plugin payload (ships via marketplace), bootstrap templates (installed by `/aiagentminder:setup`), and meta-docs (this repo only).
- **`docs/how-it-works.md` + `docs/customization-guide.md`** — Both files still described `code-quality.md` and `sprint-workflow.md` as opt-in rule files. Those rules were retired in v4.x (code-quality) and v5.0 (sprint-workflow) when the methodology moved into agents (`item-executor`, `quality-reviewer`, `sprint-master`) and hooks (`sprint-phase-guard.sh`). Both sections rewritten to reflect agent-based enforcement and note that the rule files no longer exist. Section heading changed from "Optional Features" to "Quality and Sprint Execution" to match.

### Fixed (carried over from initial v5.1.1 scope)

Stale v5.0 cycle-protocol references in README that the v5.1.0 PR missed:

- Hooks & scripts table updated to match v5.1.0 reality — removed the three deleted scripts (`context-cycle-hook.sh`, `session-end-cycle.sh`, `session-start-continuation.sh`), added the two replacements (`context-warning-hook.sh`, `sprint-phase-reminder.sh`), and noted `matcher: "Agent"` on `sprint-phase-guard.sh`.
- Rules table: `context-cycling.md` → `context-warnings.md`.
- "Context cycling" section → "Context warnings (v5.1+)" — rewrote to describe the advisory model and link to `DECISIONS.md` / `CHANGELOG.md` for the rationale.
- Top-level "What It Does" bullet on context management updated to drop the "autonomous context cycling across sessions" phrasing.
- Footer doc-link description updated.

### Roadmap reconciled

- **`docs/strategy-roadmap.md`** — The v5.1 heading previously held an unbuilt "Portability & Ecosystem" scope (AGENTS.md bidirectional sync, cross-tool rule export, "Mechanical Enforcement" blog post, release automation). All three code items referenced the npm CLI retired in v5.0, so they were stale on arrival. Replaced the section with what v5.1 actually shipped (context redesign + web-compat docs), and moved the unbuilt portability work to a new "v5.2+ — Portability & Ecosystem (deferred indefinitely)" section noting the npm-CLI blocker and that any revival would require a fresh evaluation. Restored the "Future Direction (monitor)" heading that the section edit briefly orphaned.

### Notes

Documentation-only release. No behavior change. No test impact (309/309 green). Existing v5.1.0 installs need only `/plugin update aiagentminder` to pick up the version stamp and refreshed docs; no re-run of `/aiagentminder:setup` required.

---

## [5.1.0] - 2026-05-17

### Changed

#### Context management redesigned (BREAKING for projects relying on auto-cycle)

The v5.0 autonomous context-cycle protocol — PreToolUse tool-blocking, SessionEnd writing `.sprint-continuation.md`, SessionStart consuming it, `.sprint-tool-count` fallback — is retired. Replaced with a single `Stop` hook (`bin/context-warning-hook.sh`) that injects an advisory message when `.context-usage` says `should_cycle=true`. The user picks the next step:

- **Wrap up cleanly:** run `/aiagentminder:handoff` (writes "Next Session" into Claude Code's native Auto Memory), commit, `/exit`. Start the next session and say "resume work".
- **Keep going:** the warning re-fires every turn while still over threshold. No tool blocking, no auto-restart.

Rationale and trade-offs: see DECISIONS.md → "Replace autonomous context-cycle protocol with a passive Stop-hook warning". Short version: the autonomous flow required slash commands users can't issue from the mobile Claude app, self-termination disconnected mobile observers, and the protocol was dormant on Claude Code web anyway.

**Deleted:** `bin/context-cycle-hook.sh`, `bin/session-end-cycle.sh`, `bin/session-start-continuation.sh`, `tests/context-cycle-hook.test.js`, `tests/cycling-resume-chain.test.js`, `tests/cycling-docs.test.js`. Renamed `templates/.claude/rules/context-cycling.md` → `context-warnings.md` with a complete rewrite. Net: 5 scripts → 2 scripts (`context-warning-hook.sh`, `sprint-phase-reminder.sh`), tests still 100% green.

**Migration on re-running `/aiagentminder:setup`:** the setup skill now deletes leftover state files from the retired protocol if present (`.sprint-continuation.md`, `.sprint-continue-signal`, `.sprint-tool-count`, `.sprint-phase-guard-count`) and the old `.claude/rules/context-cycling.md`.

#### `sprint-phase-guard.sh` split into two single-purpose hooks (issue #152)

The previous hook bundled two unrelated responsibilities (Agent-only phase blocking + every-Nth-call reminder injection) behind an empty PreToolUse matcher, spawning bash on every tool call. Now:

- `bin/sprint-phase-guard.sh` — `PreToolUse` with `matcher: "Agent"`. Just phase blocking. Doesn't fire on Bash/Read/Edit/Write.
- `bin/sprint-phase-reminder.sh` — `Stop` hook. One-line phase-appropriate reminder per assistant turn during an active sprint. No counter file, no every-Nth gating.

### Fixed

- **`bin/hlpm-ping.sh`** — Event JSON built with `jq -n --arg` instead of `printf`/`sed`. Repos, branches, or event names containing quotes, backslashes, tabs, or control chars no longer corrupt `events.jsonl`. (issue #152)
- **`bin/session-start-hook.sh`** — Same `jq` fix for the `additionalContext` payload. Also trimmed to just active-sprint detection now that the cycle protocol is gone.
- **`skills/scope-check/SKILL.md`** — Added "Capture to backlog" as a fourth option in the "Not in roadmap" verdict, calling `backlog-capture.sh`. Completes the last open acceptance criterion on the backlog feature. (issue #95)
- **`templates/docs/strategy-roadmap.md`** — Replaced four user-facing references to retired commands: `/aam-brief` → `/aiagentminder:brief` (×2), `/aam-revise` → `/aiagentminder:revise`, `/aam-backlog` → `/aiagentminder:backlog`. These ship to every install via `/aiagentminder:setup`. (issue #95 follow-up)
- **`docs/strategy-roadmap.md`** — Updated one prescriptive `/aam-backlog` reference. Historical "Shipped:" entries left unchanged. (issue #95 follow-up)

### Notes

This release intentionally simplifies. Net change: ~910 lines of cycle-protocol code and tests deleted; ~220 lines of replacement code/tests added; ~5 doc references retired or rewritten. The handoff/resume-work workflow (Claude Code Auto Memory based) is unaffected — it never depended on the cycle protocol.

---

## [5.0.2] - 2026-05-17

### Fixed

- **`skills/setup/SKILL.md`** — Removed stale references to a non-existent `/aiagentminder:update` skill. The setup skill is itself the re-sync / upgrade path: users re-run `/aiagentminder:setup` (optionally after `/plugin update aiagentminder`) rather than invoking a separate update command. Updated both the "existing install" branch in step 1 and the "What this skill does NOT do" exclusions.
- **`tests/cycling-resume-chain.test.js`** — Fixture commits now set `commit.gpgsign=false` in the temp repo so the test runs cleanly in environments with a system- or user-level commit-signing wrapper. Throwaway tmp-dir commits should not invoke production signing infrastructure. Restored 4 previously-failing subtests; full suite now 343/343 green.
- **`CLAUDE.md`** — Replaced v3.3-era content (npm CLI references, `project/` directory, retired `/aam-setup`/`/aam-update` meta-commands, `.claude/commands/` source-of-truth section, broken `.claude/rules/git-workflow.md` pointer) with v5.0-accurate layout (`agents/`, `skills/<name>/SKILL.md`, `bin/`, `hooks/`, `.claude-plugin/`, `templates/`). The file is hand-maintained (this repo is not an AAM target install — no `.claude/aiagentminder-version` stamp present).

---

## [5.0.0] - 2026-05-15

### BREAKING CHANGES

- **Distribution model changed from npm to Claude Code plugin.** `npx aiagentminder init` is retired. Install via `/plugin marketplace add lwalden/AIAgentMinder` followed by `/plugin install aiagentminder@lwalden-aiagentminder`. Then run `/aiagentminder:setup` in the target project.
- **Repository layout restructured** to match the Claude Code plugin convention:
  - `project/.claude/agents/*` → `agents/*` (at repo root)
  - `project/.claude/skills/aam-X.md` → `skills/X/SKILL.md` (folder-per-skill format; the `aam-` prefix is dropped since plugin namespacing handles isolation)
  - `project/.claude/scripts/*` → `bin/*`
  - `project/.claude/settings.json.tpl` → `hooks/hooks.json` (uses `${CLAUDE_PLUGIN_ROOT}` for script paths)
  - Project-bootstrap files (`CLAUDE.md`, `DECISIONS.md`, `BACKLOG.md`, `SPRINT.md`, `.gitignore`, `docs/strategy-roadmap.md`) moved to `templates/` and copied into the target project by `/aiagentminder:setup`.
- **Skill names are now namespaced** by the plugin. `/aam-tdd` becomes `/aiagentminder:tdd`, `/aam-brief` becomes `/aiagentminder:brief`, etc.

### Removed

- **npm CLI retired.** `bin/aam.js` deleted. The supporting modules in `lib/` (`init.js`, `sync.js`, `migrations.js`, `settings-merge.js`, `agents-md.js`, `cli.js`, `prompt.js`, `detect.js`) are gone. Plugin install / update via Claude Code's native flow replaces them.
- **Meta-commands at `.claude/commands/`** (`aam-setup.md`, `aam-update.md`) — replaced by the `/aiagentminder:setup` skill that ships with the plugin.
- **`v5-migration.test.js`** and the npm-CLI test suite (`cli.test.js`, `init.test.js`, `detect.test.js`, `agents-md.test.js`, `integration.test.js`, `migrations.test.js`, `settings-merge.test.js`, `sync*.test.js`, `manifest.test.js`).

### Added

- **`/aiagentminder:setup` skill** at `skills/setup/SKILL.md` — interactive bootstrap that replaces `npx aiagentminder init`. Detects existing installs, fingerprints codebase, prompts for project identity, runs `bin/aam-bootstrap.sh` for mechanical file copies, customizes `CLAUDE.md`, augments `.gitignore` with stack-specific entries.
- **`bin/aam-bootstrap.sh`** — non-overwriting template copier called by the setup skill.
- **Worktree-isolated sprint items** (v4.7 work, included here) — sprint-master spawns item-executor with `isolation: "worktree"`; item-executor pushes its branch before returning so pr-pipeliner can pick it up from the main worktree.
- **`/goal` compatibility documentation** — sprint-master honors `.sprint-human-checkpoint`; `/goal`'s evaluator stops auto-resuming on waiting-for-human language.

### Migration from v4.x npm installs

If you previously installed via `npx aiagentminder init`:

1. Uninstall the npm package: `npm uninstall -g aiagentminder` (or whatever scope you used).
2. In Claude Code: `/plugin marketplace add lwalden/AIAgentMinder` then `/plugin install aiagentminder@lwalden-aiagentminder`.
3. Re-run `/aiagentminder:setup` in your target project. It detects the existing install and updates the version stamp + `.claude/rules/`; user-owned files (CLAUDE.md, DECISIONS.md, BACKLOG.md, SPRINT.md, docs/strategy-roadmap.md) are preserved.
4. If you had local references to `/aam-X` commands, update them to `/aiagentminder:X`.

---

## [4.6.0] - 2026-05-15

### Removed

- **AAM correction-capture retired** — Claude Code's native Auto Memory (v2.1.59+) supersedes the AAM implementation. Deleted files: `project/.claude/rules/correction-capture.md`, `project/.claude/scripts/correction-capture-hook.sh`, `tests/correction-capture-hook.test.js`. PostToolUse hook registration removed from `settings.json.tpl`. Six session-profile agents (sprint-master, dev, debug, hotfix, qa, item-executor) updated to drop `correction-capture` from their universal-rules header.
- **`settings-merge.js`** — added `correction-capture-hook` to the obsolete-pattern list and extended the merge to scrub obsolete entries from hook types the template no longer ships (so existing installs lose the orphan `PostToolUse` entry on next `sync`). When a hook type becomes empty after scrubbing, it is removed entirely.

### Added

- **`/ultrareview` reference in `aam-pr-pipeline.md`** — documents the native cloud multi-agent review as a user-triggered second-opinion step for high-risk PRs (separately billed; not auto-invoked by the pipeline).
- **"Native Claude Code Features Worth Knowing" section in `customization-guide.md`** — covers `/less-permission-prompts` (run after `/aam-setup` to tune permissions), `skillOverrides` (opt-in skill visibility control), Auto Memory (now responsible for correction capture), and how both `claude --resume` and "resume working" patterns interact with AAM's sprint continuation.

### Changed

- **v4.6.0 migration entry** — `lib/migrations.js` adds a dedicated migration that deletes the two retired files from existing installs on next `sync`. The v5.0.0 entry (orchestrator release, pending) is unchanged.

---

## [4.5.0] - 2026-04-18

### Added

- **ADR-006 HLPM ping hook** -- `project/.claude/scripts/hlpm-ping.sh` now ships in the template. Wired into SessionStart (`startup` matcher) and SessionEnd. Writes a JSONL event (`ts`, `repo`, `event`, `branch`) to `D:/Source/highest-level-project-management/events.jsonl` on every session boundary. Feeds HLPM's SessionStart summarizer (portfolio drift defense).
- **Self-protecting ping script** -- silent exit if (a) HLPM is not present on the machine, (b) `HLPM_PING_DISABLED=1` is set in the environment, or (c) the script is executing inside HLPM itself (HLPM has its own `hlpm-log-session-end.sh`, so the template ping would double-write). Inline trim-on-append caps the shared log at 10,000 lines.

### Changed

- **`getCoreFiles()` manifest** -- added `hlpm-ping.sh`.

---

## [4.4.0] - 2026-04-14

### Added

- **ADR-004 context cycling — full hook chain** — `session-end-cycle.sh` (SessionEnd hook) and `session-start-continuation.sh` (SessionStart hook, `startup` matcher) are now part of the standard template. On context pressure, the SessionEnd hook builds a continuation file from external state (git, SPRINT.md, task store). The SessionStart hook injects it into the new session with consume-once semantics. Claude's only job on cycle is `/exit`; everything else is automated.
- **`SessionEnd` hook in settings.json template** — wires `session-end-cycle.sh` unconditionally.
- **`SessionStart` dual-entry in settings.json template** — `startup` matcher for continuation injection + default matcher for active-sprint detection. Both entries are now shipped by the template, fixing the sync clobber bug (B-005).
- **Dispatch mode in `sprint-master`** (Phase 1) — reads `.exec/directive.md` at session start and executes the scope autonomously without human checkpoints. Writes status updates to `.exec/status.md` and audit trail to `.exec/history.md` at each phase transition.
- **`exec-history-append.sh`** — zero-token-cost audit trail script for the dispatch contract.

### Fixed

- **Phase 0 dispatch-readiness (5 bugs)** — sprint status drift (squash→rebase, sprint-update.sh at COMPLETE), gitignore gaps (`.correction-state`, `.exec/`, `.mcp.json`, and others), save-before-switch enforcement in item-executor, dead worktree references in pr-pipeliner, removed placeholder hooks with no implementation.
- **B-005: sync clobbered repo-specific SessionStart hooks** — the v4.3.0 template shipped only one SessionStart entry; the merge logic stripped all AAM-managed consumer entries and replaced with the single template entry, losing the `startup`-matcher continuation hook in repos that had already wired ADR-004. Fixed by shipping both entries in the template. The merge is now idempotent on correctly-configured consumers.

---

## [3.3.0] - 2026-03-28

### Added

- **Architecture fitness defaults** — 4 concrete, stack-agnostic rules (file size, secrets, test isolation, layer boundaries) replace the blank placeholder. Commented stack-specific examples for C#/.NET, TypeScript/React, Python, Java/Spring.
- **Stack-aware fitness customization** — `/aam-setup` auto-detects project stack via codebase fingerprinting and pre-configures architecture fitness rules with appropriate defaults.
- **npm/npx installer** — `npx aiagentminder init` with `--all`/`--core`/interactive modes. Zero runtime dependencies. CLI commands: `init`, `agents-md`, `validate`, `--help`/`--version`.
- **AGENTS.md generation** — `npx aiagentminder agents-md` reads installed governance files and exports an AGENTS.md for non-Claude tools.
- **Codebase fingerprinting** — Auto-detects language, framework, test runner, CI provider, and lint config during setup.
- **Plugin marketplace listing** — `.claude-plugin/` manifests for Claude Code marketplace distribution. `npx aiagentminder validate` for CI validation.
- **`sprint-update.sh`** — Zero-token-cost SPRINT.md table updater. Shell script for status, post-merge, and sprint-status cell updates.
- **Versioning policy** — Strict semver (MAJOR = breaking, MINOR = features, PATCH = fixes). Unified across npm, plugin, marketplace, and version stamp.
- **GitHub Releases adoption** — Release checklist documented in `docs/RELEASING.md`.

---

## [3.2.0] - 2026-03-27

### Added

- **Real-time context monitoring** — `context-monitor.sh` status line data bridge replaces heuristic-based context cycling. Receives token usage after every assistant message; writes `.context-usage` with `should_cycle` boolean.
- **`settings.json` statusLine config** — Points to `context-monitor.sh` for real-time monitoring.

### Removed

- **`compact-reorient.js` hook** — Replaced by status line context monitoring. Zero Node.js dependency.
- **`.claude/hooks/` directory** — No hooks remain in the project template.

---

## [3.1.0] - 2026-03-26

### Added

- **Autonomous context cycling** — `CONTEXT_CYCLE` state in sprint state machine. Self-terminates and restarts via profile hook or sprint-runner when context pressure is detected.
- **`context-cycle.sh`** — Traces process tree to find `claude.exe` and kills it for clean restart.
- **`install-profile-hook.ps1` / `.sh`** — Installs shell prompt hook for automatic restart after context cycle.
- **`sprint-runner.ps1` / `.sh`** — Loop-based wrapper for dedicated sprint sessions.
- **`.sprint-continuation.md`** — Ephemeral state file for cross-cycle resume.

---

## [3.0.0] - 2026-03-26

### Changed

- **State machine sprint workflow** — `sprint-workflow.md` rewritten as numbered state machine (PLAN → SPEC → APPROVE → EXECUTE → TEST → REVIEW → MERGE → VALIDATE → NEXT → COMPLETE).
- **Mandatory quality checklist** — Non-skippable per-item checklist: TDD, full test suite, quality gate, self-review, PR pipeline. "NEVER SKIP" directive overrides user requests to go faster.
- **Default to Comprehensive** — Quality tiers removed. All quality gates run at full strength always.
- **Self-review always runs** — No longer conditional on risk tags or tier.

### Added

- **Spec phase** — Each item gets a detailed implementation spec before coding begins.
- **Post-merge validation** — New SPRINT.md column. Sprint cannot close until all validations pass.
- **Rework cycle** — Defined path for test failures with rework tracking.
- **Autonomous execution directive** — After spec approval, execute all items without asking permission.

---

## [2.1.0] - 2026-03-25

### Changed

- **In-session pipeline execution** — Sprint workflow invokes `/aam-pr-pipeline` directly after PR creation instead of spawning background `claude -p` process.

### Removed

- **`pr-pipeline-trigger.js` hook** — No longer needed; pipeline runs in-session.
- **`autoContinueSprint` / `continueMaxIssues` config** — Obsolete; sprint continuation handled by the workflow loop.

---

## [2.0.0] - 2026-03-24

### Added

- **`/aam-pr-pipeline` skill** — Autonomous review-fix-test-merge pipeline for PRs. Reviews with full repo context, evaluates issues with developer perspective, applies fixes, runs tests, waits for CI, auto-merges when green.
- **`.pr-pipeline.json` config** — Per-repo configuration for high-risk patterns, cycle limit, auto-merge, merge method, notification email.
- **Sprint workflow integration** — `sprint-workflow.md` invokes `/aam-pr-pipeline` in-session after PR creation.

---

## [1.5.0] - 2026-03-23

### Added

- **`correction-capture.md` rule** (default-on) — Self-monitors for repeated wrong-first-approach patterns within a session, proposes permanent `.claude/rules/` instructions on recurrence.
- **`default-on` update category** — Added to `/aam-update` file taxonomy for rules that are overwritten if present and prompted if absent.

---

## [1.4.1] - 2026-03-22

### Added

- **`tool-first.md` rule** (always active) — Directs Claude to use CLI tools, APIs, and package managers instead of asking the user to perform actions manually. Covers cloud service queries (Azure, AWS, GCP), environment value lookups, package installation, and config file reading. Auth-gated logins are the sole exception.
- CLAUDE.md template Autonomy Boundaries now references the tool-first rule and lists CLI tool usage as an autonomous capability.

---

## [1.4.0] - 2026-03-21

### Added

- **`/aam-tdd` skill** — Guided TDD workflow: planning, tracer bullet, incremental RED-GREEN loop, and post-green refactoring. Language-agnostic. Complements `code-quality.md`'s one-liner with the full structured methodology. Adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).
- **`/aam-triage` skill** — Structured bug triage: capture problem, explore and diagnose root cause, design durable fix plan as RED-GREEN cycles, create GitHub issue. Complements `debug-checkpoint.md` (triage = structured start, checkpoint = structured pause). Adapted from mattpocock/skills (MIT).
- **`/aam-grill` skill** — Plan interrogation: map decision branches, walk each one (exploring codebase where possible), produce decision summary for DECISIONS.md. Intensive counterpart to `approach-first.md`. Adapted from mattpocock/skills (MIT).

### Changed

- **PR merge policy relaxed** — `git-workflow.md` and `sprint-workflow.md` no longer instruct Claude to "never merge" or "wait for human review." Claude's job ends at PR creation during sprint execution; merging is handled externally (by the user, CI, or automation). Claude will still merge if explicitly asked.
- Removed "merge PRs" from CLAUDE.md template's "Ask the human first" list.

---

## [1.3.1] - 2026-03-15

### Fixed

- **Agent-aware sprint sizing** — Replaced velocity-based adaptive sizing with stress-indicator-based sizing. The old logic recommended +1 to +2 issues when completion rate was ≥90%, causing unbounded sprint growth for AI agents that routinely complete 100%. New logic: hold steady when no problems, reduce for stress indicators (scope churn, blocked issues, context pressure ≥7 issues), hard cap at 7 issues, floor at 3. Prioritizes complete feature delivery and manageable context over issue count targets.

### Changed

- Sprint archive format now records scope changes and blocked counts instead of velocity percentage.
- Terminology updated across README, CHANGELOG, demo transcript, and milestone command: "velocity" → "sizing" where it referred to the sprint metric.

---

## [1.3.0] - 2026-03-14

### Added

- **Roadmap versioning** — `docs/strategy-roadmap.md` template now includes a `## Roadmap History` table. `/aam-revise` appends an entry for each significant scope, phase, or acceptance criteria change. Handles pre-v1.3 roadmaps gracefully (adds the section if absent).
- **`/aam-sync-issues` command** — Optional command that pushes current sprint issues to GitHub Issues using `gh` CLI. Creates issues for new sprint tasks (labeled `aiagentminder`, `sprint-S{n}`, type, and `risk`), closes issues for completed tasks, and comments on blocked tasks. Added to `/aam-setup` (question 11) and `/aam-update` optional file handling.
- **`skills/aam-checkup/SKILL.md`** and **`skills/aam-scope-check/SKILL.md`** — Plugin marketplace skill packages for these two commands were missing. Both are now present in `skills/`, resolving broken references for marketplace installs.

### Changed

- **`/aam-update`** — `aam-sync-issues.md` added to the optional file taxonomy (overwrite if present, prompt to add if absent).
- **`skills/aam-revise/SKILL.md`** — Synced with command file: includes the Roadmap History update step.
- **`skills/aam-brief/SKILL.md`** — Synced with command file: includes the constitution.md generation step.

---

## [1.2.0] - 2026-03-14

### Added
- **`/aam-revise` command** — Mid-stream plan revision. Add, change, drop, or reprioritize features directly in `docs/strategy-roadmap.md` with decision logging in `DECISIONS.md` and active sprint impact checks. Handles research findings, new/changed/dropped requirements, and reprioritization. Closes the gap between `/aam-brief` (initial planning) and sprint execution — the plan is now a living document that stays current as direction changes.
- **`skills/aam-revise/SKILL.md`** — Plugin marketplace packaging for the new command.

### Changed
- **README.md** — Non-Goals reframed: "Not a backlog tool" → "Not a ticket tracker" with description of AIAgentMinder's living plan approach. Session flow section adds "Between sprints — revising the plan" example. Commands table and "What Gets Copied" tree updated.
- **All docs** updated to include `/aam-revise`: `docs/how-it-works.md`, `docs/customization-guide.md`, `SKILL.md`, `/aam-setup`, `/aam-update`.

---

## [1.1.0] - 2026-03-14

### Added
- **`aam-` command prefix** — All AIAgentMinder commands renamed with `aam-` prefix to avoid collision with Claude Code built-in commands (`/plan`, `/doctor`) and other plugins. Commands are now: `/aam-brief`, `/aam-checkup`, `/aam-handoff`, `/aam-quality-gate`, `/aam-scope-check`, `/aam-self-review`, `/aam-milestone`, `/aam-retrospective`, `/aam-setup`, `/aam-update`.
- **`## Known Debt` section** in `project/DECISIONS.md` template — structured table for recording shortcuts, workarounds, and deferred quality work. `/aam-milestone` surfaces the debt list alongside scope drift.
- **`docs/archive/`** directory — analysis documents moved here to keep root clean.

### Changed
- **All documentation** reviewed and updated for accuracy: stale `/plan` references fixed, Stop hook references removed, PROGRESS.md references removed, missing commands (`/aam-checkup`, `/aam-scope-check`) added to all docs.
- **`ROADMAP.md`** — reframed: v1.0 marked as shipped, post-v1.1 direction outlined, `/onboard` dropped (covered by `/aam-brief` Starting Point E).
- **`backlog.md`** — cleaned: completed v1.0 items removed, only unscheduled backlog remains.
- **`SKILL.md`** — version bumped to 1.1.0, missing skills added (`/aam-checkup`, `/aam-scope-check`), missing rules added (`approach-first.md`, `debug-checkpoint.md`).
- **Plugin skills** — all skill directories and SKILL.md frontmatter names updated with `aam-` prefix.
- **`.claude-plugin/plugin.json`** — version bumped to 1.1.0.
- **`examples/CLAUDE.md`** — modernized from legacy v0.6.0 format to v1.1 format (removed Session Protocol, PROGRESS.md, 4-hook references).
- **`examples/demo-transcript.md`** — modernized to reflect current Session Memory workflow instead of hook injection.

### Removed
- **`examples/PROGRESS.md`** — deleted (PROGRESS.md was pruned from scaffolding in v1.0).
- **Root-level analysis docs** — moved to `docs/archive/` (not user-facing).

---

## [1.0.0] - 2026-03-13

### Added
- **`.claude/rules/approach-first.md`** — Always-active rule. Claude states its intended approach before executing architecture changes, multi-file refactors, new dependencies, or data model changes. Prevents "wrong approach" wasted cycles.
- **`.claude/rules/debug-checkpoint.md`** — Always-active rule. After 3 consecutive failed attempts at the same error, Claude stops, summarizes what's been tried, and asks for human input. Prevents debugging spirals.
- **`.claude/commands/checkup.md`** — New `/checkup` command for installation health checks. Validates: Node.js availability, required files present, hook scripts and settings.json, CLAUDE.md placeholders filled, version stamp, git status. Outputs PASS/WARN/FAIL report with remediation.
- **`.claude/commands/scope-check.md`** — New `/scope-check` command for active scope governance. Developer describes proposed work; Claude compares against roadmap and sprint scope, returns verdict: in-scope, out-of-scope, deferred, or not-in-roadmap.
- **Complexity Budget** in `/milestone` — fifth health dimension tracking file count, largest files, dependency count, and phase-appropriate thresholds.
- **`## Known Debt` section** in DECISIONS.md template — structured table for recording shortcuts and workarounds. `/milestone` surfaces the debt list with oldest and highest-risk items.
- **Risk-flagged issues** in sprint planning — issues touching auth, payments, data migration, or public APIs get `[risk]` tag; auto-triggers `/self-review` before PR creation regardless of quality tier.
- **Adaptive sprint sizing formalized** — `/retrospective` writes sizing metadata to SPRINT.md on archive; next sprint planning reads it for recommended issue count.

### Changed
- **PROGRESS.md pruned from scaffolding** — no longer copied by `/setup` or managed by hooks. Session continuity handled by native Session Memory and `--continue`.
- **`/handoff` refactored** — stripped PROGRESS.md update step; focused on its two unique contributions: priority note to auto-memory and DECISIONS.md updates.
- **CLAUDE.md context budget simplified** — replaced detailed table with two plain-text lines plus `/context` tip. Native `/context` command provides real-time optimization.
- **`/setup`** — copies `approach-first.md`, `debug-checkpoint.md`, `checkup.md`, `scope-check.md` as core files.
- **`/update`** — adds new files to AIAgentMinder-owned list; handles v0.9.1→v1.0 PROGRESS.md migration.

---

## [0.9.1] - 2026-03-12

### Added

- **`skills/` directory** — Per-skill plugin packaging for the Claude Code Plugin Marketplace. Each command is packaged as a proper skill with a `SKILL.md` containing YAML frontmatter (`name`, `description`, `argument-hint`, `allowed-tools`, `user-invocable`) and the full command content. Skills: `brief`, `handoff`, `quality-gate`, `self-review`, `milestone`, `retrospective`.
- **`.claude-plugin/plugin.json`** — Plugin manifest declaring plugin identity, version, author, and skills directory location.

### Changed

- **`SKILL.md`** (repo root) — Updated from placeholder to reflect completed packaging. Documents the marketplace install command and links to the skill files.
- **`project/.claude/aiagentminder-version`** — Bumped to `0.9.1`.

### Notes

- Install via plugin marketplace: `/plugin marketplace add lwalden/AIAgentMinder`
- Manual install via `/setup` continues to work unchanged. Marketplace is an additive distribution channel.
- v1.0.0 Intelligence Layer (Complexity Budget, Adaptive Sprint Sizing, Technical Debt Tracker, Risk-Flagged Issues) is unaffected — plugin packaging is distribution, not a feature.

---

## [0.9.0] - 2026-03-12

### Added
- **`.claude/commands/self-review.md`** — New `/self-review` command. Spawns specialist review subagents (security, performance, API design) that read the diff and relevant rules — not the entire codebase. Each lens produces a focused finding list with severity ratings. High severity blocks PR creation; Medium/Low let the user choose to fix or proceed with issues noted in the PR description. Integrated into `sprint-workflow.md` for Rigorous and Comprehensive quality tiers.
- **`.claude/commands/milestone.md`** — New `/milestone` command for project health assessment. Reviews four dimensions: phase progress (MVP features complete vs planned), timeline health (on-track vs at-risk), complexity vs phase (file count, largest files, dependency growth), and scope drift (non-MVP work done while MVP items remain). Produces a structured health report with actionable recommendations. Run at sprint boundaries or phase transitions.
- **`.claude/commands/retrospective.md`** — New `/retrospective` command for sprint retrospective with metrics. Computes planned vs completed issues, scope changes mid-sprint, blocked issues with reasons, decisions logged, and an honest "what went well / what was harder" observation. After Sprint 3+, provides adaptive sprint sizing guidance based on historical completion rates. Called automatically by `sprint-workflow.md` at sprint completion.
- **`SKILL.md`** (repo root) — Plugin metadata placeholder. Documents intended plugin identity, command and rule inventory, and v0.9.1 packaging plan. Proper skill directories and plugin manifest are planned for v0.9.1.

### Changed
- **`sprint-workflow.md`** — Sprint Execution now calls `/self-review` (Rigorous/Comprehensive tiers) after `/quality-gate`, before PR creation. Sprint Completion now calls `/retrospective` before the user reviews and archives the sprint.
- **`/setup`** — Copies `self-review.md`, `milestone.md`, `retrospective.md` as core (non-optional) files alongside `quality-gate.md`.
- **`/update`** — Adds `self-review.md`, `milestone.md`, `retrospective.md` to the AIAgentMinder-owned (always-overwrite) file list.

---

## [0.8.1] - 2026-03-01

### Added
- **`.claude/rules/scope-guardian.md`** — Always-active scope governance rule. Before implementing any new feature, Claude checks `docs/strategy-roadmap.md`: if the feature is in scope, proceed; if out of scope, pause and confirm; if absent from both lists, ask before proceeding. Also flags mid-sprint scope additions.
- **`.claude/commands/quality-gate.md`** — New `/quality-gate` command for tiered pre-PR checks. Four tiers matching the project's declared quality tier: Lightweight (build passes), Standard (tests exist + pass, no debug statements), Rigorous (Standard + coverage delta + linter + no `any` types), Comprehensive (Rigorous + secret scan + error handling audit + security scan). Always copied; integrated into sprint workflow before PR creation.
- **`.claude/rules/architecture-fitness.md`** — Optional, project-customizable structural constraint template. Covers layer boundaries, external API centralization, test isolation, and file size limits. Ships with placeholder examples that the user replaces with their architecture's rules. Glob-scoped rules supported via YAML frontmatter.
- **Decision Forcing Function in `/brief`** — During the planning interview, after gathering tech stack choices, `/brief` now proactively surfaces hard-to-reverse decisions with downstream consequences (e.g., JWT → no revocation, PostgreSQL → search strategy needed, NoSQL → join strategy). Includes a reference table of common choice→consequence patterns. Resolved decisions are logged to `DECISIONS.md` with alternatives and reversal cost; deferred decisions become `<!-- TODO: -->` markers in the roadmap.

### Changed
- **`/brief`** — Round 3 now offers architecture fitness rules as an optional feature (default yes for Rigorous/Comprehensive, offered for Standard, skipped for Lightweight). After Generation step 3 updated to log Decision Forcing decisions to DECISIONS.md with structured format.
- **`/brief` Step E3** — Existing project flow updated to offer architecture fitness rules alongside code quality guidance and sprint planning.
- **`sprint-workflow.md`** — Sprint Execution now calls `/quality-gate` before each PR creation. Fix any quality gate failures before the PR is created.
- **`/setup`** — Copies `scope-guardian.md` and `quality-gate.md` as core (non-optional) files. Adds architecture fitness rules as optional feature (question 10). Rules directory always created.
- **`/update`** — Adds `scope-guardian.md` and `quality-gate.md` to AIAgentMinder-owned (always-overwrite) list. Adds `architecture-fitness.md` to optional file handling with prompt-to-add-if-absent behavior.
- **`docs/strategy-roadmap.md` template** — `/plan` reference updated to `/brief`. "Out of Scope" placeholder text made more explicit.
- **`.claude/rules/README.md`** — Table updated with `scope-guardian.md` and `architecture-fitness.md`.

---

## [0.8.0] - 2026-03-01

### Added
- **`.claude/rules/git-workflow.md`** — New always-active rule covering commit discipline, branch naming, PR workflow, and explicit guidance against auto-committing on session end. Loaded natively by Claude Code; replaces the `session-end-commit.js` Stop hook.
- **Native Tasks integration in sprint workflow** — `sprint-workflow.md` restructured to use Claude Code's native TaskCreate/TaskUpdate/TaskList tools as the issue execution layer. After sprint approval, each issue becomes a native Task (persistent across sessions, supports dependency DAGs). SPRINT.md becomes a lightweight sprint header (goal, scope, status) rather than a full issue tracker.

### Changed
- **`/plan` renamed to `/brief`** — Avoids collision with Claude Code's built-in `/plan` command (which toggles Plan Mode). The command behavior is unchanged; only the name changed. A disambiguation note is included in the command header. `/setup` and `/update` updated throughout.
- **`/doctor` renamed to `/checkup`** (backlog item) — Avoids shadowing Claude Code's built-in `/doctor` command. Renamed in backlog and acceptance criteria.
- **`sprint-workflow.md`** — Dual-layer architecture: sprint governance wrapper (SPRINT.md header + approval gate + review/archive) over native Tasks (per-issue tracking, persistence, cross-session state). SPRINT.md format updated to sprint header only.
- **`SPRINT.md` template** — Updated header to reflect new role as sprint header, not issue tracker.
- **`CLAUDE.md` template** — Git Workflow behavioral rule slimmed to a pointer to `git-workflow.md` (rules file loaded natively; avoids duplication).
- **`/setup`** — Copies `git-workflow.md` as a core (non-optional) rule. Rules directory always created. Hook count updated from 2 to 1.
- **`/update`** — Adds `git-workflow.md` to AIAgentMinder-owned files. Adds v0.7.0 → v0.8.0 migration steps: delete `session-end-commit.js`, delete `plan.md` (replaced by `brief.md`).
- **`.claude/rules/README.md`** — Table updated to include `git-workflow.md`.

### Removed
- **`session-end-commit.js` Stop hook** — Auto-commit on session end replaced by `git-workflow.md` rule. Commits should be intentional, not automatic. Deleted.
- **Stop hook entry** removed from `project/.claude/settings.json`.

---

## [0.7.0] - 2026-02-28

### Added
- **`compact-reorient.js` hook** — SessionStart hook with `"matcher": "compact"` that fires exclusively after context compaction. Outputs the first 15 lines of SPRINT.md (if an active sprint exists) or "No active sprint." Provides targeted sprint reorientation without bloating every session start.
- **`.claude/rules/` directory** — Claude Code native rules loading replaces `.claude/guidance/`. All `.md` files in `.claude/rules/` are auto-discovered and loaded every session by Claude Code natively — no hooks required.
- **YAML frontmatter** on `code-quality.md` and `sprint-workflow.md` — `description:` field for Claude Code rules system compatibility.
- **`@SPRINT.md` native import** — When sprint planning is enabled, `@SPRINT.md` is added to CLAUDE.md after the Context Budget table. Claude Code loads it natively every session when the file exists, replacing hook injection.
- **`### Decision Recording` behavioral rule** in CLAUDE.md — Instructs Claude to write to DECISIONS.md when making architectural choices. Includes note that `@DECISIONS.md` can be added to CLAUDE.md for auto-loading.
- **MEMORY.md step in `/handoff`** — Step 3 writes 2-3 priority items to the project's auto-memory file (`~/.claude/projects/.../memory/MEMORY.md`), bridging `/handoff` to Claude Code's native persistent memory.

### Changed
- **CLAUDE.md template** slimmed to ~50 lines (from ~72). Removed `## Session Protocol` section (Session Memory + `claude --continue` replaces manual PROGRESS.md reading). Removed PROGRESS.md and DECISIONS.md from Context Budget. Added `> Use \`claude --continue\`` hint to header.
- **Hook count reduced** from 4 scripts / 5 executions to 2 scripts / 2 executions per session.
- **`session-end-commit.js`** — Removed special case that skipped commits when only PROGRESS.md was staged (no longer relevant since PROGRESS.md is not auto-maintained by hooks).
- **PROGRESS.md template** — Demoted to optional human artifact. Header updated to reflect it is not auto-loaded. Removed `**Last Updated:**` field (timestamp hook is gone).
- **DECISIONS.md template** — Header updated to note it is not auto-loaded. Instructions added to add `@DECISIONS.md` to CLAUDE.md if auto-loading is desired.
- **`/handoff` command** — Slimmed to ~60 lines (from ~108). DECISIONS.md promoted to step 2. New step 3 writes priorities to MEMORY.md. PROGRESS.md update demoted to optional step 4.
- **`/update` command** — Full v0.6.0 → v0.7.0 migration logic: deletes obsolete hooks, migrates `.claude/guidance/` to `.claude/rules/`, removes Session Protocol from CLAUDE.md, adds `@SPRINT.md` import if sprint planning was previously enabled.
- **`/setup` command** — All `.claude/guidance/` references updated to `.claude/rules/`. Sprint planning uses `@SPRINT.md` import instead of Context Budget Reading Strategy line. Hook count updated to 2.
- **`/plan` command** — All `.claude/guidance/` references updated to `.claude/rules/`. Sprint planning adds `@SPRINT.md` import to CLAUDE.md.
- **README** — Repositioned from "session continuity" to "project governance and planning". Problem statement updated to reflect that native memory solved continuity. Architecture section updated for 2-hook model. "What Gets Copied" tree updated.
- **docs/how-it-works.md** — All sections updated for v0.7.0 architecture: 2-hook model, native rules loading, @import, Session Memory.
- **docs/customization-guide.md** — guidance/ → rules/ throughout. Hooks table updated to 2 entries. Upgrading section adds v0.6.0 migration notes.

### Removed
- **`session-start-context.js` hook** — Full context injection on every session start. Replaced by native Claude Code features: `.claude/rules/` loading, Session Memory, `@import` syntax. Deleted.
- **`session-end-timestamp.js` hook** — PROGRESS.md timestamp maintenance. No longer needed since PROGRESS.md is no longer auto-maintained. Deleted.
- **`pre-compact-save.js` hook** — PreCompact hook for PROGRESS.md state save. Replaced by compact-matcher SessionStart hook pattern. Deleted.
- **`## Session Protocol` section** from CLAUDE.md template — Native Session Memory and `claude --continue` replace manual session-start/end protocol. Removed.
- **`.claude/guidance/` directory** — Renamed to `.claude/rules/` to align with Claude Code's native mechanism. Old directory and its README deleted.
- **PROGRESS.md auto-injection** — PROGRESS.md is no longer injected by hooks or referenced in CLAUDE.md session protocol.
- **DECISIONS.md auto-injection** — DECISIONS.md is no longer injected by hooks (still referenced in Behavioral Rules as a write target).

---

## [0.6.0] - 2026-02-23

### Added
- **Code quality guidance** — optional `project/.claude/guidance/code-quality.md` (~18 lines): TDD cycle, build-before-commit, review-before-commit, explicit error handling, read-before-write, commit message discipline, CI-ready code, and context efficiency rules. Enabled during `/plan`, `/setup`, or `/update`.
- **Sprint planning workflow** — optional `project/.claude/guidance/sprint-workflow.md` (~35 lines): full sprint lifecycle from issue decomposition through per-issue PRs, blocked issue handling, sprint review, and archive. Enabled during `/plan`, `/setup`, or `/update`.
- **SPRINT.md template** — `project/SPRINT.md`: active sprint state file, injected at session start when a sprint is in progress. Archived to git history on sprint completion. Issue ID format: `S{sprint}-{seq}`.
- **`.claude/guidance/` directory** — `project/.claude/guidance/` with `README.md`. Generic mechanism: any `.md` file here (except README.md) is injected at session start. Foundation for future guidance files.
- **SessionStart hook: guidance injection** — `session-start-context.js` now reads all `.md` files in `.claude/guidance/` and injects them after PROGRESS.md/DECISIONS.md. No-op if directory doesn't exist.
- **SessionStart hook: SPRINT.md injection** — When SPRINT.md contains `**Status:** in-progress`, injects full file content and extracts sprint issue task suggestions (with status: todo/in-progress/blocked). Skips placeholder and archived content.
- **`/plan` optional features round** — After quality tier determination, `/plan` prompts for code quality guidance (recommended for Standard+) and sprint planning (recommended for Standard+). Handles Starting Point E in the interview round.
- **`/setup` optional features questions** — Step 2 now includes questions 8 and 9 for code quality guidance and sprint planning. Step 3 conditionally copies guidance files and SPRINT.md. Step 7 summary reflects what was enabled.
- **`/update` optional file handling** — New "AIAgentMinder-owned (optional)" taxonomy category. Guidance files overwritten if present, prompted if absent. SPRINT.md created if missing and sprint planning enabled; never overwritten if active sprint.
- **`/update` updated file taxonomy table** — All six categories documented: AIAgentMinder-owned, AIAgentMinder-owned (optional), Hybrid, User-owned (AIAgentMinder creates initial), User-owned, Version stamp.
- **`/handoff` sprint awareness** — Step 1 now checks for active sprint; Step 2 includes sprint progress in Current State and blocked issues in Blockers; Step 5 briefing includes sprint status. SPRINT.md not modified by handoff.
- **CLAUDE.md sprint context budget** — `/plan` and `/setup` conditionally add SPRINT.md row to Context Budget table and Reading Strategy when sprint planning is enabled.

### Changed
- **README** — Updated "What Gets Copied" tree to show `.claude/guidance/` and `SPRINT.md` (both optional). "What a Session Looks Like" updated with sprint-based session flow. Hook count corrected to four.
- **docs/how-it-works.md** — Context System table expanded with guidance and SPRINT.md rows. Session Continuity section updated for sprint workflow. Context Budget table updated. SessionStart hook description updated.
- **docs/customization-guide.md** — New "Optional Features" section covering code quality guidance and sprint planning (enable/disable, full sprint lifecycle). Hooks table updated for new SessionStart capabilities. Upgrading section updated for optional file taxonomy.

---

## [0.5.3] - 2026-02-16

> **Note:** Versions prior to 0.5.0 used a different numbering scheme (1.x–4.x). The project re-versioned to semver 0.x starting with 0.5.0 to reflect pre-1.0 maturity. The entries below retain their original version numbers for historical accuracy.

### Added
- **Cross-platform hooks (Node.js)** -- all hooks rewritten from bash to Node.js for Windows, macOS, and Linux support
- **Branch safety in auto-commit** -- session-end-commit hook now skips main/master branches, stages only tracked files (`git add -u` instead of `git add -A`), and respects git hooks (no `--no-verify`)
- **Node.js prerequisite check** in `/setup` -- warns if Node.js is not available for hooks

### Changed
- **settings.json is now valid JSON** -- removed all `//` comments that could break strict parsers
- **Consolidated deny patterns** -- extended deny list (git reset --hard, git clean -fd, chmod -R 777, rm -rf .) moved from guard-risky-bash hook into settings.json deny list
- **CLAUDE.md trimmed to ~90 lines** -- removed "Native Claude Code Features" section (Claude knows its own features), removed commented placeholder examples, removed MEMORY.md prohibition
- **strategy-roadmap.md trimmed to ~77 lines** -- removed placeholder tables and bracket-fill sections; kept section headers for /plan to populate
- **DECISIONS.md simplified to ~24 lines** -- removed lengthy format reference and examples
- **PROGRESS.md updated** -- removed reference to removed /archive command
- **/plan command streamlined** -- auto-defaults to Lightweight tier for personal/CLI/library projects (skips Quality & Testing round), removed 20-line Project Type Adaptation table
- **/checkpoint now includes archival** -- handles PROGRESS.md cleanup inline (previously separate /archive command)
- **/setup updated** -- reflects 4 hooks (not 5), 2 commands (not 4), adds hook prerequisite check
- **README rewritten** -- concise problem-solution format, accurate file counts and descriptions
- **All docs trimmed** -- how-it-works.md (67 lines), customization-guide.md (107 lines), strategy-creation-guide.md (66 lines)

### Removed
- **guard-risky-bash.sh** -- redundant with settings.json deny list; bypassable regex patterns provided false security
- **/status command** -- lightweight read-only snapshot didn't justify a separate command; users can ask Claude directly
- **/archive command** -- archival logic folded into /checkpoint
- **settings.local.json** -- development artifact with local paths; should not be in template repo
- **All bash hook scripts** -- replaced by cross-platform Node.js equivalents
- **"Do NOT write to MEMORY.md" instruction** -- counterproductive; MEMORY.md can serve as backup safety net

---

## [3.1.0] - 2026-02-14

### Added
- **ADR trigger criteria** in CLAUDE.md, `/checkpoint`, and DECISIONS.md -- explicit list of when to log decisions
- **MVP Goals section** in CLAUDE.md -- populated by `/plan` with Phase 1 deliverables
- **Format Reference** and example in DECISIONS.md template
- **Risk-aware pre-commit hook example** in `docs/customization-guide.md`
- **Roadmap section** in README
- **"What AIAgentMinder is NOT" callout** in README

### Changed
- `/plan` updated to ask ADR format preference (lightweight vs. formal)
- `/status` updated to surface MVP Goals and flag scope drift
- Version badge bumped to 3.1

---

## [3.0.0] - 2026-02-14

### Added
- **Root-level `/setup` command** in `.claude/commands/setup.md` -- resolves the chicken-and-egg problem of setting up from the template repo itself
- **MCP server awareness** in `/setup` and `/plan` -- asks about MCP servers during initialization and planning; stores them in CLAUDE.md for Claude to reference
- **Native Claude Code feature guidance** in `CLAUDE.md` -- explains how MEMORY.md, native plan mode, compact history, hooks, and MCP servers interact with this template
- **Hooks documentation** in `CLAUDE.md`, `docs/how-it-works.md`, and `docs/customization-guide.md`
- **Stack-specific `.gitignore` generation** in `/setup` -- appends language-specific entries instead of shipping a 239-line kitchen-sink file
- **CI/CD on-demand pattern** -- documented: generate CI when you have real code, not at project init

### Changed
- `project/.claude/settings.json` rebuilt from 132 entries to ~20 focused entries -- baseline is git, gh, safe shell utilities; stack tools added by `/setup`
- `project/.gitignore` reduced from 239 lines to ~50-line core; stack entries appended by `/setup`
- `project/DECISIONS.md` simplified: dropped ADR/PDR number scheme, flat entry format
- README rewritten for v3.0: updated comparison table, What You Get, permissions description
- `docs/how-it-works.md`, `docs/customization-guide.md`, `docs/strategy-creation-guide.md` updated throughout

### Removed
- `project/.claude/commands/setup.md` -- `/setup` is a meta-command; including it in copied template was dead weight
- `project/.github/` directory (ci.yml, deploy.yml, dependabot.yml) -- placeholder CI skeletons were misleading; CI generated on-demand now
- `project/.env.example` -- added no value; Claude generates accurate env files from project context
- `project/docs/ARCHITECTURE.md` -- generic placeholder; Claude generates better architecture docs from actual code

---

## [2.1.1] - 2026-02-07

### Added
- **Prerequisites section** in README -- links to Claude Code VS Code extension, CLI docs, and GitHub CLI
- **"What It Looks Like" example** in README -- sample `/plan` conversation showing the full Q&A flow
- **CONTRIBUTING.md** -- guidelines for reporting issues, suggesting improvements, and submitting PRs
- **License and version badges** in README header
- **Windows PowerShell commands** in README manual setup (alongside macOS/Linux)
- **Platform-specific permissions note** in customization guide -- reminder to remove irrelevant OS entries

### Changed
- README Quick Start rewritten for beginners -- added `git clone` command, Download ZIP option, example prompts showing what to tell Claude in each scenario
- Strategy roadmap sections renumbered: Part 3 (Risk), Part 4 (Quality & Testing), Part 5 (Timeline), Part 6 (Human Actions) -- eliminates the "Part 3.5" patch numbering
- Deny list description in how-it-works.md corrected from "blocked even if user approves" to "Claude will refuse to run"
- README Version History replaced with link to CHANGELOG.md
- README footer consolidated (Contributing, License sections)

### Removed
- "Migrating from v1.0" section from README (v1.0 was never publicly released)
- `nul` file artifact (Windows error output leftover)

---

## [2.1.0] - 2026-02-07

### Added
- **Adaptive planning depth** in `/plan` -- pre-interview assessment gauges how formed the user's idea is (rough concept through detailed spec) and adjusts question depth accordingly
- **Quality & Testing Strategy** round in `/plan` -- determines quality tier (Lightweight / Standard / Rigorous / Comprehensive) based on project complexity, audience, and reliability needs
- **Quality tier table** in `/plan` with signal-to-tier mapping and testing approach for each level
- **Part 4: Quality & Testing Strategy** section in `docs/strategy-roadmap.md` template with checklist for unit, integration, E2E, security scanning, and performance testing
- **Verification-First Development** behavioral rule in `CLAUDE.md` -- restate requirements before implementing, write tests first for Standard+ tiers, reference acceptance criteria in PRs
- **Session Management** guidance in `CLAUDE.md` Context Budget -- `/clear` for task switching, compaction awareness, fresh session recommendations
- **"Why This Template" comparison table** in README -- feature-by-feature comparison vs. Claude Code's built-in `/init`
- **"Planning Your Project" section** in README -- highlights the `/plan` Q&A flow as a first-class feature, explains all 4 starting points
- **`docs/ARCHITECTURE.md`** template -- living architecture document for complex project types (web-app, api, mobile-app)
- **Project scale question** in `/setup` Step 2 -- personal tool / team tool / public product, used to set initial quality tier
- **ARCHITECTURE.md generation** in `/setup` Step 4 -- conditionally included based on project type
- **Initial quality tier** set by `/setup` based on project scale, refined later by `/plan`
- **Quality & Testing guidance** in `docs/strategy-creation-guide.md` -- explains quality tiers and when to use each

### Changed
- `/plan` question flow restructured: Round 3 is now Quality & Testing, former Round 3 (Unknowns) moved to Round 4
- `/plan` Project Type Adaptation table updated to include Quality & Testing row
- README version bumped to v2.1, version history updated

---

## [2.0.0] - 2026-02-07

### Added
- `project/` directory to clearly separate scaffolding files from template documentation
- 5 slash commands in `.claude/commands/`:
  - `/setup` -- guided project initialization supporting 4 onboarding scenarios (new GitHub repo, existing repo, new local project, blank local repo)
  - `/plan` -- interactive strategy roadmap creation with project-type adaptation
  - `/status` -- read-only project state summary
  - `/checkpoint` -- session end protocol (update progress, commit tracking changes)
  - `/archive` -- move old session summaries and completed tasks to `docs/archive/`
- `.claude/settings.json` -- project-scoped permissions file (replaces `settings_local.json`)
- Security deny list blocking catastrophic operations (`rm -rf /`, `rm -rf ~`, `git push --force`)
- Context Budget section in CLAUDE.md with explicit guidance on what Claude should read and when
- Context Map table in CLAUDE.md linking each file to its purpose and read frequency
- PROGRESS.md archival strategy (keep last 3 sessions, archive older entries)
- `docs/how-it-works.md` -- explains session continuity, context budget, and security model
- `docs/customization-guide.md` -- what and how to customize, extracted from README
- `docs/strategy-creation-guide.md` -- human-readable guide for creating strategy roadmaps
- Migration guide from v1.0 in README
- "Out of Scope" section in strategy-roadmap.md template
- "Human Actions Required" section in strategy-roadmap.md template
- "Unknowns & TODOs" section in strategy-roadmap.md template with structured TODO marker format
- Acceptance criteria format for features in strategy-roadmap.md

### Changed
- CLAUDE.md rewritten from 360 to 102 lines (72% reduction in per-session context)
- PROGRESS.md rewritten from 160 to 45 lines with built-in archival markers
- DECISIONS.md trimmed from 209 to 54 lines (removed redundant templates and duplicate ADR-002)
- strategy-roadmap.md trimmed from 323 to 162 lines (removed SaaS-specific sections, made modular by project type)
- .env.example reduced from 180 to 24 lines (minimal starter; `/setup` generates stack-specific variables)
- CI workflow trimmed to skeleton + security scanning (build jobs generated by `/setup`)
- Deploy workflow trimmed to scaffold (deployment steps generated by `/setup`)
- dependabot.yml reduced to GitHub Actions only (package ecosystem added by `/setup`)
- README.md rewritten with 4 clear onboarding scenarios and accurate file references
- Session resume checklist consolidated into CLAUDE.md (removed duplicate from PROGRESS.md)
- Git workflow rules consolidated into CLAUDE.md Behavioral Rules (removed duplicate ADR-002 from DECISIONS.md)

### Removed
- `STRATEGY-GUIDE.md` -- replaced by `/plan` slash command and `docs/strategy-creation-guide.md`
- `PROMPT-strategy-creation.md` -- replaced by `/plan` slash command
- `settings_local.json` -- replaced by `project/.claude/settings.json`
- Dangerous permissions from settings: `rm:*`, `git reset:*`, `git rebase:*`, `kill:*`, `pkill:*`, `killall:*`, `chmod:*`, `chown:*`, `terraform destroy:*`, `pulumi destroy:*`, `kubectl delete:*`, `docker rm:*`, `docker rmi:*`, `docker system:*`
- Phase task definitions from CLAUDE.md (belong in PROGRESS.md and strategy-roadmap.md)
- Sub-Agent Delegation section from CLAUDE.md (Claude handles natively)
- Checkpoint Protocol section from CLAUDE.md (replaced by `/checkpoint` command)
- Error Recovery section from CLAUDE.md (generic advice Claude already knows)
- Communication Style section from CLAUDE.md (condensed to 3 bullets in Behavioral Rules)
- Technology Stack placeholder from CLAUDE.md (generated by `/setup`)
- Project Structure placeholder from CLAUDE.md (generated by `/setup`)
- Success Criteria placeholder from CLAUDE.md (moved to strategy-roadmap.md)
- External Services table from CLAUDE.md (moved to strategy-roadmap.md)
- Environment & Resources section from PROGRESS.md (belongs in strategy-roadmap.md)
- Recurring Tasks section from PROGRESS.md (unused in practice)
- Session template block from PROGRESS.md (Claude knows markdown)
- Decision template blocks from DECISIONS.md (Claude knows ADR format)
- Superseded Decisions section from DECISIONS.md (one-line note replaces it)
- Launch Strategy section from strategy-roadmap.md (optional, project-type-dependent)
- Cost estimates sub-tables from strategy-roadmap.md
- Resources & References section from strategy-roadmap.md
- All commented-out language-specific CI jobs (generated by `/setup` instead)
- All commented-out deployment platform stubs (generated by `/setup` instead)
- All commented-out dependabot package ecosystems (added by `/setup` instead)
- Kitchen-sink environment variables from .env.example (Web3, Telegram, Datadog, etc.)

### Security
- Removed 14 dangerous permission patterns from settings that allowed destructive operations
- Added explicit deny list for catastrophic commands
- Renamed and relocated permissions file to `.claude/settings.json` (Claude Code native location)

---

## [1.0.0]

### Added
- Initial release with comprehensive templates
- CLAUDE.md development orchestration file
- PROGRESS.md session continuity tracker
- DECISIONS.md architectural decision record
- docs/strategy-roadmap.md project planning template
- STRATEGY-GUIDE.md for AI-assisted strategy creation
- PROMPT-strategy-creation.md ready-to-copy prompt
- settings_local.json with 500+ pre-approved permissions
- .env.example with 180 environment variable templates
- .gitignore covering all major language ecosystems
- GitHub Actions CI workflow with multi-language support
- GitHub Actions deploy workflow with multi-environment support
- Dependabot configuration for 10+ package ecosystems
- MIT License

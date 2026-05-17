# How It Works

## The Context System

Core files work together with native Claude Code features:

| File | Role | Analogy |
|------|------|---------|
| `CLAUDE.md` | Behavioral rules and project identity | Employee handbook |
| `DECISIONS.md` | Architectural decision log + known debt | Meeting minutes |
| `docs/strategy-roadmap.md` | Project goals and architecture | Product brief |
| `.claude/rules/*.md` | Development discipline & workflow | Standing operating procedures |
| `SPRINT.md` | Active sprint issues & status | Sprint board |

Claude reads `CLAUDE.md` automatically every session. `.claude/rules/*.md` files are loaded natively by Claude Code's rules system — no hooks required. SPRINT.md is loaded via `@import` in CLAUDE.md when sprint planning is enabled. DECISIONS.md is on-demand by default; add `@DECISIONS.md` to CLAUDE.md to auto-load it.

## Session Continuity

**Starting:** Claude Code's Session Memory provides automatic context continuity from previous sessions. Use `claude --continue` to restore full message history from the last session. CLAUDE.md and `.claude/rules/*.md` are loaded automatically. If sprint planning is enabled, SPRINT.md loads via the `@SPRINT.md` import in CLAUDE.md.

**During:** Code written to files immediately. Commits at natural checkpoints. Feature branches only. When sprint planning is enabled, Claude decomposes phase work into reviewable issues, works them one-by-one, and creates per-issue PRs — each sprint starts with user approval.

**Ending:** Run `/aiagentminder:handoff` to write a 2-3 item priority note to auto-memory, update DECISIONS.md with session ADRs, and commit. Git commit discipline is enforced by `.claude/rules/git-workflow.md` — commits are intentional, not automatic.

**After context compaction:** The `compact-reorient.js` hook fires via the SessionStart `compact` matcher and outputs the first 15 lines of SPRINT.md (if active) to reorient Claude to the current sprint. Session Memory handles the broader context restoration.

**Context cycling (autonomous):** During sprint execution, Claude evaluates context pressure at each item transition. When pressure is high (3+ items completed, compaction already occurred, heavy debugging), Claude writes a continuation file with sprint state, self-terminates, and a fresh session starts automatically via the PowerShell profile hook or sprint-runner wrapper. Zero human intervention required. See "Context Cycling" under Optional Features.

## Context Budget

| File | Target Lines | Read Frequency |
|------|-------------|---------------|
| CLAUDE.md | ~50 | Every session (auto) |
| `.claude/rules/*.md` | ~18-35 lines each | Every session (native rules loading) |
| SPRINT.md | ~35 lines active | Every session when sprint enabled (@import) |
| DECISIONS.md | Grows over time | On-demand (or every session if @DECISIONS.md added to CLAUDE.md) |
| strategy-roadmap.md | ~40 | On-demand |

SPRINT.md is archived to git history when a sprint completes, keeping context cost near zero between sprints.

## Commands

| Command | Purpose | Modifies Files? |
|---------|---------|----------------|
| `/aiagentminder:setup` | Initialize a project from the bundled templates. Re-run to refresh `.claude/rules/` and the version stamp after a plugin update. Detects existing installs and preserves user-owned files. | Yes |
| `/aiagentminder:brief` | Create or update strategy-roadmap.md interactively | Yes |
| `/aiagentminder:scope-check` | Compare proposed work against roadmap — returns in-scope / out-of-scope / deferred verdict | No |
| `/aiagentminder:revise` | Mid-stream plan revision — add, change, drop, or reprioritize features in the roadmap | Yes |
| `/aiagentminder:handoff` | End-of-session: write priorities to auto-memory, update DECISIONS.md, commit | Yes |
| `/aiagentminder:quality-gate` | Pre-PR quality checks — full checklist (build, tests, coverage, lint, security) | No |
| `/aiagentminder:self-review` | Specialist review subagents (security, performance, API design) — runs for every item | No |
| `/aiagentminder:pr-pipeline` | Autonomous PR review-fix-test-merge pipeline. Escalates to human on blockers | No |
| `/aiagentminder:milestone` | Project health assessment: phase progress, timeline, complexity budget, scope drift, known debt | No |
| `/aiagentminder:retrospective` | Sprint retrospective with metrics and adaptive sizing guidance | No |
| `/aiagentminder:tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor | No |
| `/aiagentminder:triage` | Structured bug triage — reproduce, diagnose, design fix plan, create issue | Yes |
| `/aiagentminder:grill` | Plan interrogation — walk every decision branch before implementation | No |
| `/aiagentminder:sync-issues` | Push current sprint issues to GitHub Issues (optional) | No |

## Optional Features

### Code Quality Guidance

When enabled, `templates/.claude/rules/code-quality.md` is copied to the target project. Claude Code's native rules loading picks it up automatically every session (TDD cycle, build-before-commit, small focused functions, and read-before-write). Enabled during `/aiagentminder:brief` or `/aiagentminder:setup`. Delete the file to opt out.

### Sprint Planning

When enabled, `templates/.claude/rules/sprint-workflow.md` is copied, `SPRINT.md` is created, and `@SPRINT.md` is added to CLAUDE.md. When you ask Claude to "start a sprint" or "begin Phase 1," it:
1. Decomposes the phase work into discrete issues with acceptance criteria — waits for approval
2. Writes detailed implementation specs per item (approach, test plan, post-merge validation) — waits for approval
3. Executes items autonomously in sequence: TDD, full test suite, quality gate, self-review, PR pipeline — no permission prompts between items
4. Runs post-merge validation; failures create rework tasks within the sprint
5. Archives completed sprints to git history

### Context Warnings (v5.1+)

When context usage crosses the threshold, a Stop-hook injects an advisory warning at the end of the assistant turn. The warning is passive — no tools are blocked, no continuation file is written, and the session is never auto-restarted. The user picks:

- **Wrap up cleanly:** run `/aiagentminder:handoff` (writes the "Next Session" block into Claude Code's native Auto Memory), commit any work, then `/exit`. Resume in the next session with "resume work" — Auto Memory carries the handoff forward natively.
- **Keep going:** continue. The warning re-fires every turn while you're over threshold.

This replaces the v5.0 autonomous cycle protocol (commit + write continuation + self-terminate + auto-restart). The autonomous pattern fought Claude Code's native context behavior and didn't work cleanly when users monitored CLI sessions from the mobile app. v5.1 keeps the threshold detection (`context-monitor.sh` writes `.context-usage`) and replaces the enforcement with a passive advisory.

**Dormant by design** when `.context-usage` is absent — including on Claude Code web, where the status line that produces it doesn't run.

## Governance Hooks

Hooks ship with the plugin in `hooks/hooks.json`. They register
automatically when the plugin is enabled — no `settings.json` edits
required in your project.

| Hook | Event | Script |
|------|-------|--------|
| Context monitor | statusLine | `context-monitor.sh` |
| Context warning | Stop | `context-warning-hook.sh` |
| Sprint phase guard | PreToolUse (matcher: Agent) | `sprint-phase-guard.sh` |
| Sprint phase reminder | Stop | `sprint-phase-reminder.sh` |
| Sprint stop guard | Stop | `sprint-stop-guard.sh` |
| Session start cycle reset | SessionStart | `session-start-cycle-reset.sh` |
| Session start sprint detect | SessionStart | `session-start-hook.sh` |
| Stop failure | StopFailure | `stop-failure-hook.sh` |
| HLPM ping | SessionStart, SessionEnd | `hlpm-ping.sh` |

All hooks reference `${CLAUDE_PLUGIN_ROOT}/bin/<script>.sh`, so they
work from wherever Claude Code installed the plugin.

Git commit discipline is enforced by `.claude/rules/git-workflow.md` (always-active rule). Commits are intentional, not automatic.

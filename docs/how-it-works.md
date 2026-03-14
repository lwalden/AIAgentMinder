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

**Ending:** Run `/aam-handoff` to write a 2-3 item priority note to auto-memory, update DECISIONS.md with session ADRs, and commit. Git commit discipline is enforced by `.claude/rules/git-workflow.md` — commits are intentional, not automatic.

**After context compaction:** The `compact-reorient.js` hook fires via the SessionStart `compact` matcher and outputs the first 15 lines of SPRINT.md (if active) to reorient Claude to the current sprint. Session Memory handles the broader context restoration.

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
| `/aam-setup` | Initialize a project from the template (run from AIAgentMinder repo) | Yes |
| `/aam-update` | Upgrade an existing installation — overwrites AIAgentMinder-owned files, surgical merge of CLAUDE.md (run from AIAgentMinder repo) | Yes |
| `/aam-brief` | Create or update strategy-roadmap.md interactively; optionally enable code quality guidance and sprint planning | Yes |
| `/aam-checkup` | Validate installation health — files, hooks, Node.js, version stamp, CLAUDE.md placeholders | No |
| `/aam-scope-check` | Compare proposed work against roadmap — returns in-scope / out-of-scope / deferred verdict | No |
| `/aam-revise` | Mid-stream plan revision — add, change, drop, or reprioritize features in the roadmap | Yes |
| `/aam-handoff` | End-of-session: write priorities to auto-memory, update DECISIONS.md, commit | Yes |
| `/aam-quality-gate` | Pre-PR quality checks — four tiers matching the project quality tier | No |
| `/aam-self-review` | Specialist review subagents (security, performance, API design) — Rigorous/Comprehensive tiers | No |
| `/aam-milestone` | Project health assessment: phase progress, timeline, complexity budget, scope drift, known debt | No |
| `/aam-retrospective` | Sprint retrospective with metrics and adaptive sizing guidance | No |

## Optional Features

### Code Quality Guidance

When enabled, `project/.claude/rules/code-quality.md` is copied to the target project. Claude Code's native rules loading picks it up automatically every session (~18 lines of actionable instructions: TDD cycle, build-before-commit, review-before-commit, error handling, and more). Enabled during `/aam-brief`, `/aam-setup`, or `/aam-update`. Delete the file to opt out.

### Sprint Planning

When enabled, `project/.claude/rules/sprint-workflow.md` is copied, `SPRINT.md` is created, and `@SPRINT.md` is added to CLAUDE.md. When you ask Claude to "start a sprint" or "begin Phase 1," it:
1. Decomposes the phase work into discrete issues with acceptance criteria
2. Presents the sprint for your review and approval
3. Works issues one-by-one with per-issue feature branches and PRs
4. Tracks status in SPRINT.md (todo → in-progress → done/blocked)
5. Archives completed sprints to git history

## Governance Hooks

One cross-platform hook (Node.js) configured in `settings.json`:

| Hook | Event | Script |
|------|-------|--------|
| Sprint reorientation post-compaction | SessionStart (compact matcher) | `compact-reorient.js` |

The hook fires exclusively after context compaction, not on every session start. It outputs the first 15 lines of SPRINT.md (if an active sprint exists) to reorient Claude after context was compacted.

Git commit discipline is enforced by `.claude/rules/git-workflow.md` (always-active rule). Commits are intentional, not automatic.

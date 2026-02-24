# How It Works

## The Context System

Four core files work together, plus optional guidance and sprint tracking:

| File | Role | Analogy |
|------|------|---------|
| `CLAUDE.md` | Behavioral rules and workflow | Employee handbook |
| `PROGRESS.md` | Current state and session memory | Daily standup notes |
| `DECISIONS.md` | Architectural decision log | Meeting minutes |
| `docs/strategy-roadmap.md` | Project goals and architecture | Product brief |
| `.claude/guidance/*.md` | Development discipline & workflow | Standing operating procedures |
| `SPRINT.md` | Active sprint issues & status | Sprint board |

Claude reads `CLAUDE.md` automatically every session. PROGRESS.md, DECISIONS.md, guidance files, and SPRINT.md (when active) are injected by the SessionStart hook.

## Session Continuity

**Starting:** The SessionStart hook injects PROGRESS.md (active tasks, current state, blockers, priorities) and DECISIONS.md automatically. If an active sprint exists, SPRINT.md is injected too. Any `.md` files in `.claude/guidance/` are injected as development instructions. Claude checks `git status` for uncommitted work, then resumes from priorities.

**During:** Code written to files immediately. Commits at natural checkpoints. Feature branches only. When sprint planning is enabled, Claude decomposes phase work into reviewable issues, works them one-by-one, and creates per-issue PRs — each sprint starts with user approval.

**Ending:** Run `/handoff` to write a clear briefing for the next session. Stop hooks handle timestamp and auto-commit automatically.

**Unexpected end / compaction:** The PreCompact hook saves PROGRESS.md state before context compression. The SessionStart hook re-injects everything when the session continues.

## Context Budget

| File | Target Lines | Read Frequency |
|------|-------------|---------------|
| CLAUDE.md | ~70 | Every session (auto) |
| PROGRESS.md | ~20 active | Every session (hook-injected) |
| DECISIONS.md | Grows over time | Hook-injected when decisions exist |
| `.claude/guidance/*.md` | ~18 lines each | Every session (hook-injected when present) |
| SPRINT.md | ~35 lines active | Every session (hook-injected when active sprint exists) |
| strategy-roadmap.md | ~40 | On-demand |

PROGRESS.md self-trims: Claude keeps only 3 session notes, dropping older ones (preserved in git history). SPRINT.md is archived to git history when a sprint completes, keeping context cost near zero between sprints.

## Commands

| Command | Purpose | Modifies Files? |
|---------|---------|----------------|
| `/setup` | Initialize a project from the template (run from AIAgentMinder repo) | Yes |
| `/update` | Upgrade an existing installation — overwrites AIAgentMinder-owned files, surgical merge of CLAUDE.md, handles optional guidance files (run from AIAgentMinder repo) | Yes |
| `/plan` | Create or update strategy-roadmap.md interactively; optionally enable code quality guidance and sprint planning | Yes |
| `/handoff` | End-of-session: write briefing for next session, update tracking, commit | Yes |

## Optional Features

### Code Quality Guidance

When enabled, `project/.claude/guidance/code-quality.md` is copied to the target project. The SessionStart hook injects it automatically every session (~18 lines of actionable instructions: TDD cycle, build-before-commit, review-before-commit, error handling, and more). Enabled during `/plan`, `/setup`, or `/update`. Delete the file to opt out.

### Sprint Planning

When enabled, `project/.claude/guidance/sprint-workflow.md` is copied and `SPRINT.md` is created. When you ask Claude to "start a sprint" or "begin Phase 1," it:
1. Decomposes the phase work into discrete issues with acceptance criteria
2. Presents the sprint for your review and approval
3. Works issues one-by-one with per-issue feature branches and PRs
4. Tracks status in SPRINT.md (todo → in-progress → done/blocked)
5. Archives completed sprints to git history

## Safety

`.claude/settings.json` ships a deny list blocking dangerous operations. Claude Code's default permission system handles everything else.

**Explicitly denied:** `rm -rf /` / `~` / `C:` / `.`, `git push --force`, `git reset --hard origin`, `git clean -fd`, `chmod -R 777`.

## Governance Hooks

Four cross-platform hooks (Node.js) configured in `settings.json`. The Stop event runs two scripts (timestamp + auto-commit), making five total hook executions per session lifecycle:

| Hook | Event | Script |
|------|-------|--------|
| PROGRESS.md timestamp | Stop | `session-end-timestamp.js` |
| Auto-commit checkpoint | Stop | `session-end-commit.js` |
| Pre-compaction state save | PreCompact | `pre-compact-save.js` |
| Context re-injection + task hydration + guidance + SPRINT.md | SessionStart | `session-start-context.js` |

The auto-commit hook only runs on feature branches and stages only tracked files. It respects git hooks (no `--no-verify`).

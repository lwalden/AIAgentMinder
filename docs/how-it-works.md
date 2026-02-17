# How the Template Works

## The Context System

Four files work together:

| File | Role | Analogy |
|------|------|---------|
| `CLAUDE.md` | Behavioral rules and workflow | Employee handbook |
| `PROGRESS.md` | Current state and session memory | Daily standup notes |
| `DECISIONS.md` | Architectural decision log | Meeting minutes |
| `docs/strategy-roadmap.md` | Project goals and architecture | Product spec |

Claude reads `CLAUDE.md` automatically every session and `PROGRESS.md` first thing. Other files are read on-demand.

## Session Continuity

**Starting:** Claude reads PROGRESS.md (current phase, tasks, blockers) → `git status` (uncommitted work) → `gh pr list` (open PRs) → asks about blocked items → resumes from priorities.

**During:** Code written to files immediately. Commits at natural checkpoints. Feature branches only.

**Ending:** Run `/checkpoint` to update PROGRESS.md and DECISIONS.md, then commit.

**Unexpected end:** Files on disk and staged git changes are preserved. Next session: `git status` shows partial work.

## Context Budget

| File | Target Lines | Read Frequency |
|------|-------------|---------------|
| CLAUDE.md | ~90 | Every session (auto) |
| PROGRESS.md | ~20 active | Every session (first thing) |
| DECISIONS.md | Grows over time | On-demand |
| strategy-roadmap.md | ~75 | On-demand |

When PROGRESS.md exceeds 100 lines, `/checkpoint` archives old entries to `docs/archive/`.

## Commands

| Command | Purpose | Modifies Files? |
|---------|---------|----------------|
| `/setup` | Initialize a project from the template (run from AIAgentMinder repo) | Yes |
| `/plan` | Create or update strategy-roadmap.md interactively | Yes |
| `/checkpoint` | Session end: update tracking, archive if needed, commit | Yes |

## Security Model

`.claude/settings.json` pre-approves ~20 safe commands. Stack tools added by `/setup`.

**Allowed:** git, gh, ls, cat, grep, find, diff, mkdir, cp, mv, touch, jq, sort, head, tail.

**Requires approval:** rm, curl, wget, cloud CLIs, destructive git, kill, chmod.

**Explicitly denied:** `rm -rf /` / `~` / `C:` / `.`, `git push --force`, `git reset --hard origin`, `git clean -fd`, `chmod -R 777`.

## Governance Hooks

Four cross-platform hooks (Node.js) configured in `settings.json`:

| Hook | Event | Script |
|------|-------|--------|
| PROGRESS.md timestamp | Stop | `session-end-timestamp.js` |
| Auto-commit checkpoint | Stop | `session-end-commit.js` |
| Context re-injection | SessionStart | `session-start-context.js` |
| Auto-format/lint | PostToolUse | `post-edit-lint.js` |

The auto-commit hook only runs on feature branches and stages only tracked files. It respects git hooks (no `--no-verify`).

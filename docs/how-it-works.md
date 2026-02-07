# How the Template Works

## The Context System

The template uses four files that work together:

| File | Role | Analogy |
|------|------|---------|
| `CLAUDE.md` | Behavioral rules and workflow | The "employee handbook" |
| `PROGRESS.md` | Current state and session memory | The "daily standup notes" |
| `DECISIONS.md` | Architectural decision log | The "meeting minutes" |
| `docs/strategy-roadmap.md` | Project goals and architecture | The "product spec" |

Claude reads `CLAUDE.md` automatically every session. It reads `PROGRESS.md` first thing. The other files are read on-demand when Claude needs to make a decision or understand the "why" behind something.

## Session Continuity

### Starting a Session
1. Claude reads `PROGRESS.md` -- learns current phase, active tasks, blockers
2. Runs `git status` -- finds any uncommitted work from previous sessions
3. Runs `gh pr list` -- checks for open PRs awaiting review
4. Asks about blocked items
5. Resumes from "Next Session Should" priorities

### During a Session
- Code is written to files immediately (not held in memory)
- Commits happen at natural checkpoints
- Feature branches are used; no direct commits to main
- `PROGRESS.md` is updated before complex multi-step operations

### Ending a Session
Run `/checkpoint` to:
- Update PROGRESS.md with completed work and next priorities
- Record any architectural decisions in DECISIONS.md
- Commit tracking changes

### Unexpected Session End
If Claude runs out of tokens mid-task, files on disk and staged git changes are preserved. Next session: `git status` shows what's done.

## Context Budget

Files are sized to minimize per-session token consumption:

| File | Target Lines | Read Frequency |
|------|-------------|---------------|
| CLAUDE.md | ~120 | Every session (auto-loaded) |
| PROGRESS.md | ~60 active | Every session (first thing) |
| DECISIONS.md | Grows over time | On-demand |
| strategy-roadmap.md | ~160 | On-demand |

When `PROGRESS.md` exceeds 100 lines, run `/archive` to move old session summaries to `docs/archive/progress-archive.md`.

## Slash Commands

| Command | Purpose | Modifies Files? |
|---------|---------|----------------|
| `/setup` | Initialize a new project from the template | Yes |
| `/plan` | Create or update strategy-roadmap.md interactively | Yes |
| `/status` | Print project state summary | No (read-only) |
| `/checkpoint` | Session end housekeeping | Yes |
| `/archive` | Move old progress entries to archive | Yes |

## Security Model

The `.claude/settings.json` file pre-approves development commands so Claude can work without constant permission prompts.

### What's Allowed
- Git operations (status, diff, log, branch, checkout, add, commit, push, pull, merge, stash, tag)
- GitHub CLI (PR creation, issue management, repo viewing)
- Package managers (npm, pip, cargo, dotnet, go, etc.)
- Build and test tools
- Shell utilities (ls, cat, grep, find, mkdir, cp, mv, etc.)
- Docker and container tools
- Cloud CLIs (az, aws, gcloud)
- Deployment tools (vercel, netlify, fly, etc.)

### What Requires Approval
These operations are deliberately excluded so Claude must ask first:
- **File deletion** (`rm`) -- prevents accidental data loss
- **Destructive git** (`git reset`, `git rebase`) -- prevents history rewriting
- **Process management** (`kill`, `pkill`) -- prevents accidental termination
- **Permission changes** (`chmod`, `chown`) -- prevents security issues
- **Infrastructure destruction** (`terraform destroy`, `kubectl delete`) -- prevents resource deletion

### Explicit Deny List
Claude will refuse to run these commands:
- `rm -rf /` and `rm -rf ~` -- catastrophic deletion
- `git push --force` to protected branches -- prevents history loss

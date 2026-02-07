# Claude Code Project Template v2.0

A template that gives Claude Code session memory, structured planning, and security-conscious permissions so it can work semi-autonomously on any software project. Go from idea to building in minutes.

## Quick Start

Everything inside the `project/` folder gets copied into your repo. Pick the scenario that fits:

### A) Claude Creates a New GitHub Repo

1. Clone or download this template
2. Open Claude Code and tell it where this template is
3. Run `/setup` and choose "Create a new GitHub repository"
4. Claude will ask for project name, tech stack, and preferences
5. Claude creates the repo, copies files, and customizes everything

### B) Add to an Existing Repo

1. Open Claude Code in your existing repo
2. Tell Claude the path to this template (or clone it nearby)
3. Run `/setup` and choose "Add to an existing repository"
4. Claude copies template files, asks before overwriting anything

### C) New Local Project (No GitHub Yet)

1. Clone or download this template
2. Open Claude Code
3. Run `/setup` and choose "Create a new local project"
4. Claude creates the directory, runs `git init`, and sets up files

### D) Blank Local Repo

1. Open Claude Code in your blank/empty repo
2. Tell Claude the path to this template
3. Run `/setup` and choose "Initialize in current directory"
4. Claude copies template files and customizes them

### Manual Setup (No Slash Commands)

If you prefer to set things up yourself:

```bash
# Copy project files to your repo
cp -r /path/to/template/project/* /path/to/your-repo/
cp -r /path/to/template/project/.claude /path/to/your-repo/
cp -r /path/to/template/project/.github /path/to/your-repo/
cp /path/to/template/project/.gitignore /path/to/your-repo/
cp /path/to/template/project/.env.example /path/to/your-repo/
```

Then customize: edit `CLAUDE.md` (Project Identity section), `docs/strategy-roadmap.md`, and `.claude/settings.json`.

---

## What You Get

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions -- session protocol, behavioral rules, context budget |
| `PROGRESS.md` | Session memory -- active tasks, blockers, next steps |
| `DECISIONS.md` | Architectural decision log -- prevents re-debating |
| `docs/strategy-roadmap.md` | Project planning -- goals, architecture, timeline |
| `.claude/settings.json` | Pre-approved permissions for development commands |
| `.claude/commands/setup.md` | `/setup` -- guided project initialization |
| `.claude/commands/plan.md` | `/plan` -- interactive strategy roadmap creation |
| `.claude/commands/status.md` | `/status` -- quick project state summary |
| `.claude/commands/checkpoint.md` | `/checkpoint` -- session end housekeeping |
| `.claude/commands/archive.md` | `/archive` -- clean old progress entries |
| `.github/workflows/ci.yml` | CI pipeline skeleton (security scanning included) |
| `.github/workflows/deploy.yml` | Deployment workflow scaffold |
| `.github/dependabot.yml` | Automated dependency updates |
| `.gitignore` | Comprehensive exclusions for all major stacks |
| `.env.example` | Environment variable starter template |

---

## After Setup

1. **Run `/plan`** to create your strategy roadmap interactively
2. **Tell Claude** "start Phase 1" to begin building
3. **Run `/status`** at any time to check project state
4. **Run `/checkpoint`** at the end of each work session
5. **Run `/archive`** when PROGRESS.md gets long

---

## How It Works

**Session continuity:** Claude reads `PROGRESS.md` at the start of every session to know what's done, what's blocked, and what to work on next. At session end, `/checkpoint` updates the file. Between sessions, your progress is preserved.

**Context management:** Files are sized for minimal context consumption. `CLAUDE.md` (~100 lines) and `PROGRESS.md` (~60 lines) are read every session. Larger files like `strategy-roadmap.md` are read on-demand. The `/archive` command keeps `PROGRESS.md` from growing unbounded.

**Security:** The `.claude/settings.json` pre-approves common development commands (git, package managers, build tools) so Claude doesn't ask permission for routine work. Dangerous operations (`rm`, `git reset --hard`, `kill`, force-push) are excluded and require explicit approval. See [docs/how-it-works.md](docs/how-it-works.md) for details.

For more details see:
- [docs/how-it-works.md](docs/how-it-works.md) -- Session continuity, context budget, security model
- [docs/customization-guide.md](docs/customization-guide.md) -- What and how to customize
- [docs/strategy-creation-guide.md](docs/strategy-creation-guide.md) -- Creating your strategy roadmap

---

## Migrating from v1.0

v2.0 moved all project scaffolding into the `project/` directory and replaced `settings_local.json` with `.claude/settings.json`. If you're using v1.0:

1. Copy files from `project/` to your repo (same as a fresh setup)
2. The `.claude/commands/` directory is new -- copy it to get slash commands
3. Replace your `settings_local.json` with `.claude/settings.json` (security-hardened)
4. Your existing `PROGRESS.md` and `DECISIONS.md` content is still valid

---

## Troubleshooting

**Claude keeps asking for permission** -- Add the command pattern to `.claude/settings.json`

**Claude lost track of progress** -- Run `git status` and `git log --oneline -5`, then update PROGRESS.md

**Claude re-debates old decisions** -- Add the decision to DECISIONS.md with clear rationale

**Session ended mid-task** -- Run `git status` and `git diff`, tell Claude "continue from where we left off"

**PROGRESS.md is getting long** -- Run `/archive` to move old entries to `docs/archive/`

---

## Version History

- **v2.0** -- Restructured into `project/` directory, added 5 slash commands, security-hardened permissions, context budget management, trimmed all templates for efficiency
- **v1.0** -- Initial release with comprehensive templates

---

*Works with Claude Code (VS Code extension) and Claude Code CLI.*

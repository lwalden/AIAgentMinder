# Claude Code Project Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.1-blue)

A template that gives Claude Code session memory, structured planning, and security-conscious permissions so it can work semi-autonomously on any software project. Go from idea to building in minutes.

## Why Use This (vs. `claude /init`)

Claude Code's built-in `/init` command scans your codebase and generates a basic CLAUDE.md. This template goes further:

| Feature | `/init` | This Template |
|---------|---------|---------------|
| Session memory across conversations | No | Yes -- PROGRESS.md tracks state between sessions |
| Architectural decision tracking | No | Yes -- DECISIONS.md prevents re-debating |
| Guided project planning Q&A | No | Yes -- `/plan` interviews you at any detail level |
| Adaptive testing strategy | No | Yes -- quality tier matched to project complexity |
| Security-hardened permissions | No | Yes -- dangerous operations blocked by default |
| Session lifecycle commands | No | Yes -- `/checkpoint`, `/archive`, `/status` |
| CI/CD scaffolding | No | Yes -- GitHub Actions, Dependabot, deploy workflows |
| Pre-built onboarding flow | No | Yes -- `/setup` handles 4 repo scenarios |

---

## Prerequisites

- **Claude Code** -- either the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) or the [CLI](https://docs.anthropic.com/en/docs/claude-code)
- **Git** installed and configured (`git --version` to check)
- **GitHub CLI** (optional, needed for Scenario A) -- install from [cli.github.com](https://cli.github.com)

---

## Quick Start

Get this template onto your machine, then let Claude set everything up:

```bash
git clone https://github.com/lwalden/claude-code-quick-start-template.git
```

Or click the green **Code** button on GitHub and choose **Download ZIP**.

Then pick the scenario that fits:

### A) Claude Creates a New GitHub Repo

1. Open Claude Code (in VS Code or CLI)
2. Tell Claude: "I want to set up a new project using the template at `/path/to/claude-code-quick-start-template`"
3. Run `/setup` and choose "Create a new GitHub repository"
4. Claude asks for your project name, tech stack, and preferences, then creates the repo and sets everything up

### B) Add to an Existing Repo

1. Open Claude Code in your existing repo
2. Tell Claude: "Add the project template from `/path/to/claude-code-quick-start-template` to this repo"
3. Run `/setup` and choose "Add to an existing repository"
4. Claude copies template files in, asking before overwriting anything you already have

### C) New Local Project (No GitHub Yet)

1. Open Claude Code (in VS Code or CLI)
2. Tell Claude: "Create a new project using the template at `/path/to/claude-code-quick-start-template`"
3. Run `/setup` and choose "Create a new local project"
4. Claude creates the directory, runs `git init`, and sets up all files

### D) Blank Local Repo

1. Open Claude Code in your blank/empty repo
2. Tell Claude: "Set up this repo using the template at `/path/to/claude-code-quick-start-template`"
3. Run `/setup` and choose "Initialize in current directory"
4. Claude copies template files in and customizes them

### Manual Setup (No Slash Commands)

If you prefer to set things up yourself, copy the contents of the `project/` folder into your repo. Make sure to include the hidden directories (`.claude/` and `.github/`):

```bash
# macOS / Linux
cp -r /path/to/template/project/* /path/to/your-repo/
cp -r /path/to/template/project/.claude /path/to/your-repo/
cp -r /path/to/template/project/.github /path/to/your-repo/
cp /path/to/template/project/.gitignore /path/to/your-repo/
cp /path/to/template/project/.env.example /path/to/your-repo/
```

```powershell
# Windows (PowerShell)
Copy-Item -Recurse -Force /path/to/template/project/* /path/to/your-repo/
Copy-Item -Recurse -Force /path/to/template/project/.claude /path/to/your-repo/
Copy-Item -Recurse -Force /path/to/template/project/.github /path/to/your-repo/
Copy-Item -Force /path/to/template/project/.gitignore /path/to/your-repo/
Copy-Item -Force /path/to/template/project/.env.example /path/to/your-repo/
```

Then customize: edit `CLAUDE.md` (Project Identity section), `docs/strategy-roadmap.md`, and `.claude/settings.json`.

---

## What You Get

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions -- session protocol, behavioral rules, context budget |
| `PROGRESS.md` | Session memory -- active tasks, blockers, next steps |
| `DECISIONS.md` | Architectural decision log -- prevents re-debating |
| `docs/strategy-roadmap.md` | Project planning -- goals, architecture, timeline, testing strategy |
| `docs/ARCHITECTURE.md` | Living architecture doc (web-app, api, mobile-app) |
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

## Planning Your Project

The template's biggest strength is the `/plan` command -- an interactive Q&A that works regardless of how much planning you've already done:

- **"I just have a vague idea"** -- Claude interviews you from scratch, asking about users, features, tech stack, and testing needs
- **"I have a rough concept"** -- Claude asks targeted questions to fill in the gaps
- **"I have a partial spec"** -- Share what you have and Claude completes the missing pieces
- **"I have a full business plan"** -- Paste or point Claude at your docs and it translates them into an actionable development roadmap

The output is always `docs/strategy-roadmap.md` -- a structured document with acceptance criteria, testing strategy, timeline, and human action items that Claude references throughout development.

### What It Looks Like

Here's a typical `/plan` interaction:

```
You:  /plan
Claude: Before we start, where are you with your project idea?
        A) Just a rough concept
        B) Clear idea, no details
        C) Partial plan or spec
        D) Detailed plan or spec

You:  B -- I want to build a recipe sharing app

Claude: Great! Let me ask a few questions to understand the full picture.

        Round 1 -- Core Understanding:
        1. What does this app do? (elevator pitch)
        2. Who will use it?
        3. What problem does it solve?
        4. What makes it different from existing recipe sites?

You:  [answers]

Claude: Round 2 -- Scope & Technical:
        1. What are the 3-5 must-have features for v1?
        2. Any features that can wait?
        ...

You:  [answers]

Claude: Round 3 -- Quality & Testing:
        Based on what you've described (public-facing, user accounts, image uploads),
        I'd recommend the **Rigorous** quality tier:
        - Unit tests for core logic
        - Integration tests for API endpoints
        - E2E tests for key user flows
        - Security scanning in CI
        Does that sound right?

You:  Yes, that works.

Claude: Here's my understanding of the project: [summary]
        Does this capture everything? Anything to add or change?

You:  Looks good!

Claude: Writing docs/strategy-roadmap.md...
        Your roadmap is ready. Tell me to start Phase 1 when you're ready.
```

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

## Troubleshooting

**Claude keeps asking for permission** -- Add the command pattern to `.claude/settings.json`

**Claude lost track of progress** -- Run `git status` and `git log --oneline -5`, then update PROGRESS.md

**Claude re-debates old decisions** -- Add the decision to DECISIONS.md with clear rationale

**Session ended mid-task** -- Run `git status` and `git diff`, tell Claude "continue from where we left off"

**PROGRESS.md is getting long** -- Run `/archive` to move old entries to `docs/archive/`

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT -- see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension) and Claude Code CLI.*

# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-4.0-blue)

A governance and lifecycle framework for Claude Code. Adds persistent session memory, architectural decision tracking, and structured planning to help you take a project from idea to MVP and beyond.

> **What this is:** A set of markdown files, slash commands, and governance hooks that shape how Claude works with your code. Not a CLI tool, not an MCP server, not a code generator.

## Why Use This

Claude Code is powerful out of the box, but multi-session projects need structure:

| Problem | AIAgentMinder Solution |
|---|---|
| Claude forgets what happened last session | **PROGRESS.md** -- git-tracked audit trail Claude reads first every session |
| Claude re-debates past decisions | **DECISIONS.md** -- ADR log with trigger criteria prevents re-debating |
| Projects start without clear goals | **/plan** -- structured interview that produces a strategy roadmap with quality tiers |
| Sessions end with loose ends | **/checkpoint** -- end-of-session housekeeping with archival |
| Dangerous commands slip through | **settings.json** -- minimal permissions baseline with explicit deny list |
| Context lost after compaction | **Governance hooks** -- auto re-inject project state after context compaction |

---

## Quick Start

### 1. Get the template

```bash
git clone https://github.com/lwalden/claude-code-quick-start-template.git
cd claude-code-quick-start-template
```

### 2. Run `/setup`

Open Claude Code **in the cloned directory** and run `/setup`. It will ask about your project and copy the framework files to your target location:

- **New GitHub repo** -- creates the repo and sets up all files
- **Existing repo** -- copies files with confirmation prompts
- **New local project** -- creates directory, `git init`, sets up files
- **Current directory** -- fits template into existing structure

### 3. Run `/plan`

Open Claude Code in your target project and run `/plan`. Claude interviews you about your idea and generates `docs/strategy-roadmap.md`.

### 4. Start building

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

**Manual setup alternative:** Copy `project/*` and `project/.claude/` to your repo, customize `CLAUDE.md` and `.claude/settings.json`, then run `/plan`.

---

## What You Get

| File | Purpose | Read Frequency |
|------|---------|---------------|
| `CLAUDE.md` (~90 lines) | Session protocol, project identity, behavioral rules | Every session (auto) |
| `PROGRESS.md` (~20 lines) | Current tasks, blockers, priorities | Every session (first thing) |
| `DECISIONS.md` | Architectural decision log | Before architectural choices |
| `docs/strategy-roadmap.md` | Goals, architecture, timeline, quality tier | On-demand |
| `.claude/settings.json` | Permissions + hook configuration | N/A (config) |
| `.claude/commands/` | `/plan`, `/checkpoint` | On use |
| `.claude/hooks/` | 4 Node.js governance hooks | Automatic |

### Governance Hooks

Four cross-platform hooks (Node.js) run automatically:

| Hook | Event | What It Does |
|------|-------|-------------|
| Timestamp | Stop | Updates "Last Updated" in PROGRESS.md |
| Auto-commit | Stop | Git checkpoint on feature branches (tracked files only, respects git hooks) |
| Context re-injection | SessionStart | Re-injects PROGRESS.md and DECISIONS.md after context compaction |
| Auto-format | PostToolUse | Runs project formatters (prettier, black, rustfmt, etc.) after edits |

### Permissions

Starts with ~20 safe commands (git, gh, basic utilities). Stack-specific tools added during `/setup`. Dangerous operations are explicitly denied:
- `rm -rf /`, `~`, `C:`, `.` -- catastrophic deletion
- `git push --force` / `-f` -- history rewriting
- `git reset --hard origin` -- destructive reset
- `git clean -fd`, `chmod -R 777` -- unsafe operations

---

## Commands

| Command | Purpose |
|---------|---------|
| `/setup` | Initialize a project (run from this template repo) |
| `/plan` | Create strategy roadmap via structured interview |
| `/checkpoint` | End-of-session: update tracking files, archive if needed, commit |

---

## How It Works

**Session continuity:** Claude reads PROGRESS.md at session start. At session end, `/checkpoint` (or the auto-commit hook) preserves state. Between sessions, progress lives in Git.

**Context budget:** Files are sized for minimal token consumption. CLAUDE.md (~90 lines) and PROGRESS.md (~20 lines) are read every session. Larger files are on-demand. When PROGRESS.md exceeds 100 lines, `/checkpoint` archives old entries.

**Decision tracking:** DECISIONS.md prevents re-debating. Claude checks it before architectural choices. Trigger criteria: library/framework choice, API design, auth approach, data model change, build/deploy decision.

For details: [docs/how-it-works.md](docs/how-it-works.md) | [docs/customization-guide.md](docs/customization-guide.md)

---

## Troubleshooting

- **Commands not showing (VS Code)** -- Close/reopen the Claude Code panel
- **Claude keeps asking permission** -- Add the command to `.claude/settings.json` allow list
- **Claude lost track** -- `git status`, `git log --oneline -5`, update PROGRESS.md
- **Claude re-debates decisions** -- Add to DECISIONS.md with rationale
- **PROGRESS.md too long** -- Run `/checkpoint` (it archives automatically when >100 lines)

---

## License

MIT -- see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension and CLI). Independent open-source project, not affiliated with Anthropic.*

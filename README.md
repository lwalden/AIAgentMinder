# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-5.0-blue)

A governance and lifecycle framework for AI coding agents. Adds persistent session memory, architectural decision tracking, and structured planning to help you take a project from idea to MVP and beyond.

Works with **Claude Code**, **GitHub Copilot**, **OpenAI Codex**, **Cursor**, and any agent that reads `AGENTS.md`.

> **What this is:** A set of markdown files, slash commands, and governance hooks that shape how AI agents work with your code. Not a CLI tool, not an MCP server, not a code generator.

## Why Use This

AI coding agents are powerful, but multi-session projects need structure:

| Problem | AIAgentMinder Solution |
|---|---|
| Agent forgets what happened last session | **PROGRESS.md** -- git-tracked audit trail read first every session |
| Agent re-debates past decisions | **DECISIONS.md** -- ADR log with trigger criteria prevents re-debating |
| Projects start without clear goals | **/plan** -- structured interview that produces a strategy roadmap with quality tiers |
| Sessions end with loose ends | **/checkpoint** -- end-of-session housekeeping |
| Dangerous commands slip through | **settings.json** -- minimal permissions baseline with explicit deny list |
| Context lost after compaction | **Governance hooks** -- auto re-inject project state after context compaction |

---

## Multi-Agent Support

The same project works with any agent. Each agent reads its own config file; all agents share the same `PROGRESS.md` and `DECISIONS./md` state.

| Feature | Claude Code | Copilot (VS Code) | Codex | Cursor |
|---------|:-----------:|:-----------------:|:-----:|:------:|
| Session protocol | Full (native) | Full (hooks) | Manual | Manual |
| PROGRESS.md tracking | Full | Full (hooks) | Manual | Manual |
| DECISIONS.md | Full | Full (hooks) | Manual | Manual |
| `/plan` command | Yes | — | — | — |
| `/checkpoint` command | Yes | — | — | — |
| Auto-commit on session end | Yes | Yes | — | — |
| Context re-injection | Yes | Yes | N/A | N/A |
| Auto-lint on edit | Yes | Yes | — | — |
| Permissions system | Full | Org policies | Limited | — |

**Switching agents between sessions:** No file changes needed. End the session cleanly (update PROGRESS.md, commit), then open with a different agent. State lives in git.

See [project/docs/agent-setup.md](project/docs/agent-setup.md) for per-agent configuration details.

---

## Quick Start

### 1. Get the template

```bash
git clone https://github.com/lwalden/claude-code-quick-start-template.git
cd claude-code-quick-start-template
```

### 2. Set up your project

**Claude Code:** Open Claude Code in the cloned directory and run `/setup`. It will ask about your project and copy the framework files to your target location:

- **New GitHub repo** -- creates the repo and sets up all files
- **Existing repo** -- copies files with confirmation prompts
- **New local project** -- creates directory, `git init`, sets up files
- **Current directory** -- fits template into existing structure

**Other agents:** Open your agent in the cloned directory and say:
`"Read SETUP.md and follow the instructions"`
It will ask about your project and copy the framework files to your target location.

### 3. Create your strategy roadmap

**Claude Code:** Open Claude Code in your target project and run `/plan`. Claude interviews you about your idea and generates `docs/strategy-roadmap.md`.

**Other agents:** Open your agent in the target project and say:
`"Read PLAN.md and follow the instructions"`
Your agent will interview you about your idea and generate `docs/strategy-roadmap.md`.

### 4. Start building

```
Claude Code: "Read CLAUDE.md and PROGRESS.md, then start Phase 1."
Other agents: "Read AGENTS.md and PROGRESS.md, then start Phase 1."
```

**Manual setup alternative:** Copy `project/*` to your repo, then customize for your agent:
- **All agents:** Fill in the Project Identity placeholders in `AGENTS.md`
- **Claude Code:** `CLAUDE.md` is already set (it just imports `AGENTS.md` — no changes needed unless you want to add Claude-specific notes); also customize `.claude/settings.json` with your stack permissions
- **Copilot:** Also fill in the Project Identity placeholders in `.github/copilot-instructions.md` to match; enable hooks with `"github.copilot.chat.agent.runHooks": true` in VS Code settings
- **Codex / Cursor:** `AGENTS.md` alone is sufficient — no additional config files required

---

## What You Get

| File | Purpose | Who reads it |
|------|---------|-------------|
| `AGENTS.md` (~80 lines) | Session protocol, project identity, behavioral rules | Codex, Cursor, all AGENTS.md agents |
| `CLAUDE.md` (~15 lines) | Thin wrapper: imports AGENTS.md + Claude hook info | Claude Code (auto, every session) |
| `.github/copilot-instructions.md` | Full instructions for Copilot | GitHub Copilot (auto) |
| `PROGRESS.md` (~20 lines) | Current tasks, blockers, priorities | All agents (every session, first thing) |
| `DECISIONS.md` | Architectural decision log | All agents (before architectural choices) |
| `docs/strategy-roadmap.md` | Goals, architecture, timeline, quality tier | All agents (on-demand) |
| `docs/agent-setup.md` | Per-agent setup reference | Human reference |
| `.claude/settings.json` | Claude Code permissions + hook config | Claude Code (config) |
| `.claude/commands/` | `/plan`, `/checkpoint` | Claude Code (on use) |
| `.claude/hooks/` | 4 Node.js governance hooks | Claude Code (automatic) |
| `.github/hooks/` | 3 Copilot governance hooks | GitHub Copilot (automatic) |

### Governance Hooks

Four cross-platform hooks (Node.js) run automatically for Claude Code; the same scripts are wired as Copilot hooks for GitHub Copilot:

| Hook | Event | What It Does |
|------|-------|-------------|
| Timestamp | Stop | Updates "Last Updated" in PROGRESS.md |
| Auto-commit | Stop | Git checkpoint on feature branches (tracked files only, respects git hooks) |
| Context re-injection | SessionStart | Re-injects PROGRESS.md and DECISIONS.md after context compaction |
| Auto-format | PostToolUse | Runs project formatters (prettier, black, rustfmt, etc.) after edits |

### Permissions (Claude Code)

Starts with ~20 safe commands (git, gh, basic utilities). Stack-specific tools added during `/setup`. Dangerous operations are explicitly denied:
- `rm -rf /`, `~`, `C:`, `.` -- catastrophic deletion
- `git push --force` / `-f` -- history rewriting
- `git reset --hard origin` -- destructive reset
- `git clean -fd`, `chmod -R 777` -- unsafe operations

---

## Commands

| Command | Purpose | Works with |
|---------|---------|-----------|
| `/setup` | Initialize a project (run from this template repo) | Claude Code |
| `/plan` | Create strategy roadmap via structured interview | Claude Code |
| `/checkpoint` | End-of-session: update tracking files, commit | Claude Code |

---

## How It Works

**Session continuity:** The agent reads PROGRESS.md at session start. At session end, `/checkpoint` (or the auto-commit hook) preserves state. Between sessions, progress lives in Git -- any agent can pick up where another left off.

**Context budget:** Files are sized for minimal token consumption. For Claude Code: CLAUDE.md (~15 lines) imports AGENTS.md (~80 lines) = ~95 lines per session. PROGRESS.md (~20 lines) is read first every session. Larger files are on-demand. PROGRESS.md self-trims: only the 3 most recent session notes are kept.

**Decision tracking:** DECISIONS.md prevents re-debating. The agent checks it before architectural choices. Trigger criteria: library/framework choice, API design, auth approach, data model change, build/deploy decision.

For details: [docs/how-it-works.md](docs/how-it-works.md) | [docs/customization-guide.md](docs/customization-guide.md)

---

## Troubleshooting

- **Commands not showing (VS Code)** -- Close/reopen the Claude Code panel
- **Agent keeps asking permission** -- Add the command to `.claude/settings.json` allow list (Claude Code)
- **Agent lost track** -- `git status`, `git log --oneline -5`, update PROGRESS.md
- **Agent re-debates decisions** -- Add to DECISIONS.md with rationale
- **Copilot not reading instructions** -- Check that `.github/copilot-instructions.md` exists; verify Copilot custom instructions are enabled in VS Code settings
- **Hooks not running (Copilot)** -- Enable `"github.copilot.chat.agent.runHooks": true` in VS Code settings and ensure Node.js is installed

---

## License

MIT -- see [LICENSE](LICENSE).

*Works with Claude Code, GitHub Copilot, OpenAI Codex, Cursor, and any AGENTS.md-compatible agent. Independent open-source project, not affiliated with Anthropic, GitHub, or OpenAI.*

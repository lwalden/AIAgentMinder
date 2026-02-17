# Agent Setup Guide

AIAgentMinder works with all major AI coding agents. Each agent reads its own config file; the governance framework (PROGRESS.md, DECISIONS.md, git hooks) works the same across all of them.

---

## Which File Each Agent Reads

| Agent | Auto-reads | Hook system | Full feature set |
|-------|-----------|-------------|-----------------|
| **Claude Code** (CLI/VS Code) | `CLAUDE.md` → imports `AGENTS.md` | `.claude/settings.json` | Yes (native) |
| **GitHub Copilot** (VS Code) | `.github/copilot-instructions.md` | `.github/hooks/*.json` | Yes (hooks) |
| **OpenAI Codex** (CLI) | `AGENTS.md` (root → hierarchy) | None | Yes (via PLAN.md) |
| **Cursor** | `AGENTS.md` or `.cursorrules` | None | Yes (via PLAN.md) |
| **Other AGENTS.md agents** | `AGENTS.md` | Varies | Yes (via PLAN.md) |

---

## Claude Code

Everything works natively. No additional setup required.

- Reads `CLAUDE.md` at session start (which imports `AGENTS.md`)
- Four governance hooks run automatically (Stop, SessionStart, PostToolUse)
- `/setup` and `/plan` commands available in `.claude/commands/`
- `/checkpoint` for end-of-session housekeeping

---

## GitHub Copilot (VS Code)

1. Open the project in VS Code with the Copilot extension installed
2. Copilot auto-detects `.github/copilot-instructions.md`
3. Enable hooks in VS Code settings: `"github.copilot.chat.agent.runHooks": true`
4. Hooks in `.github/hooks/` will run automatically (requires Node.js)

**Setup:** From the template repo, say: `"Read SETUP.md and follow the instructions"`
**Planning:** In your project, say: `"Read PLAN.md and follow the instructions"`

---

## OpenAI Codex (CLI)

Codex reads `AGENTS.md` from the project root automatically.

**Setup:** Navigate to the cloned template repo directory and say:
`"Read SETUP.md and follow the instructions"`

**Planning:** In your target project, say:
`"Read PLAN.md and follow the instructions"`

**Optional:** Configure `~/.codex/config.toml` to add this project directory to the search path.

---

## Cursor

Cursor reads `AGENTS.md` from the project root.

**Setup:** Open the cloned template repo in Cursor and say:
`"Read SETUP.md and follow the instructions"`

**Planning:** In your target project, say:
`"Read PLAN.md and follow the instructions"`

If Cursor does not pick up `AGENTS.md` in your version, symlink or copy it to `.cursorrules`.

---

## Switching Agents Between Sessions

No file changes are needed. Each agent reads its own file. You can use Claude Code one session and Codex the next -- the shared state lives in `PROGRESS.md` and `DECISIONS.md`, which all agents can read and update.

**Recommended workflow when switching agents:**
1. End the previous session cleanly (update PROGRESS.md, commit)
2. Open the project with the new agent
3. Say: `"Read AGENTS.md and PROGRESS.md, then resume from Next Priorities"`

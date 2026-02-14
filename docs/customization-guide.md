# Customization Guide

## Essential Customizations

Before starting development, customize these files (or let `/setup` do it):

### 1. `CLAUDE.md` -- Project Identity Section

Replace the placeholder block with your actual project info:
```markdown
**Project:** my-app
**Description:** A task management tool for remote teams
**Type:** web-app
**Stack:** TypeScript / Next.js / PostgreSQL / Vercel
**MCP Servers:** postgres (db queries)  ← omit if not using MCP

**Developer Profile:**
- Senior developer, comfortable with TypeScript and React
- Available evenings and weekends
- Medium risk tolerance
```

### 2. `docs/strategy-roadmap.md` -- Your Project Plan

This is the most important file to customize. It tells Claude what you're building and why. Run `/plan` to fill it in interactively, or edit it manually.

At minimum, fill in:
- Executive Summary (vision and success criteria)
- Part 1: Product Strategy (problem, users, features)
- Part 2: Technical Architecture (stack, data models)
- Part 5: Development Timeline (phases and deliverables)

### 3. `PROGRESS.md` -- Initial Tasks

Update the "Active Tasks" and "Next Session Should" sections to reflect your actual starting point. Or leave the defaults and let `/setup` handle it.

---

## Optional Customizations

### Risk Tolerance (in CLAUDE.md)
- **Conservative:** Claude asks before most decisions, smaller PRs, more checkpoints
- **Medium:** Claude makes routine decisions autonomously, asks for architectural choices
- **Aggressive:** Claude makes most decisions autonomously, only asks for major pivots

### Permissions (in `.claude/settings.json`)

The template starts with a minimal baseline. Add stack-specific tools during `/setup`, or manually:

```json
"Bash(your-custom-tool:*)"
```

Examples by stack:
- **Node.js**: `"Bash(npm:*)"`, `"Bash(npx:*)"`, `"Bash(node:*)"`
- **Python**: `"Bash(pip:*)"`, `"Bash(python:*)"`, `"Bash(pytest:*)"`
- **.NET**: `"Bash(dotnet:*)"`
- **Docker**: `"Bash(docker:*)"`, `"Bash(docker-compose:*)"`

Do not add cloud CLIs (`az`, `aws`, `gcloud`, `terraform`) without careful consideration -- these can create billable resources.

### CI/CD

CI/CD is generated on-demand, not scaffolded upfront. When your project reaches a point where it needs CI:

```
Tell Claude: "Set up GitHub Actions CI for this project."
```

Claude will generate an accurate workflow based on your actual project structure.

### MCP Servers

If your project uses MCP servers:
1. Configure them in your Claude Code workspace settings (`.vscode/settings.json` or user settings)
2. Add a `**MCP Servers:**` line to CLAUDE.md Project Identity with the server names
3. Claude will use MCP tools for those tasks instead of shell commands

### Hooks

Claude Code hooks run shell commands on events like file writes, tool calls, or session end. To add hooks to your project:
1. Create `.claude/hooks/` directory
2. Add hook scripts following [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
3. CLAUDE.md will automatically inform Claude to check for and respect hooks

Useful hook ideas:
- Run linting after file edits
- Auto-update PROGRESS.md timestamp after file writes
- Send a notification when a session ends

### Custom Slash Commands

Create new `.claude/commands/your-command.md` files to add project-specific workflows. For example:
- `/deploy-staging` -- steps to deploy to staging
- `/db-migrate` -- database migration workflow
- `/release` -- release preparation checklist

---

## Tips

1. **Be specific in strategy-roadmap.md** -- The more context Claude has, the better decisions it makes
2. **Keep PROGRESS.md updated** -- This is Claude's memory between sessions
3. **Use DECISIONS.md for significant choices** -- Even small decisions can be worth recording
4. **Prefer smaller PRs** -- Easier to review and less risk of lost work
5. **Don't pre-approve cloud CLIs** -- Let Claude ask; you want to review those operations
6. **Generate CI/CD from real code** -- Wait until your project exists before setting up CI

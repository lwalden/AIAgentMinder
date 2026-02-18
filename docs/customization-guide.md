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
**MCP Servers:** postgres (db queries)

**Developer Profile:**
- Senior developer, comfortable with TypeScript and React
- Medium risk tolerance
```

### 2. `docs/strategy-roadmap.md` -- Your Project Plan

Run `/plan` to fill it interactively, or edit manually. At minimum, fill in:
- What & Why (problem, vision, users)
- MVP Features with acceptance criteria
- Technical Stack choices

### 3. `PROGRESS.md` -- Initial Tasks

Update "Active Tasks" and "Next Priorities" to reflect your starting point. Or leave defaults and let `/setup` handle it.

---

## Optional Customizations

### Risk Tolerance (in CLAUDE.md)
- **Conservative:** Claude asks before most decisions, smaller PRs
- **Medium:** Claude makes routine decisions autonomously, asks for architectural choices
- **Aggressive:** Claude makes most decisions autonomously, asks only for major pivots

### Safety (in `.claude/settings.json`)

The template ships a deny list that blocks dangerous commands. Claude Code's default permission system handles everything else — no allow list needed.

To block additional commands, add to the `deny` array:
```json
"Bash(dangerous-command:*)"
```

Do not pre-approve cloud CLIs (`az`, `aws`, `gcloud`, `terraform`) without careful consideration -- these can create billable resources.

### CI/CD

Generated on-demand, not scaffolded upfront:
```
Tell Claude: "Set up GitHub Actions CI for this project."
```

### MCP Servers

1. Configure in Claude Code workspace settings
2. Add `**MCP Servers:**` line to CLAUDE.md Project Identity
3. Claude will use MCP tools instead of shell commands for those tasks

### Hooks

Five governance hooks (Node.js, cross-platform) in `.claude/hooks/`, configured in `.claude/settings.json`:

| Hook | Event | Script | What It Does |
|------|-------|--------|-------------|
| Timestamp | Stop | `session-end-timestamp.js` | Updates "Last Updated" in PROGRESS.md |
| Auto-commit | Stop | `session-end-commit.js` | Git checkpoint on feature branches (tracked files only) |
| Pre-compaction save | PreCompact | `pre-compact-save.js` | Saves PROGRESS.md state before context compaction |
| Context injection | SessionStart | `session-start-context.js` | Injects PROGRESS.md, DECISIONS.md, and task suggestions |

**Prerequisite:** Node.js must be installed for hooks to work.

**Disable a hook:** Remove its entry from `hooks` in `.claude/settings.json`.

**Add a custom hook:** Add a new entry to `settings.json` and create the script in `.claude/hooks/`. See the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks) for the full event list and JSON input format.

**Disable auto-commit:** Remove the `session-end-commit.js` entry from Stop hooks. The timestamp hook runs independently.

### Custom Slash Commands

Create `.claude/commands/your-command.md` files for project-specific workflows:
- `/deploy-staging` -- deployment steps
- `/db-migrate` -- database migration workflow
- `/release` -- release checklist

---

## Tips

1. **Be specific in strategy-roadmap.md** -- More context = better decisions
2. **Run `/handoff` before ending sessions** -- This is how the next session picks up cleanly
3. **Use DECISIONS.md for significant choices** -- Prevents re-debating
4. **Prefer smaller PRs** -- Easier to review, less risk
5. **Don't pre-approve cloud CLIs** -- Review those operations manually
6. **Generate CI/CD from real code** -- Wait until the project has actual code

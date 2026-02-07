# Customization Guide

## Essential Customizations

Before starting development, customize these files (or let `/setup` do it):

### 1. `CLAUDE.md` -- Project Identity Section

Replace the placeholder block with your actual project info:
```markdown
**Project:** My App
**Description:** A task management tool for remote teams
**Type:** web-app
**Stack:** TypeScript / Next.js / PostgreSQL / Vercel

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
- Part 4: Development Timeline (phases and deliverables)

### 3. `PROGRESS.md` -- Initial Tasks

Update the "Active Tasks" and "Next Session Should" sections to reflect your actual starting point. Or leave the defaults and let `/setup` handle it.

---

## Optional Customizations

### Risk Tolerance (in CLAUDE.md)
- **Conservative:** Claude asks before most decisions, smaller PRs, more checkpoints
- **Medium:** Claude makes routine decisions autonomously, asks for architectural choices
- **Aggressive:** Claude makes most decisions autonomously, only asks for major pivots

### Permissions (in .claude/settings.json)

Add project-specific tools:
```json
"Bash(your-custom-tool:*)"
```

Remove permissions for stacks you don't use to keep the file lean. A Python project doesn't need .NET, Rust, or Go permissions.

The template also includes platform-specific entries (`powershell.exe`, `cmd.exe`, `wsl` for Windows; `brew` for macOS). Remove entries for platforms you don't use.

### CI/CD Workflows

The `/setup` command generates stack-specific CI jobs. You can also edit the workflows directly:
- `ci.yml` -- Add build/test jobs for your stack
- `deploy.yml` -- Configure deployment targets
- `dependabot.yml` -- Add your package ecosystem

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
5. **Review commits regularly** -- Claude commits frequently; check the history

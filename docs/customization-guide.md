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

AIAgentMinder includes five governance hooks out of the box in `.claude/hooks/`. These are configured in `.claude/settings.json` under the `hooks` key and run automatically -- no user action needed.

#### Included Hooks

| Hook | Event | Script | What It Does |
|------|-------|--------|-------------|
| PROGRESS.md timestamp | Stop | `session-end-timestamp.sh` | Updates the "Last Updated" date in PROGRESS.md when a session ends |
| Auto-commit checkpoint | Stop | `session-end-commit.sh` | Runs `git add -A && git commit` with a timestamped message so no work is lost |
| Context re-injection | SessionStart | `session-start-context.sh` | After context compaction or resume, re-injects PROGRESS.md and DECISIONS.md |
| Risky command guard | PreToolUse (Bash) | `guard-risky-bash.sh` | Auto-approves safe commands (git status, ls, etc.), blocks dangerous patterns (rm -rf, force push) |
| Auto-format/lint | PostToolUse (Write/Edit) | `post-edit-lint.sh` | Runs project formatters (prettier, black, rustfmt, gofmt, etc.) on edited files |

#### Customizing Hooks

**Disable a hook:** Remove its entry from the `hooks` section in `.claude/settings.json`.

**Add a custom hook:** Add a new entry to `settings.json` and create the script in `.claude/hooks/`. See the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks) for the full event list and JSON input format.

**Modify guard rules:** Edit `guard-risky-bash.sh` to add patterns to the deny list (blocked commands) or allow list (auto-approved commands).

**Disable auto-commit:** If you prefer manual commits, remove the `session-end-commit.sh` entry from the Stop hooks in `settings.json`. The PROGRESS.md timestamp hook can run independently.

#### Risk-Aware Pre-commit Hook (Optional)

For an additional layer of protection, you can wire a risk scanner into Git's pre-commit hook. Create `.git/hooks/pre-commit`:

```bash
#!/usr/bin/env bash
# Risk-aware pre-commit scan
# Exits non-zero if high-risk patterns are detected, prompting human review.

set -euo pipefail

DIFF=$(git diff --cached)
WARNINGS=()

# Credential / secret patterns
if echo "$DIFF" | grep -qiE '(API_KEY|SECRET|PASSWORD|TOKEN)\s*=\s*["\x27][^"\x27]{8,}'; then
  WARNINGS+=("Possible credential in diff (API_KEY/SECRET/PASSWORD/TOKEN with a value)")
fi

# Dangerous shell patterns
if echo "$DIFF" | grep -qE 'rm\s+-rf\s+/'; then
  WARNINGS+=("Dangerous 'rm -rf /' pattern detected")
fi

# Large deletion (>50 lines removed in a single file)
LARGE_DELETE=$(git diff --cached --numstat | awk '$2 > 50 {print $3}')
if [ -n "$LARGE_DELETE" ]; then
  WARNINGS+=("Large deletion (>50 lines) in: $LARGE_DELETE")
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "Pre-commit risk scan flagged the following:"
  for W in "${WARNINGS[@]}"; do
    echo "   - $W"
  done
  echo ""
  echo "Review the diff carefully. To commit anyway: git commit --no-verify"
  echo ""
  exit 1
fi

echo "Pre-commit risk scan passed."
exit 0
```

Note: This is a **Git hook** (`.git/hooks/`), not a Claude Code hook (`.claude/hooks/`). It runs on every `git commit`, whether from Claude or the user. The auto-commit Stop hook uses `--no-verify` to avoid blocking session-end checkpoints.

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

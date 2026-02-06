# Claude Code Project Templates

These templates enable Claude Code to work autonomously on your projects with session continuity, architectural decision tracking, and comprehensive permissions.

## Quick Start

1. **Copy the entire `project-template` folder contents to your new repository:**
   ```bash
   # From this template folder, copy everything to your new repo
   cp -r project-template/* /path/to/your-new-repo/
   cp -r project-template/.* /path/to/your-new-repo/  # Include hidden files
   
   # Or if you're in your new repo:
   cp -r /path/to/project-template/* ./
   cp -r /path/to/project-template/.github ./
   cp /path/to/project-template/.gitignore ./
   cp /path/to/project-template/.env.example ./
   
   # Copy settings to Claude Code config location
   cp settings_local.json ~/.claude/settings_local.json
   # Or for project-specific: mkdir -p .claude && cp settings_local.json .claude/
   ```

2. **Customize the templates:**
   - `docs/strategy-roadmap.md` - Define your project vision, goals, and architecture - recommend having a conversation about your project ideas and vision with an AI Chat that has these files as context. Have it interview you to fill out the road map.
   - `CLAUDE.md` - Adjust developer profile and tech stack sections (works for me as is, but this landscape changes hourly, update as you like)
   - `PROGRESS.md` - Update initial tasks for your project (works for me as is, but this landscape changes hourly, update as you like)
   - `DECISIONS.md` - Pre-populate with any known decisions (works for me as is, but this landscape changes hourly, update as you like)

3. **Start Claude Code and point it to your project**

4. **Tell Claude:** "Read the CLAUDE.md and begin working on this project"

---

## File Descriptions

### `CLAUDE.md`
The main instruction file for Claude Code. It defines:
- Session resume protocol (how to pick up where you left off)
- Developer profile and communication preferences
- Capabilities and boundaries (what Claude can/should do autonomously vs. ask)
- Git workflow and PR format requirements
- Project structure and technology stack
- Phase definitions and success criteria

### `PROGRESS.md`
Session continuity tracker. Claude reads this first every session to understand:
- Current development phase and focus
- What tasks are complete, in progress, or blocked
- What to work on next
- Recent session summaries for context

### `DECISIONS.md`
Architectural Decision Record (ADR) log. Prevents re-debating:
- Technology choices
- Database designs
- API patterns
- Security approaches
- Any significant design decisions

### `docs/strategy-roadmap.md`
High-level project planning document:
- Business/product context
- Technical architecture
- Risk management
- Timeline and cost estimates
- Launch strategy

### `settings_local.json`
Pre-approved permissions for Claude Code. Includes permissions for:
- All git operations (branch, commit, push, etc.)
- GitHub CLI (PR creation, issue management)
- Package managers (npm, pip, cargo, dotnet, etc.)
- Build tools (make, cmake, etc.)
- Cloud CLIs (az, aws, gcloud)
- Docker and Kubernetes
- Common development utilities

### `.github/workflows/ci.yml`
Continuous Integration workflow template:
- Runs on PRs and pushes to main
- Detects which files changed to run appropriate jobs
- Pre-configured jobs for .NET, Node.js, Python, Rust, Go (uncomment what you need)
- Security scanning for secrets and vulnerabilities
- Docker build support

### `.github/workflows/deploy.yml`
Deployment workflow template:
- Manual trigger with environment selection (dev/staging/prod)
- Auto-deploy on release publication
- Environment-specific deployment jobs
- Post-deployment notifications
- Supports Azure, AWS, Kubernetes deployments (uncomment what you need)

### `.github/dependabot.yml`
Automated dependency updates:
- Weekly update schedule
- Configured for GitHub Actions by default
- Templates for npm, NuGet, pip, Cargo, Go, Docker, Terraform (uncomment what you need)
- Grouped updates to reduce PR noise
- Customizable reviewers and labels

---

## Customization Guide

### Essential Customizations

Before using, you MUST customize:

1. **`docs/strategy-roadmap.md`** - This is unique to every project
   - Project vision and goals
   - Technical architecture
   - Feature roadmap
   - Success metrics

2. **`CLAUDE.md` - Project Overview section**
   - Project name and description
   - Developer profile (your experience, preferences)
   - Technology stack

3. **`PROGRESS.md` - Phase Task Status section**
   - Define your actual Phase 1 tasks
   - Set up your milestone structure

### Optional Customizations

Adjust based on your preferences:

- **Risk tolerance** in CLAUDE.md (conservative/medium/aggressive)
- **Commit message style** in DECISIONS.md (conventional commits, etc.)
- **Additional permissions** in settings_local.json for specialized tools

---

## How Session Continuity Works

1. **At session start**, Claude:
   - Reads PROGRESS.md for current state
   - Checks DECISIONS.md for past decisions
   - Runs `git status` and `gh pr list` for pending work
   - Asks about any blocked items

2. **During work**, Claude:
   - Writes code to files immediately (not accumulated in memory)
   - Commits at natural checkpoints
   - Creates feature branches, not direct commits to main
   - Updates PROGRESS.md before complex operations

3. **At session end**, Claude:
   - Updates PROGRESS.md with completed work
   - Records any new decisions in DECISIONS.md
   - Notes what the next session should focus on

4. **If session ends unexpectedly** (token limits):
   - Files written to disk are preserved
   - Uncommitted changes in git are preserved
   - Next session: `git status` shows partial work

---

## Permissions Explained

The `settings_local.json` file pre-approves common development commands so Claude doesn't ask permission for routine tasks.

### Permission Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| Git | git commit, push, checkout | Version control |
| GitHub CLI | gh pr create, gh issue | Repository management |
| .NET | dotnet build, test, add | C# development |
| Node.js | npm install, yarn add | JavaScript/TypeScript |
| Python | pip install, pytest | Python development |
| Rust | cargo build, cargo add | Rust development |
| Go | go build, go test | Go development |
| Cloud CLIs | az, aws, gcloud | Cloud management |
| Docker | docker build, docker run | Containerization |
| Shell | ls, cat, mkdir, grep | File operations |

### Adding Custom Permissions

Edit `settings_local.json` to add project-specific tools:

```json
{
  "permissions": {
    "allow": [
      "Bash(your-custom-tool:*)",
      ...existing permissions...
    ]
  }
}
```

### Security Notes

- The permissions allow common development tools
- They do NOT include destructive system commands
- Claude still cannot merge PRs (by design - human review required)
- Credentials should still use environment variables

---

## Tips for Best Results

1. **Be specific in strategy-roadmap.md** - The more context Claude has, the better decisions it makes

2. **Keep PROGRESS.md updated** - This is Claude's memory between sessions

3. **Use DECISIONS.md liberally** - Even small decisions can be worth recording to avoid re-discussion

4. **Prefer smaller PRs** - Easier to review and less risk of lost work

5. **Review commits regularly** - Claude will commit frequently; check the history

6. **Update settings_local.json** - Add permissions for any tools your project needs

---

## Troubleshooting

### Claude keeps asking for permission
Add the specific command pattern to `settings_local.json`

### Claude lost track of progress
Run `git status` and `git log --oneline -5` to see what's done, then manually update PROGRESS.md

### Claude re-debates old decisions
Add the decision to DECISIONS.md with clear rationale

### Session ended mid-task
Run `git status` and `git diff` to see partial work, tell Claude "continue from where we left off"

---

## Version History

- **v1.0** - Initial release with comprehensive templates

---

*These templates are designed to work with Claude Code (VS Code extension) but the concepts apply to any Claude-based development workflow.*

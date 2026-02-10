# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.1-blue)

A governance and lifecycle control framework for Claude Code. AIAgentMinder adds persistent auditable memory, architectural decision tracking, risk-aware testing, and structured planning to transform Claude from helpful assistant into a production-ready project engine. Deploy AI-assisted projects that stay organized, maintainable, and accountable across sessions.

## Why Use This

Claude Code out of the box is powerful, but production projects need governance. AIAgentMinder provides:

| Capability | Native Claude Code CLI (OOTB) | AIAgentMinder |
|---|---|---|
| Session Persistence | Automatic & Hidden: Uses MEMORY.md to auto-summarize context. Hard to audit or manually "undo" specific facts. | Explicit & Versioned: PROGRESS.md provides a human-readable audit trail that lives in your Git history. |
| Architectural Guardrails | Static: Uses CLAUDE.md for general rules, but often ignores them during deep "agentic" loops. | Active Log: DECISIONS.md acts as an ADR (Architectural Decision Record) to prevent "logic drift" in long-running projects. |
| Project Planning | Reactive: Native "Plan Mode" scans files but often jumps to implementation without deep requirement gathering. | Guided Interview: The /plan command forces a discovery phase, ensuring edge cases are caught before tokens are spent. |
| Lifecycle Control | Ephemeral: Relies on internal history. If the session crashes or resets, specific sub-task state can be lost. | Milestone-Based: Dedicated /checkpoint and /archive commands ensure work is segmented and context stays lean. |
| Testing Strategy | Ad-hoc: Runs whatever test command you tell it, regardless of the change's scope or risk level. | Tiered & Risk-Aware: Pre-defined quality tiers (Unit vs. E2E) matched to the complexity of the current task. |
| CI/CD & DevOps | None: The CLI is strictly a local agent; it does not set up project infrastructure. | Scaffolded: Includes pre-built GitHub Actions, Dependabot configs, and Azure-ready deployment workflows. |
| Security/Perms | Basic: Standard sandbox blocks for dangerous commands (e.g., rm -rf), but lacks project-specific guardrails. | Hardened: Project-level allowedTools overrides and explicit blocks on sensitive enterprise operations. |
| Onboarding | Manual: Requires you to explain the repo structure every time you start a new major feature. | Automated: The /setup command instantly indexes the repo based on 4 pre-defined "Project Archetypes." |

---

## Quick Start

### 1. Get the template

Clone or download the AIAgentMinder repository -- it contains the framework files that you'll customize for your project:

```bash
git clone https://github.com/lwalden/claude-code-quick-start-template.git
cd claude-code-quick-start-template
```

You can also click the green **Code** button on GitHub and choose **Download ZIP**.

### 2. Know what you want to build

Come with something that describes your project -- anything from a single sentence ("I want to build a recipe sharing app") to a full business plan or technical spec. The `/plan` command (Step 4) will interview you and fill in whatever's missing, so don't worry about having everything figured out.

### 3. Run `/setup`

Open Claude Code **in the AIAgentMinder directory you just cloned** and run `/setup`. The command will ask about your target project and copy the framework files there. Choose your scenario:

- **New GitHub repo** – Claude creates the repo and sets up all files
- **Add to existing repo** – Claude copies files into your repo with confirmations
- **New local project** – Claude creates the directory, runs `git init`, and sets up files

**Note (VS Code):** After setup completes, open your target project in VS Code and close/reopen the Claude Code panel so the new slash commands (`/plan`, `/status`, etc.) are detected.

### 4. Plan your project

Open your target project and run `/plan`. Claude interviews you about your idea and generates `docs/strategy-roadmap.md` with goals, timeline, and testing strategy. See [docs/strategy-creation-guide.md](docs/strategy-creation-guide.md) for details and examples.

### Manual Setup (Alternative)

If you prefer to copy files manually instead of running `/setup`:

```bash
# macOS / Linux
cp -r /path/to/aiagentminder/project/* /path/to/your-repo/ && cp -r /path/to/aiagentminder/project/.claude /path/to/your-repo/
```

```powershell
# Windows (PowerShell)
Copy-Item -Recurse -Force /path/to/aiagentminder/project/* /path/to/your-repo/
```

Then open Claude Code in your target repo (restart the Claude Code panel in VS Code so slash commands are detected), customize `CLAUDE.md` and `.claude/settings.json`, and run `/plan` to generate your strategy.

---

## What You Get

Once set up, you'll have:

- **Session memory** ([PROGRESS.md](project/PROGRESS.md)) -- Claude remembers what's done and what's next
- **Decision tracking** ([DECISIONS.md](project/DECISIONS.md)) -- Prevents re-debating architectural choices
- **Interactive planning** (`/plan` command) -- structured strategy roadmap with goals, timeline, and quality tiers
- **Project lifecycle commands** -- `/status`, `/checkpoint`, `/archive` for session management
- **Pre-approved permissions** ([.claude/settings.json](project/.claude/settings.json)) -- Safe defaults for git, package managers, build tools
- **CI/CD scaffolding** – GitHub Actions workflows, Dependabot, deploy templates
- **Comprehensive templates** – CLAUDE.md, strategy roadmap, architecture docs

---

## Next Steps

After setup and planning:

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

Use these commands anytime:
- `/status` — View project state and blockers
- `/checkpoint` — Save session work (updates PROGRESS.md)
- `/archive` — Move old entries when PROGRESS.md grows

---

## How It Works

**Session continuity:** Claude reads `PROGRESS.md` at the start of every session to know what's done, what's blocked, and what to work on next. At session end, `/checkpoint` updates the file. Between sessions, your progress is preserved.

**Context management:** Files are sized for minimal context consumption. `CLAUDE.md` (~80 lines) and `PROGRESS.md` (~15-20 lines) are read every session. Larger files like `strategy-roadmap.md` are read on-demand. The `/archive` command keeps `PROGRESS.md` from growing unbounded.

**Security:** The `.claude/settings.json` pre-approves common development commands (git, package managers, build tools) so Claude doesn't ask permission for routine work. Dangerous operations (`rm`, `git reset --hard`, `kill`, force-push) are excluded and require explicit approval. See [docs/how-it-works.md](docs/how-it-works.md) for details.

For more details see:
- [docs/how-it-works.md](docs/how-it-works.md) -- Session continuity, context budget, security model
- [docs/customization-guide.md](docs/customization-guide.md) -- What and how to customize
- [docs/strategy-creation-guide.md](docs/strategy-creation-guide.md) -- Creating your strategy roadmap

---

## Troubleshooting

**Slash commands not showing up (VS Code)** -- Close and reopen the Claude Code panel. The extension scans `.claude/commands/` at startup, so new commands aren't detected until you restart the panel.

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

*Works with Claude Code (VS Code extension) and Claude Code CLI. AIAgentMinder is an independent open-source project and is not affiliated with Anthropic.*

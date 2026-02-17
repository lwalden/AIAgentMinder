# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-3.2-blue)

A governance and lifecycle framework for Claude Code. AIAgentMinder adds persistent auditable memory, architectural decision tracking, risk-aware testing strategy, and structured planning to help you take a project from idea to MVP and beyond -- efficiently, with a quality end product in mind.

> **What AIAgentMinder is NOT:**
> - Not a CLI wrapper or executable -- there is no code to run
> - Not an AI proxy or MCP server -- it gives Claude files to read, not tools to call
> - Not a replacement for Claude Code's native memory -- PROGRESS.md is a git-tracked audit trail, not context stuffing
> - Not a code generator -- it's a governance template that shapes how Claude works with *your* code

## Why Use This

Claude Code out of the box is powerful, but production projects need governance. AIAgentMinder provides:

| Capability | Native Claude Code (OOTB) | AIAgentMinder |
|---|---|---|
| Session Persistence | Automatic & hidden: MEMORY.md auto-summarizes context. Hard to audit or manually adjust. | Explicit & versioned: PROGRESS.md is a human-readable audit trail that lives in your Git history. |
| Architectural Guardrails | Static: CLAUDE.md sets general rules, but long agentic loops can drift. | Active log: DECISIONS.md with explicit trigger criteria prevents re-debating past choices. Trigger: library/framework choice, API design, auth approach, data model change, build/deploy decision. |
| Project Planning | Reactive: Native Plan Mode scans files but jumps to implementation without deep requirement gathering. | Guided interview: `/plan` forces a discovery phase -- goals, quality tiers, unknowns -- before tokens are spent building. |
| Lifecycle Control | Ephemeral: If a session crashes or gets compacted, sub-task state can be lost. | Milestone-based: `/checkpoint` and `/archive` keep work segmented and context lean. |
| Testing Strategy | Ad-hoc: Runs whatever test command you ask, regardless of change scope or risk. | Tiered & risk-aware: Quality tiers (Lightweight → Comprehensive) matched to project complexity. |
| Permissions | Basic sandbox: Blocks `rm -rf` style commands but lacks project-specific guardrails. | Minimal & explicit: Starts with ~20 safe permissions, stack tools added by `/setup`. No accidental cloud resource creation. |
| MCP & Hooks | Supported but undocumented per-project. | Five governance hooks ship out of the box: auto-commit checkpoint, PROGRESS.md timestamp, context re-injection, risky command guard, and auto-format. MCP awareness built into `/setup` and CLAUDE.md. |

---

## Quick Start

### 1. Get the template

Clone or download the AIAgentMinder repository -- it contains the framework files you'll customize for your project:

```bash
git clone https://github.com/lwalden/claude-code-quick-start-template.git
cd claude-code-quick-start-template
```

You can also click the green **Code** button on GitHub and choose **Download ZIP**.

### 2. Know what you want to build

Come with something that describes your project -- anything from a single sentence to a full spec. The `/plan` command (Step 4) will interview you and fill in whatever's missing.

### 3. Run `/setup`

Open Claude Code **in the AIAgentMinder directory you just cloned** and run `/setup`. The command will ask about your target project and copy the framework files there. Choose your scenario:

- **New GitHub repo** -- Claude creates the repo and sets up all files
- **Add to existing repo** -- Claude copies files into your repo with confirmations
- **New local project** -- Claude creates the directory, runs `git init`, and sets up files
- **Initialize current directory** -- Claude fits the template into your existing structure

**Note (VS Code):** After setup completes, open your target project in VS Code and close/reopen the Claude Code panel so the new slash commands (`/plan`, `/status`, etc.) are detected.

### 4. Plan your project

Open Claude Code in your target project directory and run `/plan`. Claude interviews you about your idea and generates `docs/strategy-roadmap.md` with goals, timeline, and testing strategy. See [docs/strategy-creation-guide.md](docs/strategy-creation-guide.md) for details and examples.

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
- **Decision tracking** ([DECISIONS.md](project/DECISIONS.md)) -- Prevents re-debating architectural choices; explicit trigger criteria so nothing important slips through
- **Interactive planning** (`/plan` command) -- Structured strategy roadmap with goals, timeline, and quality tiers
- **Project lifecycle commands** -- `/status`, `/checkpoint`, `/archive` for session management
- **Minimal permissions** ([.claude/settings.json](project/.claude/settings.json)) -- Safe baseline; stack tools added during setup
- **Governance hooks** ([.claude/hooks/](project/.claude/hooks/)) -- Auto-commit on session end, PROGRESS.md timestamp, context re-injection after compaction, risky command guard, and auto-format/lint
- **Lean gitignore** -- Core secrets/IDE/OS rules plus stack-specific entries added by `/setup`

CI/CD is **not** scaffolded upfront. When you're ready, tell Claude: "Set up GitHub Actions CI for this project." Claude generates an accurate workflow from your actual project structure, not a placeholder skeleton.

---

## Next Steps

After setup and planning:

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

Use these commands anytime:
- `/status` -- View project state and blockers
- `/checkpoint` -- Save session work (updates PROGRESS.md)
- `/archive` -- Move old entries when PROGRESS.md grows

---

## How It Works

**Session continuity:** Claude reads `PROGRESS.md` at the start of every session to know what's done, what's blocked, and what to work on next. At session end, `/checkpoint` updates the file. Between sessions, your progress is preserved in Git.

**Context management:** Files are sized for minimal context consumption. `CLAUDE.md` (~110 lines) and `PROGRESS.md` (~15-20 lines) are read every session. Larger files like `strategy-roadmap.md` are read on-demand. The `/archive` command keeps `PROGRESS.md` from growing unbounded.

**Permissions:** The `.claude/settings.json` starts with ~20 safe permissions (git, gh, basic shell utilities). Stack-specific tools (npm, dotnet, cargo, etc.) are added during `/setup`. Dangerous operations (`rm`, `git reset --hard`, `kill`, force-push) are excluded and always require explicit approval.

**Hooks:** Five governance hooks run automatically via `.claude/hooks/`: auto-commit and PROGRESS.md timestamp on session end, context re-injection after compaction, risky command guard on Bash, and auto-format after file edits. See [docs/customization-guide.md](docs/customization-guide.md) for configuration.

**Native Claude Code integration:** This template works alongside Claude Code's built-in features -- plan mode, compact history, hooks, and MCP servers. CLAUDE.md explicitly tells Claude how each native feature interacts with the project's governance files.

For more details see:
- [docs/how-it-works.md](docs/how-it-works.md) -- Session continuity, context budget, security model
- [docs/customization-guide.md](docs/customization-guide.md) -- What and how to customize
- [docs/strategy-creation-guide.md](docs/strategy-creation-guide.md) -- Creating your strategy roadmap

---

## Troubleshooting

**Slash commands not showing up (VS Code)** -- Close and reopen the Claude Code panel. The extension scans `.claude/commands/` at startup.

**Claude keeps asking for permission** -- Add the command pattern to `.claude/settings.json`

**Claude lost track of progress** -- Run `git status` and `git log --oneline -5`, then update PROGRESS.md

**Claude re-debates old decisions** -- Add the decision to DECISIONS.md with clear rationale

**Session ended mid-task** -- Run `git status` and `git diff`, tell Claude "continue from where we left off"

**PROGRESS.md is getting long** -- Run `/archive` to move old entries to `docs/archive/`

---

## Roadmap

**v3.2 (current):** Five governance hooks ship out of the box -- auto-commit checkpoint (Stop), PROGRESS.md timestamp (Stop), context re-injection (SessionStart), risky command guard (PreToolUse), auto-format/lint (PostToolUse).

**v3.1:** ADR trigger criteria, MVP Goals tracking in CLAUDE.md, risk-aware pre-commit hook example, README clarity.

**v4.0 (planned):** Optional `aiagentminder-mcp` companion server -- a TypeScript MCP server that reads/writes the same governance files but exposes them as Claude tools (`log_adr`, `check_mvp_scope`, `get_status`, `risk_scan`). This would make governance proactive (mid-session) rather than reactive (at checkpoint). The markdown files remain the source of truth; the MCP server is an optional active interface. Zero changes needed to the markdown baseline -- v3.x projects would work with the MCP server without modification.

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

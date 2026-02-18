# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-5.1-blue)

Session continuity and project governance for Claude Code. Takes you from "I have an idea" through planning to MVP — without losing context between sessions.

> **What this is:** Markdown files, slash commands, and lifecycle hooks that give Claude Code persistent memory and structured planning. Not a CLI tool, not an MCP server, not a code generator.

---

## The Problem

Claude Code is excellent at writing code within a single session. But real projects span many sessions, and between them:

- **Claude forgets everything.** Each session starts blank. You re-explain what you're building, where you left off, and what decisions were already made.
- **Planning happens in your head.** Claude Code's `/init` analyzes existing code but doesn't help you plan a new project from scratch — defining what to build, for whom, with what architecture.
- **Decisions get re-debated.** You chose Express over Fastify last week for good reasons. This session, Claude suggests switching.
- **Compaction loses state.** When the context window fills up and compacts, work-in-progress details vanish.

AIAgentMinder solves these with git-tracked project state files that survive across sessions, hooks that inject context automatically, and structured commands for planning and handoff.

---

## How It Works

**Three files** persist your project state in git:

| File | What It Does | When Claude Reads It |
|------|-------------|---------------------|
| `PROGRESS.md` | Current tasks, blockers, priorities, session notes | Every session (auto-injected by hook) |
| `DECISIONS.md` | Architectural decisions with rationale | Every session if decisions exist (auto-injected) |
| `docs/strategy-roadmap.md` | Product brief — what you're building and why | On-demand |

**Two commands** structure your workflow:

| Command | When to Use |
|---------|------------|
| `/plan` | Start of a project — Claude interviews you about your idea and generates a product brief with MVP features, tech stack, and quality tier |
| `/handoff` | End of a session — writes a clear briefing so the next session picks up exactly where you left off |

**Five hooks** run automatically:

| What | When |
|------|------|
| Inject PROGRESS.md + DECISIONS.md into context | Every session start |
| Save state before compaction | Before context window compresses |
| Update timestamp | Session end |
| Auto-commit tracking files | Session end (feature branches only) |

Claude's native Task system is supported too — the SessionStart hook outputs task suggestions extracted from PROGRESS.md that Claude can add to its native task list, giving you git-tracked durability *and* Claude's built-in task orchestration.

---

## Quick Start

### 1. Clone the template

```bash
git clone https://github.com/lwalden/aiagentminder.git
cd aiagentminder
```

### 2. Run `/setup`

Open Claude Code in the cloned directory and run `/setup`. It asks about your project and copies framework files to your target location.

### 3. Run `/plan`

Open Claude Code in your project and run `/plan`. Claude interviews you and generates `docs/strategy-roadmap.md`.

### 4. Build

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

End each session with `/handoff`. The next session — whether a fresh VS Code tab or a new CLI window — automatically picks up where you left off.

### Resuming Work

You don't need a special command to resume. The SessionStart hook injects PROGRESS.md and DECISIONS.md into Claude's context before you type anything. Just open Claude Code and say what you want:

- "Resume" or "Continue where we left off"
- "Start on the next priority"
- "What's the current state?"

Claude already has your tasks, blockers, and priorities. For the first session of a new phase, add: "Read docs/strategy-roadmap.md" for the bigger picture.

**Manual setup:** Copy `project/*` and `project/.claude/` to your repo, fill in the Project Identity section of `CLAUDE.md`, then run `/plan`.

---

## What a Session Looks Like

**Session 1 — Planning:**
Run `/plan`. Claude asks about your project in grouped rounds. You describe a recipe sharing API.
Claude generates `docs/strategy-roadmap.md` with MVP features, stack choices, and a quality tier.
Run `/handoff`. PROGRESS.md now says "Phase 1 ready. Next: scaffold project structure."

**Session 2 — Building:**
Open Claude Code. It already knows the project state (hook injected PROGRESS.md).
Say "Start on the next priority." Claude scaffolds the Express app, sets up routes, writes initial tests.
Run `/handoff`. PROGRESS.md now says "GET /recipes working with tests. Next: POST endpoint + validation."

**Session 3 — Continuing:**
Open a fresh Claude Code tab. Say "Resume."
Claude picks up from the handoff: implements POST /recipes with Zod validation, adds error handling.
Decides to use Zod for validation — logs it in DECISIONS.md with alternatives considered and tradeoffs.

See a [full demo walkthrough](examples/demo-transcript.md) with actual prompts and session state changes.

---

## What Gets Copied to Your Project

```
your-project/
├── CLAUDE.md              # ~70 lines — session protocol, project identity, rules
├── PROGRESS.md            # ~20 lines — current state, self-trimming session notes
├── DECISIONS.md           # Architectural decision log
├── docs/
│   └── strategy-roadmap.md  # Product brief (generated by /plan)
├── .gitignore             # Core + stack-specific entries
└── .claude/
    ├── settings.json      # Safety deny list + hook configuration
    ├── commands/
    │   ├── plan.md        # /plan — structured planning interview
    │   └── handoff.md     # /handoff — session-end briefing
    └── hooks/
        ├── session-start-context.js    # Injects state on every session start
        ├── pre-compact-save.js         # Saves state before compaction
        ├── session-end-timestamp.js    # Updates PROGRESS.md timestamp
        └── session-end-commit.js       # Auto-commits on feature branches
```

---

## Requirements

- **Claude Code** (VS Code extension or CLI) — this is a Claude Code framework, not a standalone tool
- **Node.js** — required for governance hooks (they're small cross-platform scripts)
- **Git** — session state is tracked in git
- **GitHub CLI (`gh`)** — optional, for PR workflows

Works on **Windows, macOS, and Linux**. All hooks are Node.js (no bash dependency).

---

## When to Use This vs. Alternatives

**Use AIAgentMinder if you're** a solo developer or small team starting a new project and you want structured planning plus session continuity without overhead. You want something lightweight that works at the CLI level.

**Use Claude Code's built-in `/init` if** you already have a codebase and just need Claude to understand it. `/init` is great for existing projects; AIAgentMinder is for new ones.

**Use CCPM or Simone if** you need full project management with GitHub Issues integration, parallel multi-agent execution, PRDs, and epic tracking. These are heavier systems for larger teams.

**Use a custom CLAUDE.md if** you already have your own conventions and just want to write instructions by hand. AIAgentMinder adds structure on top — hooks, commands, and state management — but if you don't need that, a good CLAUDE.md is enough.

---

## Non-Goals

AIAgentMinder deliberately does not try to be:

- **A task management system.** Use GitHub Issues, Linear, or Jira for that. PROGRESS.md tracks session state, not project-wide task management.
- **A multi-agent orchestrator.** Tools like CCPM and claude-flow handle parallel agent coordination. AIAgentMinder is for single-developer, single-agent workflows.
- **A CLI tool.** There's nothing to install beyond copying files. The "tool" is markdown + hooks + slash commands that live in your repo.
- **A replacement for Claude Code's built-in memory.** If Claude Code ships robust native memory persistence, AIAgentMinder's session continuity hooks become less critical. The planning and decision governance layers remain independently valuable.

---

## Troubleshooting

- **Commands not showing (VS Code)** — Close/reopen the Claude Code panel
- **Hooks not running** — Verify Node.js is installed (`node --version`). Check `/hooks` in Claude Code to see loaded hooks.
- **Claude lost track mid-session** — Run `/handoff` to write current state, then continue or start fresh
- **Claude re-debates decisions** — Add the decision to DECISIONS.md with rationale

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — what to customize and how
- [Product Brief Creation Guide](docs/strategy-creation-guide.md) — using `/plan` or writing manually
- [Examples](examples/) — filled-in state files from a realistic project (recipe API)

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension and CLI). Independent open-source project, not affiliated with Anthropic.*

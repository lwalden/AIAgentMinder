# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-0.7.0-blue)

Project governance and planning for Claude Code. Structured `/plan` interviews, sprint workflows, and decision tracking — designed to complement Claude Code's native memory system, not replace it.

> **What this is:** Markdown files, slash commands, and lifecycle hooks that add structured planning and governance on top of Claude Code. Not a CLI tool, not an MCP server, not a code generator.

---

## The Problem

Claude Code's native memory system (Session Memory, auto-memory, `claude --continue`) has largely solved session continuity. What it doesn't provide:

- **Structured project planning.** No interview-driven product brief, quality tier selection, or MVP decomposition.
- **Sprint governance.** No structured issue decomposition with human approval before implementation starts.
- **Architectural decision logging.** No convention for recording what was decided and why, preventing future re-debate.
- **Session-end discipline.** No structured checkpoint to capture priorities and decisions at session end.

AIAgentMinder fills these gaps while leaving native memory to do what it does best.

---

## How It Works

**Core files** establish project context:

| File | What It Does | When Claude Reads It |
|------|-------------|---------------------|
| `CLAUDE.md` | Project identity, behavioral rules, quality tier | Every session (auto) |
| `DECISIONS.md` | Architectural decisions with rationale | On-demand; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| `docs/strategy-roadmap.md` | Product brief — what you're building and why | On-demand |
| `.claude/rules/*.md` | Development discipline rules — TDD, error handling, sprint workflow | Every session (Claude Code native rules loading) |
| `SPRINT.md` | Active sprint issues and status | Every session when sprint enabled (via `@import` in CLAUDE.md) |

**Three commands** structure your workflow:

| Command | When to Use |
|---------|------------|
| `/plan` | Start of a project — Claude interviews you and generates a product brief with MVP features, tech stack, and quality tier |
| `/handoff` | End of a session — records key priorities to auto-memory, updates DECISIONS.md, commits |
| `/update` | Upgrade an existing installation — handles migration from previous versions |

**Two hooks** run automatically:

| What | When |
|------|------|
| Auto-commit checkpoint | Session end (feature branches only) |
| Sprint reorientation | After context compaction (outputs active sprint summary) |

**Native Claude Code features do the rest:** Session Memory preserves context within a session, auto-memory (MEMORY.md) persists decisions and priorities across sessions, and `claude --continue` restores full message history. AIAgentMinder complements these rather than duplicating them.

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

Open Claude Code in your project and run `/plan`. For new projects, Claude interviews you and generates `docs/strategy-roadmap.md`. For existing projects, choose **Starting Point E** — Claude audits your codebase and generates filled-in state files instead.

After determining your quality tier, `/plan` also asks whether to enable **code quality guidance** (TDD, review-before-commit, error handling rules) and **sprint planning** (issue decomposition, per-issue PRs, SPRINT.md tracking) — both recommended for Standard+ projects.

### 4. Build

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

End each session with `/handoff` to record priorities and decisions.

### Resuming Work

Use `claude --continue` to restore the previous session's full message history. Or start a new session — Session Memory automatically provides context from past sessions. Say:

- "Resume" or "Continue where we left off"
- "Start on the next priority"
- "What's the current sprint status?"

**Manual setup:** Copy `project/*` and `project/.claude/` to your repo, fill in the Project Identity section of `CLAUDE.md`, then run `/plan`.

---

## What a Session Looks Like

**Session 1 — Planning:**
Run `/plan`. Claude asks about your project in grouped rounds. You describe a recipe sharing API.
Claude generates `docs/strategy-roadmap.md` with MVP features, stack choices, and a quality tier.
With sprint planning enabled, Claude notes: "Ready to start Phase 1 — say 'start a sprint' when you are."
Run `/handoff`. Key priorities are written to auto-memory.

**Session 2 — Sprint planning + building:**
Open Claude Code. Session Memory already knows the project state.
Say "Start a sprint for Phase 1." Claude proposes 5 issues with acceptance criteria. You review and approve.
Claude creates a branch, implements S1-001 (scaffold), commits, opens a PR. Waits for your review.
After you merge, Claude moves to S1-002 (auth endpoints).

**Session 3 — Continuing:**
Open a fresh Claude Code tab. SPRINT.md is loaded automatically (via `@import` in CLAUDE.md).
Say "Resume." Claude picks up exactly where it left off — next issue in the sprint backlog.

See a [full demo walkthrough](examples/demo-transcript.md) with actual prompts and session state changes.

---

## What Gets Copied to Your Project

```
your-project/
├── CLAUDE.md              # ~50 lines (baseline) — project identity, behavioral rules
├── PROGRESS.md            # Optional human-readable artifact
├── DECISIONS.md           # Architectural decision log
├── SPRINT.md              # Sprint state tracking (optional, for sprint-driven development)
├── docs/
│   └── strategy-roadmap.md  # Product brief (generated by /plan)
├── .gitignore             # Core + stack-specific entries
└── .claude/
    ├── settings.json      # Hook configuration
    ├── commands/
    │   ├── plan.md        # /plan — structured planning interview
    │   └── handoff.md     # /handoff — session-end checkpoint
    │   # Note: setup.md (/setup) and update.md (/update) stay in the AIAgentMinder
    │   # repo — they are meta-commands run from there, not installed into target projects
    ├── rules/             # optional, enabled during /plan or /setup
    │   ├── README.md      # Explains the rules directory
    │   ├── code-quality.md   # TDD, review-before-commit, error handling (~18 lines)
    │   └── sprint-workflow.md  # Sprint planning and execution workflow (~35 lines)
    └── hooks/
        ├── compact-reorient.js   # Sprint summary after context compaction
        └── session-end-commit.js # Auto-commits on feature branches
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

**Use AIAgentMinder if you're** a solo developer or small team — new project or existing — who wants structured planning, decision tracking, and optional sprint workflows without overhead.

**Use CCPM or Simone if** you need full project management with GitHub Issues integration, parallel multi-agent execution, PRDs, and epic tracking. These are heavier systems for larger teams.

**Use a custom CLAUDE.md if** you just want to write instructions by hand and your project fits comfortably in a single session. AIAgentMinder adds structure on top — planning interviews, decision logs, sprint governance, and hooks — but if you don't need that, a good CLAUDE.md is enough.

---

## Non-Goals

AIAgentMinder deliberately does not try to be:

- **A full backlog or issue tracker.** AIAgentMinder guides a project from idea through phased delivery — `/plan` defines the phases, DECISIONS.md tracks architectural choices, `/handoff` keeps priorities current. Sprint planning adds lightweight issue decomposition within a phase, but it's not a persistent backlog of 50 issues. If you need that, layer GitHub Issues or Linear on top.
- **A multi-session orchestrator.** Claude Code can still spawn subagents and parallelize work within a session on its own — AIAgentMinder doesn't prevent that. What it doesn't do is coordinate multiple independent Claude Code sessions working on separate branches simultaneously. Tools like CCPM and claude-flow handle that.
- **A CLI tool.** There's nothing to install beyond copying files. The "tool" is markdown + hooks + slash commands that live in your repo.
- **A replacement for Claude Code's native memory.** Claude Code's Session Memory, auto-memory (MEMORY.md), and `claude --continue` handle session continuity natively. AIAgentMinder complements these with planning structure, governance, and sprint workflows — not with a parallel memory system.

---

## Troubleshooting

- **Commands not showing (VS Code)** — Close/reopen the Claude Code panel
- **Hooks not running** — Verify Node.js is installed (`node --version`). Check `/hooks` in Claude Code to see loaded hooks.
- **Claude lost track mid-session** — Run `/handoff` to write current priorities to auto-memory, then continue or start fresh
- **Claude re-debates decisions** — Add the decision to DECISIONS.md with rationale; optionally add `@DECISIONS.md` to CLAUDE.md for auto-loading
- **Upgrading an existing project** — Run `/update` from the AIAgentMinder repo. It handles migration from previous versions, overwrites hook and command files, and surgically merges CLAUDE.md while preserving your Project Identity and MVP Goals

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — what to customize and how, including optional features
- [Product Brief Creation Guide](docs/strategy-creation-guide.md) — using `/plan` or writing manually
- [Examples](examples/) — filled-in state files from a realistic project (recipe API)

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension and CLI). Independent open-source project, not affiliated with Anthropic.*

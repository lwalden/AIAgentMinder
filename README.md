# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-4.2.0-blue)
[![npm](https://img.shields.io/npm/v/aiagentminder)](https://www.npmjs.com/package/aiagentminder)

A governance framework for Claude Code. Slash commands, rules files, hooks, and shell scripts that add sprint execution, quality enforcement, and context management to Claude Code projects.

> **What this is:** An installable template — no runtime dependency, no MCP server, no database. Built for a solo developer who wants Claude Code to execute autonomously while maintaining engineering discipline.
>
> **Command prefix:** All commands use the `aam-` prefix (e.g., `/aam-brief`, `/aam-handoff`) to avoid collision with Claude Code built-ins and other plugins.

---

## Quick Start

### Install

```bash
# Recommended: npx installer (interactive — asks about your project, copies files)
npx aiagentminder init

# Or with all optional features enabled (no prompts)
npx aiagentminder init --all

# Or core governance only (no sprint planning, no architecture fitness)
npx aiagentminder init --core
```

Alternative: clone the repo and run `/aam-setup` from Claude Code.

### After install

1. Run `/aam-brief` to create your product brief and strategy roadmap.
2. Start building: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."

With sprint planning enabled: "Start a sprint for Phase 1."

---

## What It Does

AIAgentMinder addresses three gaps in Claude Code:

- **Autonomous execution.** Sprint-driven development with spec approval gates, then fully autonomous execution — TDD, quality gates, self-review, PR creation, and merge without permission prompts.
- **Quality enforcement.** Mandatory TDD, quality gates, self-review (with optional cross-model validation), and scope checks that Claude cannot skip. Engineering practices that catch defects early.
- **Context management.** Real-time token monitoring, autonomous context cycling across sessions, and session handoff — preventing the quality degradation that happens as context fills up.

---

## How It Works

### Core files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project identity, behavioral rules (auto-loaded every session) |
| `DECISIONS.md` | Architectural decisions, rationale, known debt log |
| `docs/strategy-roadmap.md` | Product brief — features, phases, out-of-scope items |
| `.claude/rules/*.md` | Universal rules (auto-loaded every session) |
| `SPRINT.md` | Active sprint header and issue table (optional) |
| `BACKLOG.md` | Work inbox — capture future work via `/aam-backlog` |
| `.pr-pipeline.json` | PR pipeline config — high-risk patterns, merge method, cross-model review |

### Rules

**Universal rules** (loaded every session, all modes):

| Rule | What it does |
|------|-------------|
| `git-workflow.md` | Branch naming, commit discipline, PR-only workflow |
| `tool-first.md` | Use CLI/API tools instead of asking the user to do things manually |
| `correction-capture.md` | Detects repeated wrong-first-approach patterns and proposes permanent rules |
| `context-cycling.md` | Procedure for context cycling when the PreToolUse hook fires |

**Mode-specific rules** (loaded via session profile agents):

| Rule | Loaded by | What it does |
|------|-----------|-------------|
| Sprint workflow | `sprint-master` | Orchestrated sprint execution via specialist sub-agents |
| Code quality | `dev`, `qa` | TDD cycle, build-before-commit, small focused functions |
| Scope guardian | `dev` | Checks new work against the roadmap before implementing |
| Approach-first | `dev` | States intended approach before multi-file or architecture changes |
| Debug checkpoint | `dev`, `debug`, `hotfix` | Stops debugging spirals after 3 failed attempts at the same error |
| Architecture fitness | `dev`, `qa` | Structural constraints — file size limits, secrets detection, layer boundaries |

### Session profiles

Use `claude --agent <name>` to load the right context for your task:

| Profile | Purpose |
|---------|---------|
| `sprint-master` | Orchestrated sprint execution — coordinates specialist sub-agents per phase |
| `dev` | General development — TDD, architecture fitness, approach-first |
| `debug` | Debugging — checkpoint pattern, triage |
| `hotfix` | Minimal ceremony — debug checkpoint only |
| `qa` | Quality review — code quality, architecture fitness |

### Commands

| Command | Purpose |
|---------|---------|
| `/aam-brief` | Interview-driven product brief and strategy roadmap |
| `/aam-revise` | Update the plan — add, drop, or reprioritize features with decision logging |
| `/aam-scope-check` | Compare proposed work against the roadmap |
| `/aam-handoff` | Session-end checkpoint — decisions, priorities, commit |
| `/aam-quality-gate` | Pre-PR quality checklist (build, tests, coverage, lint, security) |
| `/aam-self-review` | Pre-PR code review via specialist subagents (security, performance, API design, cost, UX friction) + judge pass |
| `/aam-pr-pipeline` | Autonomous PR review-fix-test-merge pipeline |
| `/aam-tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor |
| `/aam-triage` | Structured bug triage — reproduce, diagnose, fix plan, GitHub issue |
| `/aam-grill` | Plan interrogation — walk every decision branch before implementing |
| `/aam-milestone` | Project health assessment across phase progress, timeline, scope drift |
| `/aam-retrospective` | Sprint metrics and adaptive sizing guidance |
| `/aam-backlog` | Capture, review, and promote backlog items (all I/O via `backlog-capture.sh`) |
| `/aam-sync-issues` | Push sprint issues to GitHub Issues (optional) |

### Hooks and scripts

| Script | Purpose |
|--------|---------|
| `context-monitor.sh` | Status line data bridge — writes `.context-usage` with token thresholds |
| `context-cycle-hook.sh` | PreToolUse hook — blocks non-cycle tools when context threshold is hit |
| `context-cycle.sh` | Self-termination for context cycling (cross-platform) |
| `correction-capture-hook.sh` | PostToolUse hook — detects correction patterns, logs to `.corrections.jsonl` |
| `sprint-stop-guard.sh` | Stop hook — blocks premature turn endings during sprint execution |
| `session-start-hook.sh` | SessionStart hook — detects continuation signals and active sprints |
| `stop-failure-hook.sh` | StopFailure hook — logs API errors and preserves sprint state |
| `sprint-update.sh` | Zero-token-cost SPRINT.md status updates (no LLM file I/O) |
| `version-bump.sh` | Zero-token-cost version bump across all version points |
| `decisions-log.sh` | Zero-token-cost DECISIONS.md entry appender |
| `backlog-capture.sh` | Zero-token-cost BACKLOG.md management (add, list, promote, detail, count) |
| `sprint-runner.ps1/.sh` | Wrapper that auto-restarts Claude on context cycle |
| `install-profile-hook.ps1/.sh` | One-time setup for automatic context cycling |

### Context cycling

Claude's output quality degrades as context fills up. AIAgentMinder detects this and handles it:

1. **Monitoring:** `context-monitor.sh` receives token metrics after every assistant message. Model-specific thresholds: 500k tokens for Sonnet, 580k for Opus (recalibrated for 1M context).
2. **Enforcement:** `context-cycle-hook.sh` (PreToolUse) blocks non-essential tools when the threshold is hit, forcing Claude to save state and cycle.
3. **Recovery:** Claude commits work, writes a continuation file, self-terminates. A fresh session starts automatically via profile hook or sprint-runner.

One-time setup: run `install-profile-hook.ps1` (Windows) or `install-profile-hook.sh` (macOS/Linux).

---

## Development Lifecycle

| Step | Mechanism | What happens |
|------|-----------|-------------|
| **Plan** | `/aam-brief` | Interview-driven product brief with MVP features and phases |
| **Revise** | `/aam-revise` | Update plan when requirements change — decision logging and sprint impact |
| **Decompose** | Sprint planning | Break features into 4–7 issues with acceptance criteria and risk tags |
| **Spec** | Spec phase | Implementation spec per item — approach, TDD plan, post-merge validation |
| **Execute** | Autonomous | TDD, full test suite, quality gate, self-review for every item — no permission prompts |
| **Gate** | Quality pipeline | Quality checklist, specialist review, PR creation and autonomous merge |
| **Validate** | Post-merge | Deployment-dependent tests. Failures create rework tasks within the sprint |
| **Checkpoint** | `/aam-handoff` | Session-end — decisions, priorities to auto-memory, commit |
| **Reflect** | `/aam-retrospective` | Sprint metrics, adaptive sizing, phase health assessment |

---

## Requirements

- **Claude Code** — VS Code extension, CLI, or desktop app
- **Node.js** — for the `npx aiagentminder init` installer (not needed at runtime)
- **jq** — for context monitoring (`winget install jqlang.jq` / `brew install jq` / `apt install jq`). Falls back to heuristics without it.
- **Git** — project state tracked in git
- **GitHub CLI (`gh`)** — optional, for PR pipeline and issue sync

Works on **Windows, macOS, and Linux**.

---

## When to Use This

**Use AIAgentMinder if** you're a solo developer who wants Claude Code to execute autonomously with quality enforcement. You want sprint execution, enforced TDD, and structured planning without constant steering.

**Use a plain CLAUDE.md if** your project fits in a few sessions and you don't need sprint governance, decision logging, or context management. AIAgentMinder adds structure — only use it if the structure pays for itself.

---

## Non-Goals

- **Not a ticket tracker.** Keeps a living plan in `docs/strategy-roadmap.md` and decomposes it into sprints on demand. Use `/aam-revise` to update. Layer GitHub Issues or Linear on top if you need persistent epics.
- **Not a multi-agent orchestrator.** Session profiles select the right context per mode. Does not coordinate parallel agent instances (v5.0 plans orchestrator pattern).
- **Not a memory system replacement.** Complements Claude Code's native Session Memory, auto-memory, and `--continue`. Adds real-time context monitoring and autonomous cycling.

---

## Troubleshooting

Run `npx aiagentminder sync . --dry-run` to verify your installation is current.

| Symptom | Fix |
|---------|-----|
| Commands not showing (VS Code) | Close and reopen the Claude Code panel |
| Hooks not firing | Run `npx aiagentminder sync . --dry-run` to check settings.json |
| Claude re-debates a past decision | Add it to DECISIONS.md; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| Claude builds something out of scope | Run `/aam-scope-check`; `scope-guardian.md` also catches this passively |
| Claude asks you to do things manually | Verify `tool-first.md` exists in `.claude/rules/` |
| Quality degrades late in session | Verify `jq` is installed and status line is in `.claude/settings.json` |
| Context cycle doesn't restart | Verify profile hook is installed or use `sprint-runner.ps1` |
| Upgrading | Run `npx aiagentminder sync [path] --apply` or `/aam-update` from the AIAgentMinder repo |

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — optional features, architecture fitness, context cycling
- [Product Brief Guide](docs/strategy-creation-guide.md) — using `/aam-brief` or writing the roadmap manually
- [Roadmap](docs/strategy-roadmap.md) — version history and backlog

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code. Independent open-source project, not affiliated with Anthropic.*

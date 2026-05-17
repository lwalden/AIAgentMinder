# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-5.1.1-blue)

A Claude Code **plugin** that adds project governance for AI-assisted development: sprint execution with worktree-isolated items, quality gates, TDD workflow, scope control, architecture fitness, and structured planning. Built for solo developers and small teams.

> **As of v5.0, AIAgentMinder is distributed as a Claude Code plugin.** The npm CLI (`npx aiagentminder init`) is retired; use the native `/plugin` flow instead.

---

## Quick Start

### Install

In Claude Code:

```
/plugin marketplace add lwalden/AIAgentMinder
/plugin install aiagentminder@lwalden-aiagentminder
```

Then in your target project:

```
/aiagentminder:setup
```

`/aiagentminder:setup` runs interactively — it fingerprints your codebase, asks for project identity, writes a starter `CLAUDE.md`, `DECISIONS.md`, `BACKLOG.md`, and `docs/strategy-roadmap.md`, and seeds `.claude/rules/` and `.gitignore`.

### After install

1. Run `/aiagentminder:brief` to draft a product brief and strategy roadmap.
2. Start building. With sprint planning: "Start a sprint for Phase 1."

### Minimum Claude Code version

v5.0 relies on Claude Code 2.1.139+ for worktree-isolated agent execution (`isolation: "worktree"`), the `/goal` command, and `${CLAUDE_PLUGIN_ROOT}` hook variable substitution.

### Where this works

AIAgentMinder is a Claude Code **plugin** — it ships agents, skills, hooks, and `bin/` scripts that only load in environments with a local Claude Code install.

| Environment | Plugin works? | Notes |
|---|---|---|
| Claude Code CLI (macOS / Linux / Windows) | ✅ Full | Primary target. |
| VS Code with the Claude Code extension | ✅ Full | Extension hosts a local Claude Code; same surface as CLI. |
| JetBrains IDE extension | ✅ Full | Same as VS Code. |
| **claude.ai/code (browser web sessions)** | ❌ No | Web sessions don't load plugins. No `/aiagentminder:*` commands, no sub-agents, no hooks, no `bin/` scripts on PATH. Only the artifacts that `/aiagentminder:setup` previously copied into the repo (`CLAUDE.md`, `.claude/rules/*.md`, `SPRINT.md`, `BACKLOG.md`, `DECISIONS.md`, `docs/strategy-roadmap.md`) remain available, since they live in the repo itself. |

If you ran `/aiagentminder:setup` against your project from a local Claude Code session, that project is still usable from web — Claude will read CLAUDE.md and the rules — but plugin-only workflows (sprint planning, TDD agent, quality gates, handoff, retrospective) are CLI/IDE only.

Mobile / Claude desktop app parity is not a goal.

---

## What It Does

AIAgentMinder addresses three gaps in Claude Code:

- **Autonomous execution.** Sprint-driven development with spec approval gates, then fully autonomous execution — TDD, quality gates, self-review, PR creation, and merge without permission prompts.
- **Quality enforcement.** Mandatory TDD, quality gates, self-review (with optional cross-model validation), and scope checks that Claude cannot skip. Engineering practices that catch defects early.
- **Context management.** Real-time token monitoring (status line writes `.context-usage`) with an advisory Stop-hook warning when over threshold, plus `/aiagentminder:handoff` for clean cross-session state via Claude Code's native Auto Memory.

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
| `BACKLOG.md` | Work inbox — capture future work via `/aiagentminder:backlog` |
| `.pr-pipeline.json` | PR pipeline config — high-risk patterns, merge method, cross-model review |

### Rules

**Universal rules** (loaded every session, all modes):

| Rule | What it does |
|------|-------------|
| `git-workflow.md` | Branch naming, commit discipline, PR-only workflow |
| `tool-first.md` | Use CLI/API tools instead of asking the user to do things manually |
| `context-warnings.md` | How to respond when the advisory context-warning hook fires |

Repeated-mistake capture used to ship as an AAM rule + hook; it was retired in favor of Claude Code's native **Auto Memory**.

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
| `/aiagentminder:brief` | Interview-driven product brief and strategy roadmap |
| `/aiagentminder:revise` | Update the plan — add, drop, or reprioritize features with decision logging |
| `/aiagentminder:scope-check` | Compare proposed work against the roadmap |
| `/aiagentminder:handoff` | Session-end checkpoint — decisions, priorities, commit |
| `/aiagentminder:quality-gate` | Pre-PR quality checklist (build, tests, coverage, lint, security) |
| `/aiagentminder:self-review` | Pre-PR code review via specialist subagents (security, performance, API design, cost, UX friction) + judge pass |
| `/aiagentminder:pr-pipeline` | Autonomous PR review-fix-test-merge pipeline |
| `/aiagentminder:tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor |
| `/aiagentminder:triage` | Structured bug triage — reproduce, diagnose, fix plan, GitHub issue |
| `/aiagentminder:grill` | Plan interrogation — walk every decision branch before implementing |
| `/aiagentminder:milestone` | Project health assessment across phase progress, timeline, scope drift |
| `/aiagentminder:retrospective` | Sprint metrics and adaptive sizing guidance |
| `/aiagentminder:backlog` | Capture, review, and promote backlog items (all I/O via `backlog-capture.sh`) |
| `/aiagentminder:sync-issues` | Push sprint issues to GitHub Issues (optional) |

### Hooks and scripts

All scripts ship in the plugin's `bin/` directory and are on the Bash tool's PATH while the plugin is enabled. Hooks register automatically via `hooks/hooks.json` — no manual install step.

| Script | Purpose |
|--------|---------|
| `context-monitor.sh` | Status line data bridge — writes `.context-usage` with token thresholds (wired into your project's `.claude/settings.json` by `/aiagentminder:setup`) |
| `context-warning-hook.sh` | Stop hook — emits an advisory warning when `.context-usage` shows over-threshold (v5.1+) |
| `sprint-phase-guard.sh` | PreToolUse hook (`matcher: "Agent"`) — blocks sub-agent dispatches that don't match SPRINT.md phase |
| `sprint-phase-reminder.sh` | Stop hook — one-line phase-appropriate reminder per turn during an active sprint (v5.1+) |
| `sprint-stop-guard.sh` | Stop hook — blocks premature turn endings during sprint execution |
| `session-start-cycle-reset.sh` | SessionStart hook — wipes stale `.context-usage` so resumed sessions get a fresh threshold |
| `session-start-hook.sh` | SessionStart hook — detects active sprints and surfaces a one-line reminder |
| `stop-failure-hook.sh` | StopFailure hook — logs API errors and preserves sprint state |
| `hlpm-ping.sh` | SessionStart/SessionEnd — notifies an optional HLPM executive layer if `HLPM_DIR` env var is set |
| `sprint-update.sh` | Zero-token-cost SPRINT.md status updates (no LLM file I/O) |
| `version-bump.sh` | Zero-token-cost version bump across all version points |
| `decisions-log.sh` | Zero-token-cost DECISIONS.md entry appender |
| `backlog-capture.sh` | Zero-token-cost BACKLOG.md management (add, list, promote, detail, count) |
| `sprint-runner.ps1/.sh` | Wrapper that auto-restarts Claude on `/exit` — optional, for dedicated unattended sprint sessions |
| `aam-bootstrap.sh` | Internal — file copies + settings.json merge for `/aiagentminder:setup` |

### Context warnings (v5.1+)

Claude's output quality degrades as context fills up. AIAgentMinder surfaces the threshold and leaves the action to you:

1. **Monitoring.** `context-monitor.sh` receives token metrics from the status line and writes `.context-usage`. Model-specific thresholds: 500k for Sonnet, 580k for Opus (recalibrated for 1M context).
2. **Advisory.** When `.context-usage` shows `should_cycle=true`, `context-warning-hook.sh` (Stop) injects a one-line advisory at the end of the assistant turn. Nothing is blocked, nothing is auto-restarted.
3. **You pick the next step.** Either run `/aiagentminder:handoff` (captures resume state into Claude Code's native Auto Memory) and `/exit`, then say "resume work" in the next session — or keep going. The warning re-fires every turn while over threshold.

v5.0 attempted to enforce this autonomously (tool blocking, `.sprint-continuation.md` writing, self-termination). v5.1 retired that — see DECISIONS.md and CHANGELOG.md for the rationale. For dedicated unattended sprint runs, `sprint-runner.sh`/`.ps1` will restart Claude on `/exit` so a hands-off loop is still possible.

---

## Development Lifecycle

| Step | Mechanism | What happens |
|------|-----------|-------------|
| **Plan** | `/aiagentminder:brief` | Interview-driven product brief with MVP features and phases |
| **Revise** | `/aiagentminder:revise` | Update plan when requirements change — decision logging and sprint impact |
| **Decompose** | Sprint planning | Break features into 4–7 issues with acceptance criteria and risk tags |
| **Spec** | Spec phase | Implementation spec per item — approach, TDD plan, post-merge validation |
| **Execute** | Autonomous | TDD, full test suite, quality gate, self-review for every item — no permission prompts |
| **Gate** | Quality pipeline | Quality checklist, specialist review, PR creation and autonomous merge |
| **Validate** | Post-merge | Deployment-dependent tests. Failures create rework tasks within the sprint |
| **Checkpoint** | `/aiagentminder:handoff` | Session-end — decisions, priorities to auto-memory, commit |
| **Reflect** | `/aiagentminder:retrospective` | Sprint metrics, adaptive sizing, phase health assessment |

---

## Requirements

- **Claude Code 2.1.139+** — VS Code extension, CLI, or desktop app. Needed for plugin marketplace, agent worktree isolation, and `${CLAUDE_PLUGIN_ROOT}` hook variable substitution.
- **Bash** — Windows users need Git Bash or WSL. macOS/Linux: built-in.
- **jq** — for context monitoring (`winget install jqlang.jq` / `brew install jq` / `apt install jq`). Falls back to heuristics without it.
- **Git** — project state tracked in git.
- **GitHub CLI (`gh`)** — optional, for PR pipeline and issue sync.

Works on **Windows, macOS, and Linux**. Node.js is no longer required (v4.x npm CLI retired).

---

## When to Use This

**Use AIAgentMinder if** you're a solo developer who wants Claude Code to execute autonomously with quality enforcement. You want sprint execution, enforced TDD, and structured planning without constant steering.

**Use a plain CLAUDE.md if** your project fits in a few sessions and you don't need sprint governance, decision logging, or context management. AIAgentMinder adds structure — only use it if the structure pays for itself.

---

## Non-Goals

- **Not a ticket tracker.** Keeps a living plan in `docs/strategy-roadmap.md` and decomposes it into sprints on demand. Use `/aiagentminder:revise` to update. Layer GitHub Issues or Linear on top if you need persistent epics.
- **Not a multi-agent orchestrator.** Sprint-master coordinates specialist sub-agents sequentially, with each item executing in its own isolated git worktree. Does not coordinate concurrent agents on overlapping work.
- **Not a memory system replacement.** Complements Claude Code's native Session Memory, auto-memory, and `--continue`. Adds real-time context monitoring and autonomous cycling.

---

## Troubleshooting

Run `/plugin` and check the **Installed** tab — `aiagentminder` should appear without errors. Run `/reload-plugins` after upgrades.

| Symptom | Fix |
|---------|-----|
| Skills not showing (VS Code) | Run `/reload-plugins`, then close and reopen the Claude Code panel |
| Hooks not firing | Run `/plugin` → check Errors tab. Verify the plugin is enabled, not just installed |
| `/aiagentminder:setup` not found | Plugin not installed or not enabled. Run `/plugin install aiagentminder@lwalden-aiagentminder` |
| Claude re-debates a past decision | Add it to DECISIONS.md; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| Claude builds something out of scope | Run `/aiagentminder:scope-check`; `scope-guardian.md` also catches this passively |
| Claude asks you to do things manually | Verify `tool-first.md` exists in your project's `.claude/rules/` |
| Quality degrades late in session | Verify `jq` is installed |
| Context cycle doesn't restart | Sprint-runner wrapper (`sprint-runner.sh "<prompt>"`) gives an explicit restart loop |
| Upgrading | `/plugin marketplace update lwalden-aiagentminder` → `/reload-plugins` → `/aiagentminder:setup` to refresh `.claude/rules/` |

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — optional features, architecture fitness, context warnings
- [Product Brief Guide](docs/strategy-creation-guide.md) — using `/aiagentminder:brief` or writing the roadmap manually
- [Roadmap](docs/strategy-roadmap.md) — version history and backlog

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code. Independent open-source project, not affiliated with Anthropic.*

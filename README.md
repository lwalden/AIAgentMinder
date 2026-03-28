# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-3.2.0-blue)

An opinionated governance framework for Claude Code. Removes friction, empowering the AI where safe to do so, enforces engineering practices so it doesn't make (as many) mistakes, and fills gaps Claude Code can't handle natively.

> **What this is:** Slash commands, rules files, and scripts that add governance structure to Claude Code. No CLI, no MCP server, no database. Built for a solo developer who wants more code, written faster, with fewer errors.
>
> **Command prefix:** All AIAgentMinder commands use the `aam-` prefix (e.g., `/aam-brief`, `/aam-handoff`) to avoid collision with Claude Code built-in commands and other plugins.

---

## The Problem

Claude Code is fast. Without structure, that speed creates problems: scope drift, undocumented decisions, skipped quality steps, and context degradation in long sessions. You end up rubber-stamping trivial approvals, answering questions the AI could resolve itself, or catching defects that should have been prevented.

AIAgentMinder addresses three gaps:

- **Remove friction.** Autonomous sprint execution, in-session PR pipelines, context cycling across sessions, CLI-first rules — so you spend time deciding and evaluating, not typing approvals or taking manual actions the AI could handle.
- **Enforce quality.** Mandatory TDD, quality gates, self-review, and scope checks that Claude cannot skip even when asked to go fast. Engineering practices that minimize defects and catch them early.
- **Fill native gaps.** Structured project planning, session handoff, real-time context monitoring, autonomous context cycling — things Claude Code doesn't provide through prompting alone.

---

## How It Works

**Core files** establish project context:

| File | Purpose | When Claude reads it |
| ------ | --------- | --------------------- |
| `CLAUDE.md` | Project identity, behavioral rules | Every session (auto) |
| `DECISIONS.md` | Architectural decisions, rationale, and known debt log | On-demand; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| `docs/strategy-roadmap.md` | Product brief — what you're building, phases, out-of-scope items | On-demand |
| `.claude/rules/*.md` | Development discipline rules — loaded natively by Claude Code | Every session (auto) |
| `SPRINT.md` | Active sprint header, issues, and sprint sizing archive | Every session when sprint enabled (via `@SPRINT.md` import) |

**Always-active rules** (copied to every project):

| Rule | What it does |
|------|-------------|
| `git-workflow.md` | Branch naming, commit discipline, PR-only workflow |
| `scope-guardian.md` | Checks new work against the roadmap before implementing |
| `approach-first.md` | Claude states its intended approach before executing multi-file or architecture changes |
| `debug-checkpoint.md` | Stops debugging spirals after 3 failed attempts at the same error |
| `tool-first.md` | Use CLI/API tools instead of asking the user to perform actions manually |

**Governance rules** (enabled by default at setup):

| Rule | What it does |
|------|-------------|
| `code-quality.md` | TDD cycle, build-before-commit, small focused functions, read-before-write |
| `sprint-workflow.md` | State machine sprint execution with mandatory quality checklist, spec phase, autonomous execution, post-merge validation, and rework cycle |
| `correction-capture.md` | Self-monitors for repeated wrong-first-approach patterns and proposes permanent rules |
| `architecture-fitness.md` | Project-specific structural constraints — customize layer boundaries, external API rules, etc. |

**Meta-commands** run from the AIAgentMinder repo to manage target projects:

| Command | When to use |
|---------|------------|
| `/aam-setup` | Install AIAgentMinder into a target project — copies commands, rules, and scripts |
| `/aam-update` | Upgrade an existing installation — handles migration from previous versions |

**Project commands** are installed to your repo by `/aam-setup` and run from your project directory:

| Command | When to use |
|---------|------------|
| `/aam-brief` | Start of a project — Claude interviews you and generates a product brief with MVP features and tech stack |
| `/aam-checkup` | After `/aam-update` or when something seems broken — validates installation health (files, settings, version, jq) |
| `/aam-scope-check` | Before building something — Claude compares the proposed work against your roadmap and returns a clear verdict |
| `/aam-revise` | Mid-stream plan revision — add, change, drop, or reprioritize features directly in the roadmap with decision logging and sprint impact checks |
| `/aam-handoff` | End of a session — writes priorities to auto-memory, updates DECISIONS.md, commits |
| `/aam-quality-gate` | Pre-PR — full quality checklist (build, tests, coverage, lint, security) run every time |
| `/aam-self-review` | Pre-PR — specialist subagents review the diff for security, performance, and API design. Runs for every item |
| `/aam-pr-pipeline` | After PR creation — autonomous review-fix-test-merge pipeline. Escalates to human only on blockers |
| `/aam-milestone` | Sprint boundaries — health assessment across phase progress, timeline, scope drift, dependency health, complexity budget, and known debt |
| `/aam-retrospective` | Sprint completion — metrics, adaptive sizing guidance, lessons |
| `/aam-tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor. Full methodology behind `code-quality.md`'s one-liner |
| `/aam-triage` | Structured bug triage — reproduce, diagnose root cause, design durable fix plan, create GitHub issue |
| `/aam-grill` | Plan interrogation — walk every branch of the decision tree before implementation. Intensive counterpart to `approach-first.md` |
| `/aam-sync-issues` | Optional — push current sprint issues to GitHub Issues using `gh` CLI |

> **Skills vs commands:** These project commands are also available as skills via the plugin marketplace (`/plugin marketplace add lwalden/AIAgentMinder`). Skills and commands are the same functionality in different distribution formats — skills are the plugin-packaged versions in `skills/`, commands are the `.claude/commands/*.md` files copied by `/aam-setup`.

**Context degradation detection and mitigation** handles the reality that Claude's output quality drops as context fills up:

- **Real-time monitoring:** A status line script (`context-monitor.sh`) receives context window metrics after every assistant message and writes `.context-usage` to the project root. Model-specific token thresholds trigger cycling: 250k for Sonnet, 350k for Opus, 35% for unknown models. Falls back to heuristics (3+ items completed, heavy debugging, rework) if the status line isn't configured.
- **Autonomous context cycling:** When the threshold is hit, Claude commits all work, writes a continuation file with the resume point and critical context, self-terminates, and a fresh session starts automatically. Zero human intervention required (after one-time setup of a profile hook or sprint-runner wrapper).
- **Setup:** Run `.claude/scripts/install-profile-hook.ps1` (Windows) or `.claude/scripts/install-profile-hook.sh` (macOS/Linux) once. Alternatively, start sprint sessions via `.claude/scripts/sprint-runner.ps1` or `sprint-runner.sh`.

See [Customization Guide — Context Cycling](docs/customization-guide.md#context-cycling-sprint-sessions) and [How It Works — Context Cycling](docs/how-it-works.md#context-cycling) for full details.

**Native Claude Code features do the rest.** Session Memory preserves context within a session. Auto-memory (MEMORY.md) persists priorities across sessions. `claude --continue` restores full message history. AIAgentMinder complements these; it doesn't duplicate them.

---

## Quick Start

### 1. Install

**Via plugin marketplace:**

```
/plugin marketplace add lwalden/AIAgentMinder
```

**Manual:**

```bash
git clone https://github.com/lwalden/AIAgentMinder.git
cd AIAgentMinder
```

### 2. Run `/aam-setup`

Open Claude Code in the cloned directory and run `/aam-setup`. It asks about your project in grouped rounds, then copies the right files to your target location.

### 3. Run `/aam-checkup`

After setup, run `/aam-checkup` in your project directory to verify the installation is healthy before you start.

### 4. Run `/aam-brief`

Run `/aam-brief` to create your product brief and strategy roadmap. Claude interviews you about your project and generates `docs/strategy-roadmap.md` with MVP features and phase plan.

For an **existing project**, choose **Starting Point E** — Claude audits your codebase and generates filled-in state files from what it finds.

After the roadmap, `/aam-brief` installs all governance features (code quality, sprint planning, architecture fitness) by default.

### 5. Build

```
Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."
```

Or, with sprint planning enabled: "Start a sprint for Phase 1."

End each session with `/aam-handoff` to record priorities and decisions.

### Resuming work

Use `claude --continue` to restore the previous session's full message history, or start fresh — Session Memory provides automatic context. Just say:

- "Resume" or "Continue where we left off"
- "Start on the next sprint issue"
- "What's the current sprint status?"

---

## What a Session Looks Like

**Session 1 — Planning:**
Run `/aam-brief`. Claude asks about your project in grouped rounds. You describe a recipe sharing API.
Claude generates `docs/strategy-roadmap.md` and installs all governance features. Run `/aam-handoff`. Priorities are written to auto-memory.

**Session 2 — Sprint planning + building:**
Open Claude Code. Session Memory knows the project state.
Say "Start a sprint for Phase 1." Claude proposes 5 issues with acceptance criteria — one flagged `[risk]` because it touches auth. You review and approve.
Claude writes detailed specs for each item: implementation approach, TDD test plan, integration tests, post-merge validation tasks. You review the specs, add a custom instruction to S1-003 about the auth library to use, and approve.
Claude begins autonomous execution: creates branch for S1-001, writes failing tests, implements, runs full test suite, quality gate, self-review, creates PR, runs the PR pipeline, merges — then moves straight to S1-002 without asking permission.

**Between sprints — revising the plan:**
You research a competing API and realize you need WebSocket support but can drop RSS feeds. Run `/aam-revise` — describe the changes, and Claude updates the roadmap directly: adds WebSocket to Phase 2, moves RSS to Out of Scope, logs both decisions. The next sprint proposal reflects the updated plan.

**Session 3 — Continuing:**
Open a fresh Claude Code tab. SPRINT.md is loaded automatically.
Say "Resume." Claude identifies it's on S1-004 in the EXECUTE state, picks up from there.

**Sprint completion:**
All items done, all post-merge validations pass. Claude runs `/aam-retrospective` — 5 planned, 5 completed, 0 rework, 0 blocked, 1 decision logged. Adaptive sizing: "First sprint — recommend 4–5 issues next sprint. No stress indicators."
You review and approve, sprint is archived with sizing metadata. Start Sprint 2.

**Phase boundary:**
Run `/aam-milestone`. Health report: 6/6 MVP features complete, timeline on track, 3 known debt items (oldest 1 sprint), largest file 180 lines (healthy for Phase 1). Recommendations: none — clean bill of health.

---

## Development Lifecycle

AIAgentMinder provides a governance flow from planning through sprint execution. Each step builds on the previous one.

### The flow

| Step | Command / Mechanism | What happens |
| ---- | ------------------- | ------------ |
| **1. Plan** | `/aam-brief` | Interview-driven product brief. Defines MVP features, phases, and surfaces hard-to-reverse decisions early. All governance features enabled by default. |
| **2. Revise** | `/aam-revise` | Update the plan when requirements change — add, drop, or reprioritize features with decision logging and roadmap history. |
| **3. Decompose** | Sprint planning (`sprint-workflow.md`) | Break phase features into 4–7 sprint issues with acceptance criteria, risk tags, and dependencies. Human approves the issue list. |
| **4. Spec** | Spec phase (`sprint-workflow.md`) | Detailed implementation spec per item: approach, test plan, integration tests, post-merge validation, file list. Human approves specs before coding begins. |
| **5. Execute** | Autonomous execution | Items execute in sequence without permission prompts. TDD, full test suite, quality gate, and self-review run for every item — mandatory, never skipped. |
| **6. Gate** | `/aam-quality-gate` + `/aam-self-review` + `/aam-pr-pipeline` | Full quality checklist, specialist code review, and autonomous PR merge. Escalates to human only on blockers. |
| **7. Validate** | Post-merge validation | Tests requiring deployment or external services run after merge. Failures create rework tasks within the sprint. |
| **8. Checkpoint** | `/aam-handoff` | Session-end discipline. Captures decisions, writes next-session priorities to auto-memory, commits checkpoint. |
| **9. Reflect** | `/aam-retrospective` + `/aam-milestone` | Sprint metrics including rework count and post-merge failures, adaptive sizing guidance, and phase-level health assessment. |

### Sprint completion = full completion

AAM sprints don't carry over incomplete work. Every issue in a sprint is accepted as done — including post-merge validation — before the sprint closes. Failed post-merge tests create rework tasks within the same sprint. The sprint isn't done until all items pass quality gates, review, merge, and validation.

The spec phase replaces the need for separate feature-level design documents. Each item gets a detailed implementation spec (approach, test plan, post-merge validation) that is reviewed before coding begins. The combination of item specs, `DECISIONS.md` for architectural choices, and `/aam-revise` for plan changes gives you full traceability without an extra artifact layer.

---

## What Lives Where

AIAgentMinder has two sides: the **source repo** (where you cloned AIAgentMinder) and the **target project** (where you build things). `/aam-setup` and `/aam-update` are the only commands that run from the source repo — everything else runs from your project.

**Installed to your project by `/aam-setup`:**

```
your-project/
├── CLAUDE.md                  # ~50 lines — project identity, behavioral rules
├── DECISIONS.md               # Architectural decisions + Known Debt table
├── SPRINT.md                  # Sprint header (optional, sprint planning only)
├── .pr-pipeline.json          # PR pipeline config (high-risk patterns, cycle limit, merge method)
├── docs/
│   └── strategy-roadmap.md    # Product brief (generated by /aam-brief)
├── .gitignore                 # Core + stack-specific entries
└── .claude/
    ├── settings.json          # Status line configuration
    ├── commands/
    │   ├── aam-brief.md           # /aam-brief — planning interview
    │   ├── aam-checkup.md         # /aam-checkup — installation health check
    │   ├── aam-revise.md          # /aam-revise — mid-stream plan revision
    │   ├── aam-handoff.md         # /aam-handoff — session-end checkpoint
    │   ├── aam-quality-gate.md    # /aam-quality-gate — pre-PR quality checks
    │   ├── aam-scope-check.md     # /aam-scope-check — active scope governance
    │   ├── aam-self-review.md     # /aam-self-review — specialist review subagents
    │   ├── aam-pr-pipeline.md     # /aam-pr-pipeline — autonomous PR merge pipeline
    │   ├── aam-tdd.md             # /aam-tdd — guided TDD workflow
    │   ├── aam-triage.md          # /aam-triage — structured bug triage
    │   ├── aam-grill.md           # /aam-grill — plan interrogation
    │   ├── aam-milestone.md       # /aam-milestone — project health assessment
    │   ├── aam-retrospective.md   # /aam-retrospective — sprint retrospective
    │   └── aam-sync-issues.md     # /aam-sync-issues — GitHub Issues sync (optional)
    ├── rules/
    │   ├── git-workflow.md        # Always active
    │   ├── scope-guardian.md      # Always active
    │   ├── approach-first.md      # Always active
    │   ├── debug-checkpoint.md    # Always active
    │   ├── tool-first.md          # Always active
    │   ├── code-quality.md        # Default on
    │   ├── correction-capture.md  # Default on
    │   ├── sprint-workflow.md     # Default on — state machine with mandatory quality
    │   └── architecture-fitness.md  # Default on, project-customized
    └── scripts/
        ├── context-monitor.sh         # Status line data bridge — writes .context-usage with token thresholds
        ├── context-cycle.sh           # Self-termination for context cycling (cross-platform)
        ├── sprint-runner.ps1          # Wrapper — auto-restarts Claude on context cycle (Windows)
        ├── sprint-runner.sh           # Wrapper — auto-restarts Claude on context cycle (macOS/Linux)
        ├── install-profile-hook.ps1   # One-time setup: PowerShell prompt hook (Windows)
        └── install-profile-hook.sh    # One-time setup: bash/zsh prompt hook (macOS/Linux)
```

**Stays in the AIAgentMinder repo** (not copied to your project):

- `/aam-setup` and `/aam-update` — meta-commands for installing and upgrading target projects
- `skills/` — plugin marketplace packaging of the project commands
- `project/` — the source templates that `/aam-setup` copies from

---

## Requirements

- **Claude Code** — VS Code extension or CLI. This is a Claude Code framework; it requires Claude Code to function.
- **jq** — required for the context monitoring status line script (`winget install jqlang.jq` / `brew install jq` / `apt install jq`). Sprint workflow falls back to heuristics without it.
- **Git** — project state is tracked in git
- **GitHub CLI (`gh`)** — optional, used by sprint workflow for PR creation

Works on **Windows, macOS, and Linux**. No Node.js dependency — pure Markdown + shell scripts.

---

## When to Use This vs. Alternatives

**Use AIAgentMinder if** you're a solo developer who wants the AI to stop asking repetivite low impact questions that disprupt the workflow , while maintaining high quality. You want autonomous sprint execution, enforced engineering practices, and structured planning — without having to steer constantly.

**Use Conductor or CCPM if** you need full project management with GitHub Issues integration, Linear sync, and parallel multi-agent execution across branches. These target teams, not solo devs.

**Use a plain CLAUDE.md if** your project fits comfortably in a few sessions and you don't need structured planning, sprint governance, or decision logging. AIAgentMinder adds overhead — only add it if the structure pays for itself.

---

## Non-Goals

- **Not a ticket tracker.** AIAgentMinder keeps a living plan (`docs/strategy-roadmap.md`) and decomposes it into sprints on demand. Use `/aam-revise` to update the plan mid-stream. If you need persistent epics or a kanban board, layer GitHub Issues or Linear on top.
- **Not a multi-agent orchestrator.** Claude may sometimes run its own subagents but AIAgentMinder does not govern that behaviour and doesn't coordinate parallel Claude Code instances.
- **Not a CLI tool.** There's nothing to install or run. Everything is markdown files and slash commands in your repo.
- **Not a memory system replacement.** Claude Code's native Session Memory, auto-memory, and `--continue` are leveraged. AIAgentMinder adds real-time context monitoring to detect degradation before it impacts quality, and autonomous session cycling to recover cleanly.

---

## Troubleshooting

**Start with `/aam-checkup`.** Run it in your project directory — it validates that all required files are present, status line is configured, jq is available, and CLAUDE.md placeholders are filled in.

| Symptom | Fix |
| --------- | ----- |
| Commands not showing (VS Code) | Close and reopen the Claude Code panel |
| Hooks not firing | Run `/aam-checkup` — it will tell you exactly what's wrong |
| Claude re-debates a past decision | Add it to DECISIONS.md with rationale; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| Claude starts building something out of scope | Run `/aam-scope-check` before starting work; the passive `scope-guardian.md` rule also catches this during execution |
| Claude asks you to look up values or do things in a UI | The `tool-first.md` rule should prevent this — verify it's installed with `/aam-checkup`. If Claude still asks, remind it: "Use the CLI" |
| Sprint quality degrades late in session | Verify `jq` is installed and the status line is configured in `.claude/settings.json`. Run `.claude/scripts/install-profile-hook.ps1` (Windows) or `.claude/scripts/install-profile-hook.sh` (macOS/Linux) to enable automatic context cycling |
| Context cycle doesn't auto-restart | Verify the profile hook is installed (check `$PROFILE` for the AIAgentMinder block) or that you started via sprint-runner.ps1. Fallback: run the command Claude printed before exiting |
| Upgrading an existing project | Run `/aam-update` from the AIAgentMinder repo — it handles all migrations, overwrites framework files, surgically merges CLAUDE.md, and runs `/aam-checkup` at the end |

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — optional features, architecture fitness rules, context cycling
- [Product Brief Creation Guide](docs/strategy-creation-guide.md) — using `/aam-brief` or writing `strategy-roadmap.md` manually
- [Roadmap](ROADMAP.md) — version history and backlog

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension and CLI). Independent open-source project, not affiliated with Anthropic.*

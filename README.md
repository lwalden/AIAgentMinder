# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.4.1-blue)

Project governance for AI-assisted development. Structured planning, sprint workflows, decision tracking, and scope enforcement — built as plain markdown files and slash commands on top of Claude Code.

> **What this is:** Slash commands, rules files, and a lifecycle hook that add governance structure to Claude Code. No CLI, no MCP server, no database. Everything lives in your repo as markdown.
>
> **Command prefix:** All AIAgentMinder commands use the `aam-` prefix (e.g., `/aam-brief`, `/aam-handoff`) to avoid collision with Claude Code built-in commands and other plugins.

---

## The Problem

Claude Code's native memory system (Session Memory, auto-memory, `claude --continue`) handles session continuity well. What it doesn't provide:

- **Structured project planning.** No interview-driven product brief, quality tier selection, or MVP decomposition.
- **Sprint governance.** No structured issue decomposition with human approval gates before implementation starts.
- **Scope enforcement.** Nothing that checks whether new work belongs in the current phase before Claude starts writing code.
- **Architectural decision logging.** No convention for recording what was decided and why — so Claude re-debates the same decisions in future sessions.
- **Ongoing complexity tracking.** Nothing that monitors file count, coupling, and dependency growth over weeks of development.
- **Session-end discipline.** No structured checkpoint to capture priorities and decisions before closing.

Spec-driven development tools have emerged as strong options for *feature-level* planning — requirements to design to tasks to implementation. AIAgentMinder doesn't compete with those. It answers a different question: how do you govern a multi-phase project across weeks of AI-assisted development, with scope drift, complexity growth, and architectural decisions accumulating the whole time?

---

## How It Works

**Core files** establish project context:

| File | Purpose | When Claude reads it |
| ------ | --------- | --------------------- |
| `CLAUDE.md` | Project identity, behavioral rules, quality tier | Every session (auto) |
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

**Optional rules** (enabled at setup or on request):

| Rule | What it does |
|------|-------------|
| `code-quality.md` | TDD cycle, build-before-commit, small focused functions, read-before-write |
| `sprint-workflow.md` | Sprint planning, approval gates, risk tagging, review/archive cycle |
| `architecture-fitness.md` | Project-specific structural constraints — customize layer boundaries, external API rules, etc. |

**Commands** structure your workflow:

| Command | When to use |
|---------|------------|
| `/aam-brief` | Start of a project — Claude interviews you and generates a product brief with MVP features, tech stack, and quality tier |
| `/aam-checkup` | After `/aam-update` or when something seems broken — validates installation health (files, hooks, version, Node.js) |
| `/aam-scope-check` | Before building something — Claude compares the proposed work against your roadmap and returns a clear verdict |
| `/aam-revise` | Mid-stream plan revision — add, change, drop, or reprioritize features directly in the roadmap with decision logging and sprint impact checks |
| `/aam-handoff` | End of a session — writes priorities to auto-memory, updates DECISIONS.md, commits |
| `/aam-quality-gate` | Pre-PR — tiered checks matching your project's quality tier (Lightweight / Standard / Rigorous / Comprehensive) |
| `/aam-self-review` | Pre-PR (Rigorous/Comprehensive, and any risk-flagged issue) — specialist subagents review the diff for security, performance, and API design |
| `/aam-milestone` | Sprint boundaries — health assessment across phase progress, timeline, scope drift, dependency health, complexity budget, and known debt |
| `/aam-retrospective` | Sprint completion — metrics, adaptive sizing guidance, lessons |
| `/aam-tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor. Full methodology behind `code-quality.md`'s one-liner |
| `/aam-triage` | Structured bug triage — reproduce, diagnose root cause, design durable fix plan, create GitHub issue |
| `/aam-grill` | Plan interrogation — walk every branch of the decision tree before implementation. Intensive counterpart to `approach-first.md` |
| `/aam-sync-issues` | Optional — push current sprint issues to GitHub Issues using `gh` CLI (team projects) |
| `/aam-update` | Upgrade an existing installation — handles migration from previous versions |

**One hook** runs automatically:

| What | When |
| ------ | ------ |
| Sprint reorientation | After context compaction — outputs active sprint summary so Claude doesn't lose its place |

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

Run `/aam-brief` to create your product brief and strategy roadmap. Claude interviews you about your project and generates `docs/strategy-roadmap.md` with MVP features, phase plan, and quality tier.

For an **existing project**, choose **Starting Point E** — Claude audits your codebase and generates filled-in state files from what it finds.

After the roadmap, `/aam-brief` asks whether to enable optional features: code quality guidance, sprint planning, and architecture fitness rules. Recommended for Standard+ projects.

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
Run `/aam-brief`. Claude asks about your project in grouped rounds. You describe a recipe sharing API, select Standard quality tier, enable sprint planning.
Claude generates `docs/strategy-roadmap.md`. Run `/aam-handoff`. Priorities are written to auto-memory.

**Session 2 — Sprint planning + building:**
Open Claude Code. Session Memory knows the project state.
Say "Start a sprint for Phase 1." Claude proposes 5 issues with acceptance criteria — one flagged `[risk]` because it touches auth. You review and approve.
Claude creates a branch, implements S1-001 (scaffold Express app), passes `/aam-quality-gate`, opens a PR.
Once the PR is merged (by you, CI, or automation), Claude moves to S1-002 (user registration endpoint).

**Between sprints — revising the plan:**
You research a competing API and realize you need WebSocket support but can drop RSS feeds. Run `/aam-revise` — describe the changes, and Claude updates the roadmap directly: adds WebSocket to Phase 2, moves RSS to Out of Scope, logs both decisions. The next sprint proposal reflects the updated plan.

**Session 3 — Continuing:**
Open a fresh Claude Code tab. SPRINT.md is loaded automatically.
Say "Resume." Claude picks up where it left off — runs `/aam-self-review` on the risk-flagged auth issue before creating the PR.

**Sprint completion:**
All issues done. Claude runs `/aam-retrospective` — 5 planned, 5 completed, 0 scope changes, 0 blocked, 1 decision logged. Adaptive sizing: "First sprint — recommend 4–5 issues next sprint. No stress indicators."
Sprint is archived with sizing metadata. Start Sprint 2.

**Phase boundary:**
Run `/aam-milestone`. Health report: 6/6 MVP features complete, timeline on track, 3 known debt items (oldest 1 sprint), largest file 180 lines (healthy for Phase 1). Recommendations: none — clean bill of health.

---

## Development Lifecycle

AIAgentMinder provides a complete governance flow from initial planning through sprint execution. Each step builds on the previous one — no external feature-spec tools required.

### Why structured governance matters

AI-assisted development moves fast. Without governance structure, projects accumulate scope drift, undocumented decisions, and growing complexity that erodes quality over time. The lifecycle below creates natural checkpoints where you review, approve, and course-correct — so speed doesn't come at the cost of control.

### The flow

| Step | Command / Mechanism | What happens |
| ---- | ------------------- | ------------ |
| **1. Plan** | `/aam-brief` | Interview-driven product brief. Defines MVP features, phases, quality tier, and surfaces hard-to-reverse decisions early. |
| **2. Revise** | `/aam-revise` | Update the plan when requirements change — add, drop, or reprioritize features with decision logging and roadmap history. |
| **3. Decompose** | Sprint planning (`sprint-workflow.md`) | Break phase features into 4–7 sprint issues with acceptance criteria, risk tags, and dependencies. Human approves before work starts. |
| **4. Execute** | Native Tasks + feature branches | One issue at a time. Each issue tracked as a persistent Task, implemented on its own branch, committed with issue ID reference. |
| **5. Gate** | `/aam-quality-gate` + `/aam-self-review` | Pre-PR checks matching your quality tier. Specialist subagent review for Rigorous/Comprehensive tiers and risk-flagged issues. |
| **6. Checkpoint** | `/aam-handoff` | Session-end discipline. Captures decisions, writes next-session priorities to auto-memory, commits checkpoint. |
| **7. Reflect** | `/aam-retrospective` + `/aam-milestone` | Sprint metrics, adaptive sizing guidance, and phase-level health assessment at boundaries. |

### Sprint completion = full completion

AAM sprints don't carry over incomplete work. Every issue in a sprint is accepted as done before the sprint closes. Feature decomposition happens naturally during sprint planning — you size issues to fit, and the sprint isn't done until they all pass quality gates and review.

This eliminates the need for separate feature-level design documents that persist across sprints. The combination of sprint issue acceptance criteria, `DECISIONS.md` for architectural choices, and `/aam-revise` for plan changes gives you full traceability without an extra artifact layer.

### When to add feature-level spec tools

For most projects, the lifecycle above is sufficient. Consider adding a spec-driven development tool alongside AIAgentMinder only if you're designing complex API surfaces where getting the contract wrong before implementation starts would mean significant rework. Even then, it's an optional complement — not a prerequisite.

---

## What Gets Copied to Your Project

```
your-project/
├── CLAUDE.md                  # ~50 lines — project identity, behavioral rules
├── DECISIONS.md               # Architectural decisions + Known Debt table
├── SPRINT.md                  # Sprint header (optional, sprint planning only)
├── docs/
│   └── strategy-roadmap.md    # Product brief (generated by /aam-brief)
├── .gitignore                 # Core + stack-specific entries
└── .claude/
    ├── settings.json          # Hook configuration
    ├── commands/
    │   ├── aam-brief.md           # /aam-brief — planning interview
    │   ├── aam-checkup.md         # /aam-checkup — installation health check
    │   ├── aam-revise.md          # /aam-revise — mid-stream plan revision
    │   ├── aam-handoff.md         # /aam-handoff — session-end checkpoint
    │   ├── aam-quality-gate.md    # /aam-quality-gate — tiered pre-PR checks
    │   ├── aam-scope-check.md     # /aam-scope-check — active scope governance
    │   ├── aam-self-review.md     # /aam-self-review — specialist review subagents
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
    │   ├── code-quality.md        # Optional
    │   ├── sprint-workflow.md     # Optional
    │   └── architecture-fitness.md  # Optional, project-customized
    └── hooks/
        └── compact-reorient.js    # Sprint summary after context compaction
```

`/aam-setup` and `/aam-update` are **meta-commands** — they run from the AIAgentMinder repo to install or upgrade a target project. They are not copied into your project.

---

## Requirements

- **Claude Code** — VS Code extension or CLI. This is a Claude Code framework; it requires Claude Code to function.
- **Node.js** — required for the governance hook (`compact-reorient.js`)
- **Git** — project state is tracked in git
- **GitHub CLI (`gh`)** — optional, used by sprint workflow for PR creation

Works on **Windows, macOS, and Linux**. The hook is a Node.js script with no shell dependencies.

---

## When to Use This vs. Alternatives

**Use AIAgentMinder if** you're a solo developer or small team who wants structured planning, scope enforcement, decision logging, and optional sprint governance without heavy infrastructure.

**Spec-driven development tools are optional complements.** AIAgentMinder's lifecycle — brief → revise → sprint decompose → execute → gate — handles most projects without additional feature-level planning. If you're designing complex API surfaces where the contract must be right before implementation starts, tools like cc-ssd can layer on top. They're complementary, not required.

**Use Conductor or CCPM if** you need full project management with GitHub Issues integration, Linear sync, and parallel multi-agent execution across branches. These target teams, not solo devs.

**Use a plain CLAUDE.md if** your project fits comfortably in a few sessions and you don't need structured planning, sprint governance, or decision logging. AIAgentMinder adds overhead — only add it if the structure pays for itself.

---

## Non-Goals

- **Not a ticket tracker.** AIAgentMinder keeps a living plan (`docs/strategy-roadmap.md`) and decomposes it into sprints on demand. Use `/aam-revise` to update the plan mid-stream. If you need 50 open issues, persistent epics, or a kanban board, layer GitHub Issues or Linear on top.
- **Not a multi-agent orchestrator.** AIAgentMinder governs a single-agent session. It doesn't coordinate parallel Claude Code instances. Tools like CCPM and claude-flow handle that.
- **Not a CLI tool.** There's nothing to install or run. Everything is markdown files and slash commands in your repo.
- **Not a memory system.** Claude Code's native Session Memory, auto-memory, and `--continue` handle session continuity. AIAgentMinder adds governance structure on top, not a parallel memory layer.

---

## Troubleshooting

**Start with `/aam-checkup`.** Run it in your project directory — it validates that all required files are present, hooks are configured, Node.js is available, and CLAUDE.md placeholders are filled in.

| Symptom | Fix |
| --------- | ----- |
| Commands not showing (VS Code) | Close and reopen the Claude Code panel |
| Hooks not firing | Run `/aam-checkup` — it will tell you exactly what's wrong |
| Claude re-debates a past decision | Add it to DECISIONS.md with rationale; add `@DECISIONS.md` to CLAUDE.md to auto-load |
| Claude starts building something out of scope | Run `/aam-scope-check` before starting work; the passive `scope-guardian.md` rule also catches this during execution |
| Claude asks you to look up values or do things in a UI | The `tool-first.md` rule should prevent this — verify it's installed with `/aam-checkup`. If Claude still asks, remind it: "Use the CLI" |
| Sprint context lost after compaction | The `compact-reorient.js` hook fires automatically and outputs the active sprint summary — verify Node.js is installed |
| Upgrading an existing project | Run `/aam-update` from the AIAgentMinder repo — it handles all migrations, overwrites framework files, surgically merges CLAUDE.md, and runs `/aam-checkup` at the end |

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — optional features, architecture fitness rules, quality tiers
- [Product Brief Creation Guide](docs/strategy-creation-guide.md) — using `/aam-brief` or writing `strategy-roadmap.md` manually
- [Roadmap](ROADMAP.md) — post-v1.0 direction and backlog

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code (VS Code extension and CLI). Independent open-source project, not affiliated with Anthropic.*

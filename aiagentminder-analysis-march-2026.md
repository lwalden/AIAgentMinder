# AIAgentMinder: Slash Command Overlap Analysis & Enhancement Vision

**Date:** March 2026  
**Context:** Post-v0.7.0 migration analysis, accounting for Claude Code features shipped through February 2026

---

## Part 1: New Overlap with Claude Code Built-in Commands

Your existing migration analysis (the v0.7.0 document) covered memory, rules, and session continuity well. But several Claude Code features shipped in late 2025 through early 2026 create **new collisions** that weren't addressed:

### 1. `/plan` Name Collision — Critical

Claude Code shipped a native `/plan` command (v2.1.0+, January 2026) that toggles **Plan Mode** — a read-only permission mode where Claude analyzes the codebase without making changes. Users activate it via `/plan`, `Shift+Tab` twice, or `--permission-mode plan`.

AIAgentMinder's `/plan` is a completely different thing — a structured product planning interview that generates `strategy-roadmap.md`.

**The problem:** Same name, different functions. Users who've used Claude Code's native `/plan` will expect read-only exploration mode. Users who've used AIAgentMinder's `/plan` will expect a planning interview. If both are installed, the custom command takes precedence over the built-in — meaning AIAgentMinder silently breaks Plan Mode access via the slash command.

**Recommendation:** Rename to `/brief` or `/roadmap`. This is urgent — the name collision actively interferes with a core Claude Code feature. `/brief` aligns with what the command actually produces (a product brief) and avoids confusion with the now well-known Plan Mode.

### 2. Native Tasks System vs SPRINT.md — Significant

Claude Code replaced Todos with **Tasks** in v2.1.16 (January 22, 2026). Tasks are a substantial upgrade:

- **Persistent to disk** at `~/.claude/tasks/` — survive session restarts, compaction, and crashes
- **Dependency DAGs** — tasks can block other tasks, preventing out-of-order execution
- **Cross-session** via `CLAUDE_TASK_LIST_ID` environment variable — set this and tasks persist across sessions for the same project
- **Native UI** — `Ctrl+T` toggles task visibility in the terminal
- **Tool integration** — `TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList` tools that Claude uses natively
- **Subagent coordination** — tasks are visible to spawned subagents

SPRINT.md tracks issues as markdown with status fields (`todo`, `in-progress`, `done`, `blocked`). The native Tasks system does all of this with better integration, persistence, and tooling.

**What SPRINT.md still offers that Tasks don't:** Sprint *structure* — the concept of a bounded sprint with a goal, a defined scope approved by the human, and a formal review/archive cycle. Tasks are a flat (or DAG) list; they don't have sprint boundaries, approval gates, or archive semantics.

**Recommendation:** The sprint *workflow* (propose → approve → execute → review → archive) is the value, not the tracking file. Rewrite sprint-workflow to use native Tasks as the execution layer while keeping the sprint governance wrapper. The SPRINT.md file becomes a lightweight sprint header (goal, scope, sprint number) while individual issues become native Tasks with dependencies. This gives you the best of both: native persistence and UI for task tracking, plus sprint-level governance for scope control.

### 3. Native `/doctor` vs Planned `/doctor` — Backlog Collision

Claude Code ships a built-in `/doctor` command that checks Node.js version, API connectivity, authentication validity, and configuration consistency. AIAgentMinder's backlog includes a planned `/doctor` for checking AIAgentMinder installation health (files present, hooks configured, placeholders resolved).

**Recommendation:** Rename the AIAgentMinder diagnostic to `/checkup` or `/health`. The functions are complementary — native `/doctor` checks Claude Code health, AIAgentMinder's checks framework health — but the name collision would shadow the built-in.

### 4. Skills System & Plugin Marketplace — Distribution Opportunity

Claude Code unified commands and skills in 2026. `.claude/skills/` directories with `SKILL.md` files support frontmatter for auto-invocation, allowed-tools restrictions, model selection, and description-based discovery. The Plugin Marketplace (`/plugin marketplace add`) enables one-command installation.

AIAgentMinder currently distributes via git clone + manual `/setup`. This works but misses the ecosystem.

**Recommendation:** Package AIAgentMinder's unique value-add commands as a **Claude Code plugin**. The `/setup` flow would become `/plugin install aiagentminder`, and skills would be auto-discovered. This is a packaging change, not a feature change, but it dramatically lowers adoption friction. The existing `.claude/commands/` files keep working, so this is additive.

### 5. `plansDirectory` Setting — Minor Overlap

Claude Code's Plan Mode can persist plans to a configurable directory (`plansDirectory` in settings.json). This provides plan versioning and review — similar in spirit to AIAgentMinder's `docs/strategy-roadmap.md` approach but for tactical per-feature plans rather than product-level strategy.

**Recommendation:** No action needed. AIAgentMinder's product brief is a different artifact than Claude Code's implementation plans. But do mention in docs that users should configure `plansDirectory` alongside AIAgentMinder for complementary coverage — product-level strategy (AIAgentMinder) + feature-level plans (native Plan Mode).

### 6. `/init` vs `/setup` — Clarification Needed

Native `/init` analyzes existing code and generates a CLAUDE.md with build commands, test instructions, and conventions. AIAgentMinder's `/setup` copies a framework of governance files and customizes project identity.

These are different but users may confuse them. `/init` is code analysis; `/setup` is governance scaffolding.

**Recommendation:** In AIAgentMinder docs, explicitly position `/setup` as "run *after* `/init`" — let `/init` do the code analysis, then layer AIAgentMinder's governance on top. The `/setup` command could even detect an existing `/init`-generated CLAUDE.md and merge rather than replace.

---

## Part 2: Summary — What's Left That's Genuinely Unique

After accounting for all native features, here's what AIAgentMinder provides that Claude Code does not:

| AIAgentMinder Feature | Native Equivalent | Still Unique? |
|---|---|---|
| `/plan` structured interview | None — native `/plan` is a mode toggle, not a product planning workflow | **Yes** (rename to `/brief`) |
| Sprint governance (approve → execute → review → archive) | Tasks provide tracking; no sprint boundaries or approval gates | **Yes** — restructure to use Tasks as execution layer |
| `strategy-roadmap.md` product brief | `plansDirectory` stores tactical plans, not product strategy | **Yes** |
| DECISIONS.md as human-readable log | Auto-memory captures decisions but isn't human-browsable or git-tracked in project repo | **Partially** — value is as team artifact, not Claude's memory |
| Code quality guidance rules | `.claude/rules/` with glob scoping is more capable | **No** — migrate to rules |
| SessionStart context injection | Native memory layers handle this | **No** — remove |
| PROGRESS.md session tracking | Session Memory + Tasks | **No** — remove from Claude's workflow |
| `/handoff` session briefing | Session Memory + `--continue` | **No** — replace with lightweight priority note |
| Auto-commit on Stop | Better handled by git workflow rules | **No** — remove |
| `/setup` governance scaffolding | `/init` does code analysis only; no governance | **Yes** |

**Core surviving value:** Structured product planning, sprint-level governance with approval gates, and project scaffolding for governance files. Everything else should be eliminated or migrated to native features.

---

## Part 2: Enhancement Vision — Governance for Ambitious Projects

With session continuity delegated to native features, AIAgentMinder's future is as a **project governance and methodology layer** — the thing that helps solo developers and tiny teams ship projects that would normally require a PM, a tech lead, and a QA engineer. Claude is the workforce multiplier; AIAgentMinder is the guardrails that keep that force pointed in the right direction.

Here are enhancement categories and specific feature ideas, ordered by impact:

### A. Scope Governance — Preventing the #1 Solo Dev Failure Mode

Solo developers building ambitious projects fail most often from **scope creep** — not from bad code. Claude is excellent at building whatever you ask for, which makes it dangerously easy to add "just one more feature" until the project becomes unmaintainable. This is where AIAgentMinder can provide unique, high-value governance.

#### Feature: Scope Guardian Skill

A skill (or rule) that monitors whether current work aligns with the roadmap's defined scope. When Claude is about to create files or implement logic that maps to items in the "Out of Scope" section of `strategy-roadmap.md`, it raises a flag.

**How it works:**
- A `.claude/rules/scope-guardian.md` rule that's always active
- References `@docs/strategy-roadmap.md` for the source of truth
- Instructs Claude to check before implementing any new feature: "Is this in the MVP Features list? If not, is it in Out of Scope? If it's out of scope, pause and confirm with the human before proceeding."
- Lightweight — the rule itself is ~15 lines; the intelligence comes from Claude's reasoning

**Why this matters for ambitious projects:** A solo dev with Claude can build features 10x faster than they can maintain them. Scope governance is the brake pedal that keeps velocity sustainable.

#### Feature: Milestone Health Checks

A periodic checkpoint (triggered manually via a `/milestone` command or automatically at sprint boundaries) that reviews:

- Progress against the roadmap's phase timeline
- Whether the current codebase complexity is proportional to the project phase
- Whether any MVP features are still unstarted while non-MVP work has been done
- Dependencies that have grown beyond the original stack plan

This is the "project standup" that solo devs don't have because there's no team to stand up with.

### B. Decision Governance — Architecture Quality at Scale

Solo developers make dozens of architectural decisions without review. Claude will follow whatever direction you set, even if it's subtly wrong. AIAgentMinder can add forcing functions that improve decision quality.

#### Feature: Decision Forcing Function (enhanced /brief)

Upgrade the planning workflow to identify **decision points** during the interview — moments where the user needs to make a choice that will be hard to reverse later. Rather than just logging decisions after the fact, the planning interview should surface these proactively:

- "You've chosen PostgreSQL. This means your ingredient search will need full-text search or a GIN index. Want to decide the search approach now, or defer it?"
- "JWT auth means no server-side revocation. Given this is a public-facing API, are you comfortable with that tradeoff?"

Log each decision with explicit "alternatives considered" and "reversal cost" — making the consequences visible before they're locked in.

#### Feature: Architecture Fitness Rules

Glob-scoped rules (`.claude/rules/architecture-fitness.md`) that encode structural constraints Claude should enforce:

- "This project uses a layered architecture. Route handlers should never import database modules directly — always go through the service layer."
- "All external API calls must go through `src/services/external/` — no direct HTTP calls from route handlers."
- "Test files must not import from other test files — each test should be self-contained."

These are the kinds of rules a tech lead would enforce in code review. For a solo dev with Claude, they're the code review.

### C. Quality Governance — Automated Quality Gates

Claude Code's native capabilities don't include quality enforcement — Claude will happily ship code without tests if you don't ask. AIAgentMinder can provide tiered quality gates that match the project's declared quality tier.

#### Feature: Quality Gate Pre-PR Checks

A skill that runs before PR creation (could be a PreToolUse hook on the `gh pr create` command or a step in the sprint workflow):

- **Lightweight tier:** Confirm the code builds. That's it.
- **Standard tier:** Confirm tests exist for new functionality. Run the test suite. Check for console.log/debugger statements.
- **Rigorous tier:** Standard + check test coverage delta. Verify no new `any` types in TypeScript. Run the linter.
- **Comprehensive tier:** Rigorous + security scan. Check for hardcoded secrets. Verify error handling on all external calls.

The key insight: these aren't CI checks (which run after PR creation). These are *pre-submission* checks that catch issues before they enter the review cycle. For a solo dev, the review cycle is expensive because you're reviewing your own work — catching issues earlier is proportionally more valuable.

#### Feature: Self-Review Workflow

A skill that spawns a review subagent before PR creation. The subagent reads the diff with a specific review lens:

- Security reviewer: checks for injection, auth bypass, data exposure
- Performance reviewer: checks for N+1 queries, unbounded loops, missing indexes
- API design reviewer: checks for consistency with existing endpoints

This is the "second pair of eyes" that solo developers lack. The subagent approach keeps it context-efficient — each reviewer only loads the diff and relevant rules, not the entire project.

### D. Complexity Management — Keeping Ambitious Projects Maintainable

The hardest part of ambitious solo projects isn't building v1 — it's maintaining momentum through v2 and v3 without drowning in complexity. AIAgentMinder can provide ongoing complexity monitoring.

#### Feature: Complexity Budget

Track and report on project complexity metrics at sprint boundaries:

- File count and growth rate
- Dependency count and freshness
- Largest files (candidates for decomposition)
- Circular dependency detection
- Dead code identification

Present this as a "complexity health report" during sprint review. The goal isn't to block progress — it's to make complexity visible so the developer can make informed tradeoffs.

#### Feature: Technical Debt Tracker

A dedicated tracking mechanism (could be a DEBT.md file or entries in auto-memory) for acknowledged technical debt:

- When Claude implements a shortcut or workaround, log it with a "why" and a "fix when" trigger
- During sprint planning, surface outstanding debt items as candidates for inclusion
- At milestone checkpoints, assess whether debt is accumulating faster than it's being paid down

### E. Workflow Enhancements for the Sprint System

Given that the sprint system is AIAgentMinder's most distinctive feature, enhance it for solo/small team realities:

#### Feature: Sprint Retrospective with Metrics

After each sprint, generate a brief retrospective that captures:

- Planned vs actual: how many issues were completed vs planned
- Scope changes: were issues added or removed mid-sprint
- Blocked time: how long were issues blocked and on what
- Decision velocity: how many decisions were made and logged

This gives solo developers the feedback loop that teams get from retrospectives.

#### Feature: Adaptive Sprint Sizing

After 2-3 sprints, the system has enough data to suggest sprint sizes. "Your last 3 sprints completed 4, 5, and 4 issues respectively. Consider planning 4-5 issues for the next sprint." Simple but valuable for solo devs who tend to overcommit.

#### Feature: Risk-Flagged Issues

During sprint planning, flag issues that carry architectural risk — things like "this issue changes the database schema" or "this issue introduces a new external dependency." These get a mandatory decision record in DECISIONS.md and optionally a more thorough plan-before-execute workflow.

---

## Part 3: Recommended Roadmap

### Immediate (v0.8.0) — Eliminate Overlap

1. **Rename `/plan` to `/brief`** — resolve the name collision with native Plan Mode
2. **Rename planned `/doctor` to `/checkup`** — avoid shadowing native `/doctor`
3. **Migrate `.claude/guidance/` to `.claude/rules/`** with glob scoping
4. **Remove SessionStart injection hook** — replace with lightweight compact-matcher
5. **Remove PreCompact hook** — rely on native compaction + compact-matcher
6. **Remove Stop auto-commit hook** — replace with `.claude/rules/git-workflow.md`
7. **Slim CLAUDE.md** — remove session protocol, keep project identity + governance rules
8. **Restructure sprint tracking** — sprint governance wrapper over native Tasks

### Near-term (v0.8.1) — Governance Foundation

1. **Scope Guardian rule** — always-active rule that checks work against roadmap scope
2. **Quality Gate skill** — tiered pre-PR checks matching quality tier
3. **Architecture Fitness rules** — glob-scoped structural constraints
4. **Decision Forcing Function** — enhanced `/brief` that surfaces decision points proactively

### Medium-term (v0.9.0) — Ambitious Project Support

1. **Self-Review workflow** — subagent-based code review before PR
2. **Milestone Health Checks** — periodic project health assessment
3. **Sprint Retrospective** — automated metrics and feedback after sprint completion
4. **Plugin packaging** — distribute via Claude Code Plugin Marketplace

### Longer-term (v1.0.0) — Intelligence Layer

1. **Complexity Budget** — ongoing complexity monitoring and reporting
2. **Adaptive Sprint Sizing** — data-driven sprint planning recommendations
3. **Technical Debt Tracker** — structured debt management
4. **Risk-Flagged Issues** — architectural risk assessment during planning

---

## Core Thesis

**AIAgentMinder's future is not session memory — it's project governance.** Claude Code has solved the memory problem. What it hasn't solved is the *methodology* problem: how does a solo developer or tiny team run an ambitious project without the organizational structure (PMs, tech leads, QA, code review) that normally keeps large projects on track?

The answer is governance-as-code: rules, skills, and workflows that encode the discipline of a well-run engineering team into artifacts that Claude follows automatically. Scope control, quality gates, architecture fitness, decision forcing functions, and sprint methodology — these are the things that make the difference between a solo dev who ships a solid MVP and one who drowns in scope creep and technical debt.

The tagline shift: from "session continuity for Claude Code" to **"engineering governance for AI-assisted development."**

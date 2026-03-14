# Roadmap

This document tracks planned features and future direction. The backlog has full acceptance criteria.

---

## v1.0 — Governance Maturity

> Target: ship a clean, complete governance layer for solo devs and small teams. Every item below has been assessed against the Claude Code ecosystem as of March 2026.

### Must-Have (ship requirements)

#### Prune PROGRESS.md from scaffolding

Remove PROGRESS.md from `/setup`, `/update`, and the scaffolded file tree. Native Session Memory, `--continue`, and auto-memory handle session continuity. PROGRESS.md adds context cost and maintenance burden with no unique value. Users who want a human-readable artifact can keep it as a user-owned file — AIAgentMinder won't generate or manage it.

#### Refactor `/handoff`

Slim the command to its two unique contributions: (a) writing a deliberate priority note to auto-memory, and (b) prompting for DECISIONS.md updates. Strip the PROGRESS.md update step. The current session state logging is redundant with `--continue` and Session Memory. Keep the structured briefing printout.

#### Simplify CLAUDE.md context budget

The detailed context budget table was written before Claude Code had native context awareness. With the March 2026 `/context` command providing actionable optimization tips, simplify the table to a few key declarations (what to auto-load, what's on-demand) rather than byte-level guidance.

#### `/checkup` command

A diagnostic command that validates AIAgentMinder installation health. Checks:

- Node.js availability
- Required files present (CLAUDE.md, DECISIONS.md, docs/strategy-roadmap.md, .claude/settings.json)
- Hook script present and settings.json valid
- CLAUDE.md Project Identity populated (no placeholder brackets)
- Version stamp

Output is a short PASS/WARN/FAIL report. Useful after `/update` or when hooks aren't firing.

> Renamed from `/doctor` to avoid shadowing Claude Code's built-in `/doctor` command.

#### Complexity Budget (integrated into `/milestone`)

Track cumulative complexity signals as the project grows: file count, largest files, dependency count, coupling indicators. Surfaced as a fifth dimension in `/milestone` with trend lines — complements the phase progress, timeline, scope drift, and dependency health checks already there. No SDD tool or native feature provides this.

#### Technical Debt Tracker

A structured `## Known Debt` section in DECISIONS.md (or a separate DEBT.md for larger projects) for recording known shortcuts, workarounds, and deferred quality work. Claude logs debt when implementing workarounds. `/milestone` surfaces the debt list alongside scope drift.

#### Risk-Flagged Issues

During sprint planning, issues that touch high-risk areas (auth, payments, data migration, public APIs) are tagged with a `[risk]` flag. Risk flags auto-trigger `/self-review` before PR creation, regardless of quality tier.

#### Formalize Adaptive Sprint Sizing

`/retrospective` already provides adaptive sizing guidance after Sprint 3+. The v1.0 target is to formalize this: write sprint velocity metadata to SPRINT.md on archive so cross-session trend tracking works without parsing git history.

#### `approach-first.md` rule

A `.claude/rules/approach-first.md` rule that instructs Claude to state its intended approach before executing tasks involving architecture changes, new dependencies, or multi-file refactors. Prevents the "wrong approach" wasted-cycle pattern identified as a top friction point in the March 2026 session analysis.

#### `debug-checkpoint.md` rule

A `.claude/rules/debug-checkpoint.md` rule that triggers after N failed attempts at the same fix — instructing Claude to stop, summarize what's been tried, and ask for human input. Prevents debugging spirals.

### Should-Have (v1.0 if time permits)

#### `/scope-check` command

An active scope governance command: the developer proposes a feature or task, and `/scope-check` compares it against `docs/strategy-roadmap.md`, the current phase, and approved sprint scope. Returns a clear verdict: in-scope, out-of-scope, or deferred-to-phase-N. Complements the passive `scope-guardian.md` rule with an on-demand consultation.

#### Sprint workflow tasks integration

Sprint-workflow.md already uses native Tasks as the execution layer. Review and tighten the integration: ensure SPRINT.md is clearly the governance header (goal, scope, number, status) while native Tasks handle per-issue tracking. Document the boundary clearly so users know where to look for what.

#### `/plan` name collision audit

`/brief` was already renamed from `/plan` to avoid collision with Claude Code's built-in Plan Mode toggle. Audit all docs, README, and command files to ensure no remaining `/plan` references exist.

---

## Backlog (unscheduled)

- **SDD integration layer** — Generate a `constitution.md` or `steering.md` from `/brief` output that SDD tools (Spec-Kit, cc-sdd) can consume. Positions AIAgentMinder as the governance layer above feature-level planning tools.
- **`/onboard` command** — Analyze an existing codebase and generate AIAgentMinder state files from it (CLAUDE.md project identity, initial DECISIONS.md from git history, quality tier recommendation, draft strategy-roadmap.md). Targets developers who discover AIAgentMinder mid-project.
- **HTTP hook support** — Leverage Claude Code's new HTTP hooks (Late Feb 2026) for integrations without requiring Node.js.
- **Strategy-roadmap.md versioning** — Lightweight change log when the roadmap is revised mid-project.
- **MCP server detection in /checkup** — Verify MCP servers listed in CLAUDE.md are actually configured.

### Dropped from v1.0

- **`/handoff` JSON digest** — Speculative value for the target audience (solo devs, small teams). Nobody has asked for it. If someone needs programmatic session state, they can request it. Keeping in backlog.
- **`/update` dry-run mode** — Useful but not v1.0 critical. Keeping in backlog.
- **GitHub Issues bridge** — Team feature, not solo dev priority. Keeping in backlog.

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

# Roadmap

This document tracks planned features and future direction. The backlog has full acceptance criteria.

---

## v0.9.2 — Tooling and Diagnostics

### /checkup command

A diagnostic command that validates AIAgentMinder installation health. Checks:

- Node.js availability
- Required files present (CLAUDE.md, DECISIONS.md, docs/strategy-roadmap.md, .claude/settings.json)
- Hook script present and settings.json valid
- CLAUDE.md Project Identity populated (no placeholder brackets)
- Version stamp

Output is a short PASS/WARN/FAIL report. Useful after `/update` or when hooks aren’t firing.

> Renamed from `/doctor` to avoid shadowing Claude Code’s built-in `/doctor` command.

### /handoff JSON digest

When `/handoff` runs, optionally writes `.claude/session-digest.json` alongside the markdown output. Schema includes: timestamp, phase, active tasks, blockers, next priorities, decisions, files modified, session summary.

Useful for external tooling (CI/CD triggers, dashboards, Linear/GitHub integrations) without requiring markdown parsing. The file is ephemeral (git-ignored); PROGRESS.md remains the durable record.

---

## v1.0 — Intelligence Layer

> These are more ambitious features that require design work before implementation.

### Complexity Budget

Tracks cumulative complexity signals as the project grows: file count, largest files, dependency count, coupling indicators. Surfaced in `/milestone` with trend lines. Complements the phase progress and timeline checks already in `/milestone`.

### Adaptive Sprint Sizing

After Sprint 3+, `/retrospective` has enough data to recommend sprint size based on actual historical completion rates. This is already partially implemented — the `/retrospective` command provides adaptive sizing guidance based on historical data. The v1.0 target is to formalize this into SPRINT.md metadata for cross-session trend tracking.

### Technical Debt Tracker

A lightweight structured section in DECISIONS.md (or a separate DEBT.md) for recording known shortcuts, workarounds, and deferred quality work. Surfaced in `/milestone` alongside scope drift.

### Risk-Flagged Issues

During sprint planning, issues that touch high-risk areas (auth, payments, data migration, public APIs) are tagged with a risk flag. Risk flags trigger an automatic `/self-review` regardless of quality tier.

---

## Backlog (unscheduled)

- **`/update` dry-run mode** — show what would change before committing to the migration
- **Strategy-roadmap.md versioning** — lightweight change log when the roadmap is revised mid-project
- **GitHub Issues bridge** — optional: sync native Tasks to GitHub Issues for teams that want visibility outside Claude Code
- **MCP server detection in /checkup** — verify that MCP servers listed in CLAUDE.md are actually configured

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

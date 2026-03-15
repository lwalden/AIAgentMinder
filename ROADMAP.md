# Roadmap

This document tracks future direction. The backlog has full acceptance criteria for unscheduled items.

---

## v1.0 — Governance Maturity (shipped)

All v1.0 features have been implemented and merged. See [CHANGELOG.md](CHANGELOG.md) for details.

**Shipped:** `/aam-checkup` command, `/aam-scope-check` command, `approach-first.md` rule, `debug-checkpoint.md` rule, complexity budget in `/aam-milestone`, technical debt tracker (Known Debt in DECISIONS.md), risk-flagged issues in sprint planning, adaptive sprint sizing formalization, PROGRESS.md pruned, `/aam-handoff` refactored, CLAUDE.md context budget simplified.

## v1.1 — Command Prefix + Housekeeping (shipped)

**Shipped:** All commands renamed with `aam-` prefix to avoid collision with Claude Code built-in commands and other plugins. Docs reviewed and updated for accuracy. Analysis docs archived. Examples modernized.

---

## v1.2 — `/aam-revise` (shipped)

**Shipped:** Mid-stream plan revision command. Add, change, drop, or reprioritize features directly in `docs/strategy-roadmap.md` with decision logging and active sprint impact checks.

---

## v1.3 — Backlog Clearance (current)

**Shipped:** Roadmap versioning (`## Roadmap History` table + `/aam-revise` logging), GitHub Issues bridge (`/aam-sync-issues` optional command), missing skill packages for `aam-checkup` and `aam-scope-check`.

---

## Post-v1.3 Direction

AIAgentMinder is stable as a project governance layer for single-agent Claude Code sessions. Remaining future work:

1. **Reducing overhead** — evaluating whether the compact-reorient.js hook is still needed as Claude Code's native context handling improves
2. **Distribution improvements** — `/aam-update` dry-run mode
3. **HTTP hook support** — replacing Node.js dependency with Claude Code's HTTP hooks

---

## Backlog (unscheduled)

- **Evaluate compact-reorient.js necessity** — As Claude Code's native Session Memory and context handling improve, the post-compaction sprint reorientation hook may become redundant. Test whether removing it degrades sprint continuity; if not, drop the Node.js dependency.
- **`/aam-update` dry-run mode** — Show what would change before committing to the migration.
- **HTTP hook support** — Leverage Claude Code's HTTP hooks for integrations without requiring Node.js.

### Dropped

- **`/aam-handoff` JSON digest** — Speculative value for the target audience. Nobody has asked for it.
- **`/onboard` command** — The existing `/aam-brief` Starting Point E (existing project audit) covers this use case adequately. A separate command would duplicate effort.

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

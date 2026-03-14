# Roadmap

This document tracks future direction. The backlog has full acceptance criteria for unscheduled items.

---

## v1.0 — Governance Maturity (shipped)

All v1.0 features have been implemented and merged. See [CHANGELOG.md](CHANGELOG.md) for details.

**Shipped:** `/aam-checkup` command, `/aam-scope-check` command, `approach-first.md` rule, `debug-checkpoint.md` rule, complexity budget in `/aam-milestone`, technical debt tracker (Known Debt in DECISIONS.md), risk-flagged issues in sprint planning, adaptive sprint sizing formalization, PROGRESS.md pruned, `/aam-handoff` refactored, CLAUDE.md context budget simplified.

## v1.1 — Command Prefix + Housekeeping (current)

**Shipped:** All commands renamed with `aam-` prefix to avoid collision with Claude Code built-in commands and other plugins. Docs reviewed and updated for accuracy. Analysis docs archived. Examples modernized.

---

## Post-v1.1 Direction

AIAgentMinder is stable as a project governance layer for single-agent Claude Code sessions. Future work focuses on:

1. **SDD integration** — bridging AIAgentMinder governance with feature-level SDD tools (Spec-Kit, cc-sdd)
2. **Reducing overhead** — evaluating whether the compact-reorient.js hook is still needed as Claude Code's native context handling improves
3. **Distribution improvements** — plugin marketplace polish, `/aam-update` dry-run mode

---

## Backlog (unscheduled)

- **SDD integration layer** — Generate a `constitution.md` from `/aam-brief` output that SDD tools (Spec-Kit, cc-sdd) can consume. Positions AIAgentMinder as the governance layer above feature-level planning tools. See backlog for draft AC.
- **Evaluate compact-reorient.js necessity** — As Claude Code's native Session Memory and context handling improve, the post-compaction sprint reorientation hook may become redundant. Test whether removing it degrades sprint continuity; if not, drop the Node.js dependency.
- **`/aam-update` dry-run mode** — Show what would change before committing to the migration.
- **HTTP hook support** — Leverage Claude Code's HTTP hooks for integrations without requiring Node.js.
- **Strategy-roadmap.md versioning** — Lightweight change log when the roadmap is revised mid-project.
- **MCP server detection in `/aam-checkup`** — Verify MCP servers listed in CLAUDE.md are actually configured.
- **GitHub Issues bridge** — Optional sync of native Tasks to GitHub Issues for teams that want visibility outside Claude Code.

### Dropped

- **`/aam-handoff` JSON digest** — Speculative value for the target audience. Nobody has asked for it.
- **`/onboard` command** — The existing `/aam-brief` Starting Point E (existing project audit) covers this use case adequately. A separate command would duplicate effort.

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

# AIAgentMinder Backlog

Full acceptance criteria for unscheduled features. Items here are assessed and ready to implement when prioritized.

---

## SDD Integration Layer

**Title:** Generate a `constitution.md` from `/aam-brief` output for SDD tool compatibility

**Description:**
SDD tools (Spec-Kit, cc-sdd, GSD) handle feature-level planning. AIAgentMinder handles project-level governance. Instead of competing, generate a governance document that SDD tools can consume — positioning AIAgentMinder as the layer above SDD.

**Acceptance Criteria (draft):**

1. `/aam-brief` final step optionally generates `docs/constitution.md` with: project identity, quality tier, architectural constraints, out-of-scope list, tech stack decisions
2. The file follows emerging SDD conventions (compatible with Spec-Kit `constitution.md` format)
3. `/aam-setup` asks: "Generate SDD constitution.md for use with Spec-Kit/cc-sdd? (y/n)"

---

## `/aam-update` Dry-Run Mode

Show what would change before committing to the migration. Useful but not critical.

---

## GitHub Issues Bridge

Optional sync of native Tasks to GitHub Issues for teams that want visibility outside Claude Code. Team feature, not solo dev priority.

---

## MCP Server Detection in `/aam-checkup`

Verify MCP servers listed in CLAUDE.md are actually configured in the project's MCP config. Post-v1.0 because MCP config format is still stabilizing.

---

## Strategy-Roadmap.md Versioning

Lightweight change log when the roadmap is revised mid-project. Low urgency; git history serves as the archive.

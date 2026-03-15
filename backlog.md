# AIAgentMinder Backlog

Full acceptance criteria for unscheduled features. Items here are assessed and ready to implement when prioritized.

---

## ~~SDD Integration Layer~~ — Dropped

~~Generate a `constitution.md` from `/aam-brief` output for SDD tool compatibility.~~

**Dropped:** Investigated kiro (cc-sdd) integration. Kiro reads `.kiro/steering/` files — not `constitution.md` — so the integration point was wrong. A generated `constitution.md` would never be consumed by the target tool. Feature removed before shipping.

---

## `/aam-update` Dry-Run Mode

Show what would change before committing to the migration. Useful but not critical.

---

## ~~GitHub Issues Bridge~~ — Shipped in v1.3

~~Optional sync of native Tasks to GitHub Issues for teams that want visibility outside Claude Code.~~

**Shipped:** `/aam-sync-issues` command added. Uses `gh` CLI to create/close/comment on GitHub Issues from SPRINT.md. Optional — enabled via `/aam-setup` question 12 or `/aam-update`.

---

## ~~MCP Server Detection in `/aam-checkup`~~ — Canceled

~~Verify MCP servers listed in CLAUDE.md are actually configured in the project's MCP config.~~

**Canceled:** Doesn't add enough value. MCP config format is still in flux and users can verify this themselves trivially.

---

## Strategy-Roadmap.md Versioning

Lightweight change log when the roadmap is revised mid-project. Low urgency; git history serves as the archive.

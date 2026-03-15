# Demo: Planning and Building a Recipe API

A walkthrough of three sessions using AIAgentMinder. Shows `/aam-brief`, `/aam-handoff`, and the resume cycle.

---

## Session 1: Planning

> **User:** /aam-brief

> **Claude:** Where are you with your project idea? A) Rough concept B) Clear idea C) Partial plan D) Detailed plan

> **User:** B

[Claude asks grouped rounds — core concept, scope, quality tier]

> **User:** REST API for saving and sharing recipes. Search by ingredient — "what can I make with chicken and lemon?" Node/Express/Postgres stack. Must-haves: auth, recipe CRUD, ingredient search, favorites, rate limiting. Out of scope: mobile app, URL import, social features, nutrition data. Standard quality tier.

[Claude confirms scope, generates `docs/strategy-roadmap.md` — see `examples/strategy-roadmap.md`]

> **Claude:** Roadmap written. Lightweight or formal ADR format?

> **User:** Lightweight.

[Claude records format preference in DECISIONS.md, populates MVP Goals in CLAUDE.md]

> **User:** /aam-handoff

[Claude writes priorities to auto-memory, updates DECISIONS.md with ADR format choice, commits]

> Session handoff complete. Next session: scaffold the Express app. Blockers for human: create GitHub repo, provision PostgreSQL.

---

## Session 2: Building with Sprint Planning

*(New session. Session Memory provides automatic context from Session 1.)*

> **User:** Start a sprint for Phase 1.

> **Claude:** Reading roadmap... I'll propose a first sprint covering the foundational work:
>
> Sprint S1 — "Auth + Scaffold"
> 1. S1-001: Scaffold Express app (feature)
> 2. S1-002: Set up Jest + Supertest (chore)
> 3. S1-003: User registration + JWT auth [risk] (feature)
> 4. S1-004: Auth middleware (feature)
> 5. S1-005: Recipe CRUD endpoints (feature)
>
> S1-003 is risk-tagged because it touches auth. Deferred to Sprint 2: ingredient search, favorites, rate limiting.
> Approve this sprint?

> **User:** Approved.

[Claude creates feature branch, scaffolds src/app.ts, src/db/pool.ts, src/routes/, .env.example, installs dependencies]

[Claude writes failing tests for auth, implements POST /auth/register and POST /auth/login — tests pass]

[Runs `/aam-quality-gate` — Standard tier checks pass. Creates PR for S1-003.]

[For the risk-tagged auth issue, Claude also runs `/aam-self-review` — security lens finds no issues.]

> **User:** PR looks good. Continue.

[Claude implements recipe CRUD routes with tests — all pass]

> **User:** /aam-handoff

[Claude writes priorities to auto-memory: "Next: ingredient search, favorites, rate limiting (Sprint 2)". Updates DECISIONS.md with Zod validation decision. Commits.]

---

## Session 3: Continuing

*(Fresh session. SPRINT.md is loaded automatically via @import.)*

> **User:** Resume.

> **Claude:** Sprint S1: 5/5 issues complete. All PRs merged. Ready for sprint review.

[Claude runs `/aam-retrospective` — 5 planned, 5 completed, 0 scope changes, 0 blocked, 1 decision logged. "First sprint — recommend 4–5 issues next sprint. No stress indicators."]

> **User:** Archive the sprint and start Sprint 2.

[Sprint S1 archived with sizing metadata. Claude proposes Sprint S2: ingredient search, favorites, rate limiting, plus a Zod schema refinement issue.]

> **User:** Approved.

[Claude continues building...]

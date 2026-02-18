# Demo: Planning and Building a Recipe API

A walkthrough of three sessions using AIAgentMinder. Shows `/plan`, `/handoff`, and the resume cycle.

---

## Session 1: Planning

> **User:** /plan

> **Claude:** Where are you with your project idea? A) Rough concept B) Clear idea C) Partial plan D) Detailed plan

> **User:** B

[Claude asks grouped rounds — core concept, scope, quality tier]

> **User:** REST API for saving and sharing recipes. Search by ingredient — "what can I make with chicken and lemon?" Node/Express/Postgres stack. Must-haves: auth, recipe CRUD, ingredient search, favorites, rate limiting. Out of scope: mobile app, URL import, social features, nutrition data. Standard quality tier.

[Claude confirms scope, generates `docs/strategy-roadmap.md` — see `examples/strategy-roadmap.md`]

> **Claude:** Roadmap written. Lightweight or formal ADR format?

> **User:** Lightweight.

[Claude records format preference in DECISIONS.md, populates MVP Goals in CLAUDE.md]

> **User:** /handoff

[Claude rewrites PROGRESS.md: Active Tasks = "None — planning complete", Current State = "strategy-roadmap.md generated, no code yet", Next Priorities = scaffold → auth → test setup. Adds session note.]

> Session handoff complete. Next session: scaffold the Express app. Blockers for human: create GitHub repo, provision PostgreSQL.

---

## Session 2: Building

*(New session. SessionStart hook fires — PROGRESS.md injected automatically.)*

> **Claude (hook output):**
> ```
> --- PROGRESS.md (session context) ---
> [PROGRESS.md contents injected]
>
> --- Tasks from PROGRESS.md ---
> [priority] Scaffold Express app — src/app.ts, src/db/pool.ts...
> [priority] Implement auth endpoints...
> [priority] Set up Jest + Supertest...
> ```

> **User:** Start on the next priority.

> **Claude:** Planning is done, no code yet. Starting with the Express scaffold.

[Claude scaffolds src/app.ts, src/db/pool.ts, src/routes/, .env.example, installs dependencies]

[Claude writes failing tests for auth, implements POST /auth/register and POST /auth/login — tests pass]

> **User:** Looks good. Now the recipe routes.

[Claude implements GET /recipes and GET /recipes/:id with integration tests — tests pass]

> **User:** /handoff

[Claude rewrites PROGRESS.md:]
- Active Tasks: "Recipe mutation routes (POST, PUT, DELETE) — not yet started"
- Current State: "App running. Auth complete. GET /recipes working with tests. Auth middleware exists but not applied to mutation routes."
- Next Priorities: POST /recipes with Zod validation → apply auth middleware → PUT/DELETE with ownership check
- Adds session note for 2026-02-15

> **Claude:** Also logging the Zod decision.

```
### Input Validation | 2026-02-15 | Status: Active
Chose: Zod over Joi and express-validator. Why: TypeScript-first — schemas double as type
definitions, eliminating runtime/compile mismatches. Tradeoff: new to Zod (learning curve).
```

> Next session: POST /recipes with validation, then PUT/DELETE with auth. Blockers: provision staging DB.

---

## Session 3: Continuing

*(Fresh session. Hook injects PROGRESS.md and DECISIONS.md.)*

> **Claude (hook output):**
> ```
> [active] Recipe mutation routes — not yet started
> [state] App running. Auth complete. GET /recipes working with tests.
> [state] Auth middleware exists but not applied to mutation routes.
> [priority] POST /recipes with Zod validation...
> [priority] Apply auth middleware to mutation routes...
> --- DECISIONS.md injected (4 decisions) ---
> ```

> **User:** Resume.

> **Claude:** GET routes done, auth middleware not yet applied to mutations, POST /recipes schema stub exists. Writing failing test first.

[Claude writes failing tests: no auth → 401, valid body + auth → 201]

[Claude wires auth middleware, connects Zod schema — validation errors return 400 with field errors]

[Tests pass, commits on feature branch]

> **User:** Wire the same into PUT and DELETE.

[Claude implements PUT/DELETE /recipes/:id with ownership check — 403 if not owner. Tests pass.]

> **User:** /handoff

[Claude rewrites PROGRESS.md:]
- Active Tasks: "Ingredient search — not yet started"
- Current State: "Full recipe CRUD complete. Zod validation on POST/PUT. Auth on all mutation routes. All tests passing."
- Next Priorities: ingredient search → favorites → rate limiting
- Adds session note for 2026-02-17, drops oldest note (now 3 kept)

> Next session: ingredient search (the core feature), then favorites, then rate limiting. Blockers: provision Railway PostgreSQL.

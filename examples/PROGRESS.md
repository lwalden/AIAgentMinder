# PROGRESS.md - Session Continuity

> Claude reads this FIRST every session. When adding a session note, keep only the 3 most recent -- drop older ones (git history is the archive).

**Phase:** 1 - MVP
**Last Updated:** 2026-02-17

## Active Tasks
- Implement POST /recipes endpoint with Zod validation — schema defined in src/schemas/recipe.ts, handler stub exists in src/routes/recipes.ts but validation middleware not wired up yet

## Current State
- Express app scaffolded and running. GET /recipes and GET /recipes/:id working with integration tests passing.
- POST /auth/register and POST /auth/login complete — JWT tokens issued correctly.
- Auth middleware exists (src/middleware/auth.ts) but not yet applied to recipe mutation routes.
- POST /recipes stub exists but returns 501; Zod validation schema written but not connected.

## Blockers
- Need DATABASE_URL for staging environment before deploy can be tested — waiting on human to provision RDS instance

## Next Priorities
1. Wire Zod validation middleware into POST /recipes route (src/routes/recipes.ts:47) and write failing test first
2. Apply auth middleware to POST/PUT/DELETE /recipes routes — only owner should be able to mutate
3. Implement PUT /recipes/:id and DELETE /recipes/:id with ownership check

---
<!-- Session notes: keep last 3. Older ones are in git history. Format: - [DATE] Phase [N]: [what was accomplished]. Key files: [files touched]. → [what's next] -->
- 2026-02-17 Phase 1: Implemented GET /recipes and GET /recipes/:id with full integration tests. Key files: src/routes/recipes.ts, src/db/queries/recipes.ts, tests/recipes.test.ts. → POST endpoint with validation
- 2026-02-15 Phase 1: Scaffolded Express app, set up PostgreSQL connection pool, implemented auth endpoints. Key files: src/app.ts, src/db/pool.ts, src/routes/auth.ts, src/middleware/auth.ts. → Recipe CRUD routes
- 2026-02-13 Phase 1: Ran /plan, generated strategy-roadmap.md, chose Standard quality tier. Key files: docs/strategy-roadmap.md, CLAUDE.md. → Begin scaffold

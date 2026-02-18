# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.
> Claude reads this before making architectural choices.
>

> **When to log:** choosing a library/framework, designing an API, selecting an auth approach, changing a data model, making a build/deploy decision.

---

## ADR Format

<!-- Format: Lightweight -->

**Lightweight:**
```
### [Title] | Date | Status: Active
Chose: [X] over [alternatives considered]. Why: [rationale]. Tradeoff: [what you gave up].
```

**Status values:** Active | Superseded | Revisit

---

### Web Framework | 2026-02-13 | Status: Active
Chose: Express over Fastify and Hono. Why: larger ecosystem, more Stack Overflow answers, team familiarity — faster to ship. Tradeoff: slower than Fastify at high concurrency; heavier than Hono for this use case. Revisit if we hit performance issues above 1k req/sec.

### Auth Strategy | 2026-02-13 | Status: Active
Chose: JWT (stateless) over session cookies and OAuth-only. Why: API-first design means no browser session needed; simpler to implement; works cleanly with mobile clients if we add them later. Tradeoff: no server-side token revocation — if a token is stolen it's valid until expiry (15 min access / 7 day refresh). Acceptable risk for this project's threat model.

### Database | 2026-02-13 | Status: Active
Chose: PostgreSQL over MongoDB and SQLite. Why: recipe data is relational (users → recipes → ingredients → tags); SQL gives us joins and transactions for free. Tradeoff: more setup overhead than SQLite, requires managed DB for prod. MongoDB considered but document model doesn't fit the ingredient search query pattern well.

### Input Validation | 2026-02-15 | Status: Active
Chose: Zod over Joi and express-validator. Why: TypeScript-first — schemas double as type definitions, eliminating a class of runtime/compile mismatches. Strong ecosystem, well-maintained. Tradeoff: developer is new to Zod (slight learning curve). Joi considered but less idiomatic with TypeScript; express-validator too verbose for nested schemas.

# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.
> Claude reads this before making architectural choices.
> Move superseded entries to `docs/archive/decisions-archive.md`.
>
> **When to log:** choosing a library/framework, designing an API, selecting an auth approach, changing a data model, making a build/deploy decision.

---

## ADR Format

<!-- Set by /plan. Replace this comment with one of:
     "Format: Lightweight" -- one-liner entries as shown below
     "Format: Formal" -- full Context / Decision / Consequences sections
-->

---

## Format Reference

**Lightweight (default):**
```
### [Short decision title]
**Date:** YYYY-MM-DD | **Status:** Active | **Chose:** [what was chosen]
**Why:** [1-2 sentence rationale. What alternatives were rejected and why?]
```

**Formal:**
```
### [Short decision title]
**Date:** YYYY-MM-DD | **Status:** Active

**Context:** [What situation prompted this decision?]
**Decision:** [What was decided?]
**Consequences:** [Trade-offs, follow-up work, risks accepted]
```

**Status values:** Active | Superseded | Revisit

**Example (lightweight):**
```
### Auth library
**Date:** 2025-01-15 | **Status:** Active | **Chose:** NextAuth.js
**Why:** Handles OAuth providers and session management out of the box. Passport.js rejected -- too much manual wiring for our timeline.
```

---

<!-- Decisions go here -->


# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise — every line costs context tokens.
> Use `claude --continue` to restore the previous session's full message history.

---

## Project Identity

**Project:** RecipeShare API
**Description:** REST API for sharing and discovering recipes. Users can create accounts, post recipes with ingredients and steps, search by ingredient or tag, and save favorites.
**Type:** api
**Stack:** Node.js / Express / PostgreSQL / Zod (validation) / Jest (tests)

**Developer Profile:**
- Mid-level full-stack developer, comfortable with Node/SQL, new to Zod
- Risk tolerance: medium — wants reasonable test coverage but not over-engineered

---

## MVP Goals

- User registration and JWT authentication -- Acceptance: POST /auth/register and POST /auth/login return tokens; protected routes reject invalid tokens
- Recipe CRUD -- Acceptance: create, read, update, delete recipes; only owner can modify
- Ingredient-based search -- Acceptance: GET /recipes?ingredients=chicken,garlic returns matching recipes
- Favorites -- Acceptance: authenticated user can save/unsave recipes; GET /users/me/favorites returns their list
- Basic rate limiting -- Acceptance: >100 req/min from same IP returns 429

---

## Behavioral Rules

### Git Workflow

See `.claude/rules/git-workflow.md` — loaded natively by Claude Code each session.

### Credentials

Never store credentials in code. Use `.env` files (gitignored).

### Autonomy Boundaries

**You CAN autonomously:** Create files, install packages, run builds/tests, create branches and PRs, scaffold code

**Ask the human first:** Create GitHub repos, merge PRs, sign up for services, provide API keys, approve major architectural changes

### Verification-First Development

- Confirm requirements before implementing
- Write failing tests first, then implement
- Run the full test suite before every commit

### Decision Recording

- Record significant architectural decisions in DECISIONS.md (library choices, API contracts, auth approach, data model changes, deploy decisions)
- Record known shortcuts and workarounds in the Known Debt section of DECISIONS.md
- Include alternatives considered — a decision without alternatives is an assertion, not a record
- To auto-load DECISIONS.md every session, add `@DECISIONS.md` to this file

---

## Context Budget

> Use `/context` for real-time context usage and optimization tips.

**Always loaded:** CLAUDE.md — keep under ~50 lines; don't add without removing something

**On-demand:** DECISIONS.md — add `@DECISIONS.md` here to auto-load; delete superseded entries

**Sprint tracking:** SPRINT.md — auto-loaded via @import; archived when sprint completes

@SPRINT.md

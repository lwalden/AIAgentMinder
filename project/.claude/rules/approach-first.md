# Approach-First Protocol
# AIAgentMinder-managed. Delete this file to opt out of approach-first guidance.

## When This Applies

Before writing code for any of the following, state your intended approach first:

- Architecture changes (new layers, services, or patterns)
- Adding new dependencies or integrating third-party services
- Multi-file refactors (touching more than 3 files)
- New data models or schema changes
- Changes to public APIs or shared interfaces

## What to State

Before executing, write a brief approach statement:

1. **What** you're going to do (one sentence)
2. **Which files** will be created or modified (list them)
3. **Key assumptions** — anything the user should know before you start
4. **Cost/billing impact** — if the change touches a paid external service (API calls, webhooks, cloud resources), state the expected cost implications of the design. Flag designs where a failure mode could cause runaway costs (e.g., retry loops hitting a paid API, fallback paths that re-process already-handled work).

Keep it short. This is a check-in, not a design doc.

**Example:**
> Approach: Add a refresh token endpoint by creating `src/routes/auth/refresh.ts`, updating `src/middleware/auth.ts` to validate refresh tokens, and adding a `refresh_tokens` table migration. Assuming the existing JWT secret is reused for refresh tokens — let me know if that should be separate.

Wait for the user to respond before writing code.

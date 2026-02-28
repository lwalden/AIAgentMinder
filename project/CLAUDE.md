# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise — every line costs context tokens.
> Use `claude --continue` to restore the previous session's full message history.

## Project Identity

**Project:** [Project Name]
**Description:** [Brief description]
**Type:** [web-app | api | cli-tool | library | mobile-app | other]
**Stack:** [Language / Framework / Database / etc.]

**Developer Profile:**
- [Experience level and tech expertise]
- [Risk tolerance: conservative / medium / aggressive]

## MVP Goals

<!-- Populated by /plan with Phase 1 deliverables -->

## Behavioral Rules

### Git Workflow
- **Never commit directly to main** — always use feature branches
- Branch naming: `feature/short-description`, `fix/short-description`, `chore/short-description`
- All changes via PR. Claude creates PRs; human reviews and merges

### Credentials
- Never store credentials in code. Use `.env` files (gitignored).

### Autonomy Boundaries
**You CAN autonomously:** Create files, install packages, run builds/tests, create branches and PRs, scaffold code
**Ask the human first:** Create GitHub repos, merge PRs, sign up for services, provide API keys, approve major architectural changes

### Verification-First Development
- Confirm requirements before implementing
- Write tests appropriate to the project's quality tier (see strategy-roadmap.md)
- When Standard tier or above: write failing tests first, then implement

### Decision Recording
- Record significant architectural decisions in DECISIONS.md (library choices, API contracts, auth approach, data model changes, deploy decisions)
- Include alternatives considered — a decision without alternatives is an assertion, not a record
- To auto-load DECISIONS.md every session, add `@DECISIONS.md` to this file

## Context Budget

| File | Target Size | Notes |
|------|------------|-------|
| CLAUDE.md | ~50 lines | Don't add without removing something |
| DECISIONS.md | Grows over time | Delete superseded entries (git history preserves them) |

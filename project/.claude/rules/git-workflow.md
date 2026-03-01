---
description: Git workflow discipline rules
---

# Git Workflow Rules
# AIAgentMinder-managed. Delete this file to opt out of git workflow guidance.

## Commit Discipline

- Never commit directly to `main` or `master` — always use feature branches.
- Branch naming: `feature/short-description`, `fix/short-description`, `chore/short-description`.
- Write commits manually when work is meaningfully complete — not on auto-timers or session end.
- Commit messages describe **why**, not what: `feat(auth): add JWT refresh to prevent session expiry` not `add refresh endpoint`.
- Format: `type(scope): description` where type is `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Review your own diff before committing: no dead code, no debug statements, no hardcoded values.

## PR Workflow

- All changes go through PRs. Claude creates PRs; the human reviews and merges.
- Never merge without human review. After creating a PR, notify the user and wait.
- PR description includes: what changed, why, and how to test it.

## What Not to Auto-Commit

Do not automatically commit on session end, on a schedule, or without explicit intent.
Commits should represent deliberate checkpoints, not automated noise.

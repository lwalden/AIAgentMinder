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

## PR Workflow

- All changes go through PRs. Claude creates PRs; the human reviews and merges.
- Never merge without human review. After creating a PR, notify the user and wait.

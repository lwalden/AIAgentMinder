---
description: Code quality and development discipline rules
---

# Code Quality Guidance
# AIAgentMinder-managed. Delete this file to opt out of code quality guidance.

## Development Discipline

**TDD cycle (Standard tier and above):** Write a failing test first. Implement the minimal solution to make it pass. Refactor only after tests are green.

**Build and test before every commit:** Run the project's build command and full test suite before staging anything. Never commit code that doesn't compile or has failing tests.

**Review your own diff before committing:** Before staging, scan for: dead code, leftover debug statements (`console.log`, `debugger`, `print`), hardcoded values that belong in config, missing error handling, and repeated logic that could be extracted.

**Small, single-purpose functions:** If a function exceeds ~30 lines, look for extraction opportunities. One function, one responsibility, clear types.

**Explicit error handling:** Never swallow exceptions silently. Log or propagate errors with enough context to diagnose them. Handle edge cases explicitly — don't assume inputs are valid.

**Read before you write:** Before adding code to a layer or module, read 2-3 existing files in that layer. Match the project's naming conventions, file structure, and error handling patterns exactly.

**Commit messages describe why, not what:** Format: `type(scope): description` — e.g., `feat(auth): add JWT refresh token rotation`. The diff shows what changed; the message explains why it was the right change.

**CI-ready code:** Produce code that passes the project's full CI pipeline. Run linters and formatters if configured before committing — don't leave that to CI to catch.

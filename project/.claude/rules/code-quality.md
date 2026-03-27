---
description: Code quality and development discipline rules
---

# Code Quality Guidance
# AIAgentMinder-managed. Delete this file to opt out of code quality guidance.

## Development Discipline

**TDD cycle:** Write a failing test first. Implement the minimal solution to make it pass. Refactor only after tests are green.

**Build and test before every commit:** Run the project's build command and full test suite before staging anything. Never commit code that doesn't compile or has failing tests.

**Small, single-purpose functions:** If a function exceeds ~30 lines, look for extraction opportunities. One function, one responsibility, clear types.

**Read before you write:** Before adding code to a layer or module, read 2-3 existing files in that layer. Match the project's naming conventions, file structure, and error handling patterns exactly.

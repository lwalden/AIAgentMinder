# .claude/rules/

Rules files loaded natively by Claude Code at every session start. No hooks required.

All `.md` files in this directory are auto-discovered and loaded automatically. Delete a file to disable that rule.

| File | Purpose |
|------|---------|
| `code-quality.md` | TDD cycle, build-before-commit, review-before-commit, error handling |
| `sprint-workflow.md` | Sprint planning and execution workflow (requires sprint planning to be enabled) |

Add your own `.md` files here for project-specific rules. Files support YAML frontmatter with `globs:` patterns to scope rules to specific file paths.

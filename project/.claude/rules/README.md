# .claude/rules/

Rules files loaded natively by Claude Code at every session start. No hooks required.

All `.md` files in this directory are auto-discovered and loaded automatically. Delete a file to disable that rule.

| File | Purpose |
|------|---------|
| `git-workflow.md` | Git discipline — branch naming, commit discipline, PR workflow (always active) |
| `scope-guardian.md` | Scope governance — checks new work against roadmap before implementing (always active) |
| `approach-first.md` | Approach-first protocol — state intent before executing architecture/multi-file changes (always active) |
| `debug-checkpoint.md` | Debug checkpoint — stops spirals after 3 failed attempts at the same fix (always active) |
| `tool-first.md` | Tool-first autonomy — use CLI/API tools instead of asking the user to do it (always active) |
| `correction-capture.md` | Correction capture — flags repeated wrong-first-approach patterns and proposes permanent instructions (always active) |
| `code-quality.md` | TDD cycle, build-before-commit, review-before-commit, error handling (optional) |
| `sprint-workflow.md` | Sprint governance over native Tasks — planning, approval gates, context cycling, review/archive (optional) |
| `architecture-fitness.md` | Structural constraints — layer boundaries, external API rules, etc. (optional, customize for your project) |

Add your own `.md` files here for project-specific rules. Files support YAML frontmatter with `globs:` patterns to scope rules to specific file paths.

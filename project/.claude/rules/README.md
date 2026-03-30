# .claude/rules/

Universal rules loaded natively by Claude Code at every session start. These rules apply to ALL session types (sprint, dev, debug, hotfix, qa, research).

Mode-specific rules (sprint workflow, code quality, architecture fitness, approach-first, debug checkpoint, scope guardian) have moved to `.claude/agents/` — they load only when the relevant session profile is active.

Context cycling is enforced by a `PreToolUse` hook (`context-cycle-hook.sh`) configured in `settings.json`, not by rules alone.

| File | Purpose |
|------|---------|
| `git-workflow.md` | Git discipline — branch naming, commit discipline, PR workflow |
| `tool-first.md` | Tool-first autonomy — use CLI/API tools instead of asking the user to do it |
| `correction-capture.md` | Correction capture — flags repeated wrong-first-approach patterns |
| `context-cycling.md` | Context cycling procedure — what to do when the PreToolUse hook fires |

Add your own `.md` files here for project-specific rules. Files support YAML frontmatter with `globs:` patterns to scope rules to specific file paths.

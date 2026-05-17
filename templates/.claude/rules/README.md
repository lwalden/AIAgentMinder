# .claude/rules/

Universal rules loaded natively by Claude Code at every session start. These rules apply to ALL session types (sprint, dev, debug, hotfix, qa, research).

Mode-specific rules (sprint workflow, code quality, architecture fitness, approach-first, debug checkpoint, scope guardian) have moved to `.claude/agents/` — they load only when the relevant session profile is active.

Context-usage warnings are emitted by a `Stop` hook (`context-warning-hook.sh`) configured in `hooks/hooks.json`. The `context-warnings.md` rule below describes how to respond when one appears.

| File | Purpose |
|------|---------|
| `git-workflow.md` | Git discipline — branch naming, commit discipline, PR workflow |
| `tool-first.md` | Tool-first autonomy — use CLI/API tools instead of asking the user to do it |
| `context-warnings.md` | How to respond when the context-usage warning fires |

Repeated-mistake capture is handled by Claude Code's native **Auto Memory** — no AAM rule or hook required.

Add your own `.md` files here for project-specific rules. Files support YAML frontmatter with `globs:` patterns to scope rules to specific file paths.

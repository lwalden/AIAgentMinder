---
description: Generic context cycling procedure — applies to all session types
---

# Context Cycling

When the PreToolUse hook blocks tools with "CONTEXT CYCLE REQUIRED":

1. **Commit all uncommitted work** (git add + git commit).
2. **Type `/exit`** to end the session cleanly.

That's it. The SessionEnd hook (`session-end-cycle.sh`) automatically builds
`.sprint-continuation.md` from external state (git branch, git log, SPRINT.md,
`.exec/directive.md` if present) and writes `.sprint-continue-signal`. The
SessionStart hook injects the continuation into the next session.

Do NOT manually write `.sprint-continuation.md` or `.sprint-continue-signal`.
Do NOT run `context-cycle.sh`. Those are obsolete steps from before ADR-004.

The `.context-usage` file (written by status line hook) tracks token usage.
When `should_cycle` is `true`, the PreToolUse hook enforces cycling.

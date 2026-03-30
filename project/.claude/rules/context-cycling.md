---
description: Generic context cycling procedure — applies to all session types
---

# Context Cycling

When the PreToolUse hook blocks tools with "CONTEXT CYCLE REQUIRED":

1. **Commit all uncommitted work.**
2. **Write `.sprint-continuation.md`** with:
   - What you were working on (sprint item, feature, debug session)
   - What's next (next item, next step, next hypothesis)
   - Critical context that would be lost (2-5 bullets)
3. **Write empty `.sprint-continue-signal`** file.
4. **Run:** `bash .claude/scripts/context-cycle.sh`

The `.context-usage` file (written by status line hook) tracks token usage.
When `should_cycle` is `true`, the PreToolUse hook enforces cycling.

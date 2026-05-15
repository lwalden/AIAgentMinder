---
description: Context cycling procedure — applies only when a sprint is in-progress
---

# Context Cycling

Cycling fires only when **both** are true: `.context-usage` says
`should_cycle=true` AND `SPRINT.md` Status is `in-progress`. Non-sprint
sessions get a soft advisory; cycle hook does not block.

When you see "BLOCKED — CONTEXT CYCLE REQUIRED":

1. **Commit all uncommitted work** (`git add` + `git commit`).
2. **Type `/exit`** to end the session cleanly.

That's it. Do NOT manually write `.sprint-continuation.md` or
`.sprint-continue-signal`. Do NOT run `context-cycle.sh` (obsolete).

Tools allowed during an active cycle: **Bash, Write, Read, Edit**. All
others are blocked. The cycle protocol's purpose is preventing *new
exploration* while permitting *finalization* of work in motion.

Status line uses session-relative thresholds (delta from session start)
so resumed sessions don't auto-cycle. SessionStart cycle reset wipes
stale `.context-usage`; continuation injection fires on both `claude`
(startup) and `claude --continue` (resume).

See DECISIONS.md → "Context cycling: sprint-gated with session-relative
thresholds" for full rationale.

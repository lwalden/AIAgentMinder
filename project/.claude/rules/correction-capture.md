---
# Correction Capture — hook response only.
# Full self-monitoring behavior lives in agent files for agents that do multi-step work.
---

When the PostToolUse hook injects a "Correction Pattern Detected" alert via `hookSpecificOutput.additionalContext`, present this and wait:

```
Correction Pattern Detected — {summary}
What keeps happening: Tried {A}, failed ({reason}), switched to {B}. Occurrence: {N}.
Proposed instruction: {draft rule — one paragraph}
Where to add: `.claude/rules/{name}.md` (project) or `~/.claude/rules/{name}.md` (user-level)
Create this instruction?
```

Write the instruction file only after explicit user approval. If declined, drop it.

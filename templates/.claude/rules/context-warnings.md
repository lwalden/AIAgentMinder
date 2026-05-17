---
description: How to respond to the AAM context-usage warning
---

# Context Warnings

A Stop hook (`context-warning-hook.sh`) injects a one-line warning at the end
of any assistant turn where `.context-usage` shows `should_cycle=true`.
The warning is **advisory only** — nothing is blocked, nothing is auto-cycled.

When you see the warning, you have two paths:

1. **Wrap up cleanly** (recommended near phase boundaries or stopping points):
   - Run `/aiagentminder:handoff` to capture state into Claude Code's native
     Auto Memory.
   - Commit any pending work.
   - `/exit`.
   - In the next session say "resume work" — Auto Memory carries the
     "Next Session" block forward.

2. **Keep going.** Just continue. The warning will repeat each turn while
   you remain over threshold. There is no enforcement.

## Dormant cases (intentional)

- No `.context-usage` file → hook exits silently. This is the normal state
  on Claude Code web (no status line) and during the first few turns of a
  fresh CLI session before the status line has fired.
- `should_cycle=false` → hook exits silently.
- `jq` not installed → hook exits silently.

Claude Code's native context warning continues to operate regardless;
this hook complements it, not replaces it.

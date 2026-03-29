# Correction Capture
# AIAgentMinder-managed. Delete this file to opt out of correction capture.

## Automated Detection

A PostToolUse hook (`correction-capture-hook.sh`) automatically tracks correction patterns.
When a tool call fails and the next call to the same tool uses different arguments, the hook
logs it to `.corrections.jsonl`. When the same pattern recurs (2+ occurrences), the hook
injects an alert into your context via `hookSpecificOutput.additionalContext`.

When you see a "Correction Pattern Detected" alert from the hook, follow the **Flagging Output**
protocol below — the hook has already identified the pattern and count for you.

## The Pattern

A **correction** is when you try approach A, it fails, and you switch to approach B which succeeds.

The hook detects these automatically for tool calls. For non-tool corrections (reasoning,
approach changes), note them mentally. If the **same** correction pattern recurs later in the
session (2nd occurrence), flag it.

## What Counts as a Correction

- Wrong syntax for the platform (e.g., `&&` on Windows instead of `;`)
- Wrong tool, CLI flag, or API call that fails before the right one works
- Wrong file path convention, import style, or config format for the project

## What Does NOT Count

- Transient failures (network timeouts, flaky tests, race conditions)
- Environment issues (service down, missing credentials)
- Expected trial-and-error during debugging (`debug-checkpoint.md` governs that)
- Exploratory work where multiple approaches are being evaluated intentionally

## Flagging Output

When the same correction recurs, stop and present:

```
Correction Pattern Detected — {summary}

What keeps happening:
  Tried {A}, failed because {reason}, used {B} instead.
  This is the {2nd/3rd} time this session.

Proposed instruction:
  {draft rule text — concise, actionable, one paragraph or less}

Where to add it:
  - `.claude/rules/{filename}.md` — if project-specific
  - `~/.claude/rules/{filename}.md` — if user/platform-level

Create this instruction?
```

Wait for the user to review, edit, and approve before writing anything.

## After Approval

Write the instruction to the approved location. Use a descriptive filename (e.g., `windows-shell-syntax.md`, `api-auth-pattern.md`). Confirm what was created.

If the user declines, drop it — do not ask again for the same pattern.

## When This Does NOT Apply

- The user has explicitly said "keep trying" or "figure it out"
- You are in an active debugging spiral (defer to `debug-checkpoint.md`)

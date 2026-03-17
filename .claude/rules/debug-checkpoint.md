# Debugging Checkpoint
# AIAgentMinder-managed. Delete this file to opt out of debug checkpoint guidance.

## The Pattern

When debugging a specific error:

- **Attempt 1–2:** Try fixes normally.
- **Attempt 3 (same error, different code change):** Stop. Run the checkpoint before continuing.

"Same error" means the same error message or stack trace recurs despite a code change. Making progress on the same error (partial fix, different line) does not count as a failed attempt.

## Checkpoint Output

When the trigger condition is met, stop and write:

```
Debug Checkpoint — {error summary}

What the error is:
  {error message or stack trace excerpt}

What's been tried:
  1. {approach 1} — {result}
  2. {approach 2} — {result}
  3. {approach 3} — {result}

Current hypothesis:
  {best guess at root cause}

What I need from you:
  {specific question or information that would unblock this}
```

Then wait for the user to respond before continuing.

## After the Checkpoint

Apply the new direction and continue debugging.

## When This Does NOT Apply

- The user has explicitly said "keep trying" or "figure it out"

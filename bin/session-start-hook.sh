#!/usr/bin/env bash
# SessionStart hook — detects sprint continuation signals and active sprints.
# Non-blocking (observation only). Injects context via additionalContext.
set -euo pipefail
# Fail open: any unexpected error exits cleanly rather than crashing into
# a hook error that disrupts session startup.
trap 'exit 0' ERR

# Read hook input from stdin (not used for decisions, but available)
INPUT=$(cat)

CONTEXT=""

# Check for sprint continuation signal
if [[ -f ".sprint-continuation.md" ]]; then
  CONTEXT="CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution."
fi

# Check for active sprint
if [[ -f "SPRINT.md" ]]; then
  # Strip \r to handle CRLF line endings (Windows git checkout).
  STATUS=$(sed -n 's/.*\*\*Status:\*\* \([^ ]*\).*/\1/p' SPRINT.md 2>/dev/null | tr -d '\r' | head -1)
  if [[ "$STATUS" == "in-progress" ]]; then
    if [[ -n "$CONTEXT" ]]; then
      CONTEXT="$CONTEXT Active sprint detected — read SPRINT.md for current state."
    else
      CONTEXT="Active sprint detected — read SPRINT.md for current state."
    fi
  fi
fi

# Output JSON if we have context to inject
if [[ -n "$CONTEXT" ]]; then
  # Escape for JSON
  ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\n/\\n/g')
  printf '{"hookSpecificOutput":{"additionalContext":"%s"}}' "$ESCAPED"
fi

exit 0

#!/usr/bin/env bash
# StopFailure hook — logs API errors and preserves sprint state for recovery.
# Non-blocking (observation only). Creates continuation signal if sprint is active.
set -euo pipefail
# Fail open: any unexpected error exits cleanly rather than crashing into
# a hook error. This hook is observation-only; silent failure is safe.
trap 'exit 0' ERR

# Read hook input from stdin
INPUT=$(cat)

# Extract error message
ERROR_MSG=$(printf '%s' "$INPUT" | sed -n 's/.*"error_message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [[ -z "$ERROR_MSG" ]]; then
  ERROR_MSG="unknown error"
fi

# Check for active sprint
SPRINT_ACTIVE=false
if [[ -f "SPRINT.md" ]]; then
  # Strip \r to handle CRLF line endings (Windows git checkout).
  STATUS=$(sed -n 's/.*\*\*Status:\*\* \([^ ]*\).*/\1/p' SPRINT.md 2>/dev/null | tr -d '\r' | head -1)
  if [[ "$STATUS" == "in-progress" ]]; then
    SPRINT_ACTIVE=true
  fi
fi

# If sprint is active, log error and create continuation signal
if [[ "$SPRINT_ACTIVE" == "true" ]]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%S")
  echo "[$TIMESTAMP] StopFailure: $ERROR_MSG" >> .sprint-errors.log
  touch .sprint-continue-signal
fi

exit 0

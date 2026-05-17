#!/usr/bin/env bash
# SessionStart hook — detects an active sprint and injects a one-line
# context reminder so a resumed session reads SPRINT.md early.
# Non-blocking (observation only). Injects context via additionalContext.
set -euo pipefail
# Fail open: any unexpected error exits cleanly rather than crashing into
# a hook error that disrupts session startup.
trap 'exit 0' ERR

# Read hook input from stdin (not used for decisions, but available)
INPUT=$(cat)

CONTEXT=""

# Detect active sprint
if [[ -f "SPRINT.md" ]]; then
  # Strip \r to handle CRLF line endings (Windows git checkout).
  STATUS=$(sed -n 's/.*\*\*Status:\*\* \([^ ]*\).*/\1/p' SPRINT.md 2>/dev/null | tr -d '\r' | head -1)
  if [[ "$STATUS" == "in-progress" ]]; then
    CONTEXT="Active sprint detected — read SPRINT.md for current state."
  fi
fi

# Output JSON if we have context to inject
if [[ -n "$CONTEXT" ]]; then
  if command -v jq >/dev/null 2>&1; then
    jq -c -n --arg ctx "$CONTEXT" '{hookSpecificOutput: {additionalContext: $ctx}}'
  fi
fi

exit 0

#!/usr/bin/env bash
# sprint-stop-guard.sh — Stop hook that enforces sprint continuation.
#
# Fires when Claude tries to end its turn. If an active sprint has remaining
# todo items and no legitimate stop reason exists, blocks the stop and directs
# Claude to continue with the next item.
#
# Legitimate stop reasons (hook allows stop):
#   - No SPRINT.md or sprint not in-progress
#   - All items done (COMPLETE phase — human reviews before archive)
#   - Any item is blocked (BLOCKED state — human resolves)
#   - .sprint-human-checkpoint exists (REWORK or other explicit checkpoint)
#   - .context-usage has should_cycle=true (context cycling needed)
#   - .sprint-continue-signal exists (cycling already in progress)
#
# Configured in .claude/settings.json:
#   "hooks": {
#     "Stop": [{
#       "type": "command",
#       "command": "bash .claude/scripts/sprint-stop-guard.sh"
#     }]
#   }
#
# Input: JSON on stdin with hook_event_name, stop_hook_active, last_assistant_message.
# Output: JSON with decision "block" and reason when blocking.
# Exit 0 = block the stop. Exit 2 = allow the stop.

set -euo pipefail

SPRINT_FILE="SPRINT.md"

# --- Check 1: No SPRINT.md → allow stop ---
if [ ! -f "$SPRINT_FILE" ]; then
  exit 2
fi

# Require jq for JSON output. Without it, fail open (allow stop).
if ! command -v jq >/dev/null 2>&1; then
  exit 2
fi

# --- Check 2: Sprint status must be "in-progress" → otherwise allow stop ---
sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "$SPRINT_FILE" 2>/dev/null || echo "")
if [ "$sprint_status" != "in-progress" ]; then
  exit 2
fi

# --- Check 3: .sprint-human-checkpoint exists → allow stop (explicit checkpoint) ---
if [ -f ".sprint-human-checkpoint" ]; then
  exit 2
fi

# --- Check 4: .context-usage says should_cycle → allow stop ---
if [ -f ".context-usage" ]; then
  should_cycle=$(jq -r '.should_cycle // false' ".context-usage" 2>/dev/null || echo "false")
  if [ "$should_cycle" = "true" ]; then
    exit 2
  fi
fi

# --- Check 5: .sprint-continue-signal exists → allow stop (cycling in progress) ---
if [ -f ".sprint-continue-signal" ]; then
  exit 2
fi

# --- Check 6: Any item blocked → allow stop ---
if grep -qE '\| *blocked *\|' "$SPRINT_FILE" 2>/dev/null; then
  exit 2
fi

# --- Check 7: Count todo items ---
todo_count="$(grep -cE '\| *todo *\|' "$SPRINT_FILE" || true)"

if [ "$todo_count" -eq 0 ]; then
  # All items done — COMPLETE phase, human reviews before archive.
  exit 2
fi

# --- Sprint is in-progress with todo items and no legitimate stop reason. Block. ---

# Find the first todo item ID to direct Claude.
next_item=$(grep -E '\| *todo *\|' "$SPRINT_FILE" | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}')

jq -n \
  --arg item "$next_item" \
  --argjson count "$todo_count" \
  '{
    decision: "block",
    reason: ("Sprint S1 is in-progress with " + ($count | tostring) + " pending item(s). Execute " + $item + " now. Read the spec for this item, update the task to in_progress, create the feature branch, and begin implementation.")
  }'

exit 0

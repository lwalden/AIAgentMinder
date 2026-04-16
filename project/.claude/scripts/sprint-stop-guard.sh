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
# Exit 0 = allow the stop (no block JSON on stdout).
# Exit 0 + JSON {"decision":"block",...} on stdout = block the stop.
# NOTE: For Stop hooks, non-zero exit codes are treated as errors by Claude Code.
# Do NOT use exit 2 here — it causes "Stop hook error" to appear in the UI,
# which Claude responds to, creating an infinite loop.

set -euo pipefail
# Fail open: any unexpected error allows the stop rather than crashing into
# a non-zero exit code that causes Claude Code to show "Stop hook error".
trap 'exit 0' ERR

SPRINT_FILE="SPRINT.md"

# --- Check 0: stop_hook_active → allow stop (break recursion) ---
# When Claude Code sends stop_hook_active=true it means a Stop hook is already
# blocking this session. We must allow the stop here to prevent an infinite loop.
input=$(cat 2>/dev/null || true)
if [ -n "$input" ]; then
  stop_hook_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
  if [ "$stop_hook_active" = "true" ]; then
    exit 0
  fi
fi

# --- Check 1: No SPRINT.md → allow stop ---
if [ ! -f "$SPRINT_FILE" ]; then
  exit 0
fi

# Require jq for JSON output. Without it, fail open (allow stop).
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

# --- Check 2: Sprint status must be "in-progress" → otherwise allow stop ---
# Strip \r to handle CRLF line endings (Windows git checkout).
sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' || echo "")
if [ "$sprint_status" != "in-progress" ]; then
  exit 0
fi

# --- Check 3: .sprint-human-checkpoint exists → allow stop (explicit checkpoint) ---
if [ -f ".sprint-human-checkpoint" ]; then
  exit 0
fi

# --- Check 4: .context-usage says should_cycle → allow stop ---
if [ -f ".context-usage" ]; then
  should_cycle=$(jq -r '.should_cycle // false' ".context-usage" 2>/dev/null || echo "false")
  if [ "$should_cycle" = "true" ]; then
    exit 0
  fi
fi

# --- Check 5: .sprint-continue-signal exists → allow stop (cycling in progress) ---
if [ -f ".sprint-continue-signal" ]; then
  exit 0
fi

# --- Check 6: Any item blocked → allow stop ---
if grep -qE '\| *blocked *\|' "$SPRINT_FILE" 2>/dev/null; then
  exit 0
fi

# --- Check 7: Count unfinished items (todo + in-progress) ---
todo_count="$(grep -cE '\| *todo *\|' "$SPRINT_FILE" || true)"
inprog_count="$(grep -cE '\| *in-progress *\|' "$SPRINT_FILE" || true)"
unfinished=$((todo_count + inprog_count))

if [ "$unfinished" -eq 0 ]; then
  # All items done — COMPLETE phase, human reviews before archive.
  exit 0
fi

# --- Sprint is in-progress with unfinished items and no legitimate stop reason. Block. ---

sprint_id=$(sed -n 's/^\*\*Sprint:\*\* \(S[0-9]*\).*/\1/p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1 || echo "")
[ -z "$sprint_id" ] && sprint_id="sprint"
current_phase=$(sed -n 's/^\*\*Phase:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1 || echo "")

# Build a specific message based on what's unfinished
if [ "$inprog_count" -gt 0 ]; then
  current_item=$(grep -E '\| *in-progress *\|' "$SPRINT_FILE" | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}')
  reason="Sprint $sprint_id${current_phase:+ ($current_phase phase)} has $current_item in-progress. Complete it or mark as blocked before stopping."
else
  next_item=$(grep -E '\| *todo *\|' "$SPRINT_FILE" | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}')
  reason="Sprint $sprint_id${current_phase:+ ($current_phase phase)} has $todo_count pending item(s). Execute $next_item now. Read the spec, update status to in_progress, create the branch, and begin."
fi

jq -n --arg reason "$reason" '{ decision: "block", reason: $reason }'

exit 0

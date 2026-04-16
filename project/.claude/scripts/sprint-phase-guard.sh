#!/usr/bin/env bash
# sprint-phase-guard.sh — PreToolUse hook that enforces sprint phase ordering
# and periodically reinforces critical rules.
#
# Phase-skip guard (2a): When the Agent tool is called, checks subagent_type
# against the current sprint phase. Blocks phase agents that don't match.
#
# Rule reinforcement (2d): Every Nth tool call, injects a phase-appropriate
# one-line reminder via stdout to combat rules-drift in long sessions.
#
# No-op when: no SPRINT.md, sprint not in-progress, no **Phase:** line.
#
# Configured in .claude/settings.json as a second PreToolUse entry
# (runs after context-cycle-hook.sh).

set -euo pipefail
trap 'exit 0' ERR

SPRINT_FILE="SPRINT.md"
COUNTER_FILE=".sprint-phase-guard-count"
REMINDER_INTERVAL=20

input=$(cat)

# --- Preconditions: sprint must be active ---

if [ ! -f "$SPRINT_FILE" ]; then
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
if [ "$sprint_status" != "in-progress" ]; then
  exit 0
fi

# Read current phase. No Phase line = no enforcement (backwards compat).
current_phase=$(sed -n 's/^\*\*Phase:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
if [ -z "$current_phase" ]; then
  exit 0
fi

tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"' 2>/dev/null)

# --- 2d: Periodic rule reinforcement ---

count=0
[ -f "$COUNTER_FILE" ] && count=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
count=$((count + 1))
echo "$count" > "$COUNTER_FILE"

if [ $((count % REMINDER_INTERVAL)) -eq 0 ]; then
  current_item=$(grep -E '\| *in-progress *\|' "$SPRINT_FILE" 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' || true)
  case "$current_phase" in
    PLAN)     echo "REMINDER: PLAN phase. Propose sprint items via sprint-planner. Do not write code." ;;
    SPEC)     echo "REMINDER: SPEC phase. Write implementation specs via sprint-speccer. Do not write code yet.${current_item:+ Item: $current_item}" ;;
    EXECUTE)  echo "REMINDER: EXECUTE phase. TDD: write tests first, then implement.${current_item:+ Item: $current_item}" ;;
    TEST)     echo "REMINDER: TEST phase. Review lenses are READ-ONLY. Do not edit source files.${current_item:+ Item: $current_item}" ;;
    REVIEW)   echo "REMINDER: REVIEW phase. Run pr-pipeliner: build, lint, test, merge.${current_item:+ Item: $current_item}" ;;
    COMPLETE) echo "REMINDER: Sprint complete. Run sprint-retro and present results." ;;
  esac
fi

# --- 2a: Phase-skip guard (Agent tool calls only) ---

if [ "$tool_name" != "Agent" ]; then
  exit 0
fi

subagent_type=$(echo "$input" | jq -r '.tool_input.subagent_type // "general-purpose"' 2>/dev/null)

# Session profiles and utility agents are always allowed
case "$subagent_type" in
  dev|debug|hotfix|qa|general-purpose|Explore|Plan) exit 0 ;;
esac

# Phase → allowed agents mapping
allowed=""
case "$current_phase" in
  PLAN)     allowed="sprint-planner" ;;
  SPEC)     allowed="sprint-speccer" ;;
  APPROVE)  allowed="" ;;
  EXECUTE)  allowed="item-executor" ;;
  TEST)     allowed="security-reviewer performance-reviewer api-reviewer cost-reviewer ux-reviewer quality-reviewer" ;;
  REVIEW)   allowed="pr-pipeliner" ;;
  COMPLETE) allowed="sprint-retro" ;;
  *)        exit 0 ;;
esac

for agent in $allowed; do
  if [ "$subagent_type" = "$agent" ]; then
    exit 0
  fi
done

cat <<EOF
BLOCKED — Sprint phase violation.

Current phase: $current_phase
Attempted agent: $subagent_type
Allowed agents for $current_phase: ${allowed:-"(none — human checkpoint phase)"}

Update the sprint phase before advancing:
  bash .claude/scripts/sprint-update.sh phase <NEXT_PHASE>

Phase order: PLAN → SPEC → APPROVE → EXECUTE → TEST → REVIEW → COMPLETE
EOF
exit 2

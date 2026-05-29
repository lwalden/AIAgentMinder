#!/usr/bin/env bash
# sprint-phase-guard.sh — PreToolUse hook (matcher: "Agent") that enforces
# sprint phase ordering. Blocks Agent calls whose subagent_type does not
# match the current sprint phase.
#
# No-op when: no SPRINT.md, sprint not in-progress, no **Phase:** line.
#
# Periodic phase reminders are handled separately by
# bin/sprint-phase-reminder.sh on the Stop event — keep this script
# single-purpose so it can stay cheap and Agent-scoped.

set -euo pipefail
trap 'exit 0' ERR

SPRINT_FILE="SPRINT.md"

input=$(cat)

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

current_phase=$(sed -n 's/^\*\*Phase:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
if [ -z "$current_phase" ]; then
  exit 0
fi

# Defensive: only act on Agent tool (the hook is registered with matcher
# "Agent", but check anyway in case the registration is overridden).
tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"' 2>/dev/null)
if [ "$tool_name" != "Agent" ]; then
  exit 0
fi

subagent_type=$(echo "$input" | jq -r '.tool_input.subagent_type // "general-purpose"' 2>/dev/null)

# Strip any plugin namespace prefix: marketplace installs dispatch agents as
# "aiagentminder:item-executor"; direct `claude --agent` uses bare names. The
# allow-lists below are bare, so normalize both forms to the bare name.
subagent_type="${subagent_type##*:}"

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
  sprint-update.sh phase <NEXT_PHASE>

Phase order: PLAN → SPEC → APPROVE → EXECUTE → TEST → REVIEW → COMPLETE
EOF
exit 2

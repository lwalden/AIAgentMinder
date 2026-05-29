#!/usr/bin/env bash
# sprint-phase-reminder.sh — Stop hook that injects a one-line, phase-
# appropriate reminder during an active sprint. Replaces the periodic
# reminder logic that used to live inside sprint-phase-guard.sh (which is
# now Agent-scoped and single-purpose).
#
# Fires once per assistant turn (Stop event) while a sprint is in-progress
# and SPRINT.md declares a Phase. No counter file, no every-Nth gating —
# the reminder is one line and shows up near a natural decision point.

set -euo pipefail
trap 'exit 0' ERR

SPRINT_FILE="SPRINT.md"

[ -f "$SPRINT_FILE" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
[ "$sprint_status" = "in-progress" ] || exit 0

current_phase=$(sed -n 's/^\*\*Phase:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
[ -n "$current_phase" ] || exit 0

current_item=$(grep -E '\| *in-progress *\|' "$SPRINT_FILE" 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' || true)
item_suffix=""
[ -n "$current_item" ] && item_suffix=" Item: $current_item"

case "$current_phase" in
  PLAN)     msg="REMINDER: PLAN phase. Propose sprint items via sprint-planner. Do not write code." ;;
  SPEC)     msg="REMINDER: SPEC phase. Write implementation specs via sprint-speccer. Do not write code yet.${item_suffix}" ;;
  EXECUTE)  msg="REMINDER: EXECUTE phase. TDD: write tests first, then implement.${item_suffix}" ;;
  TEST)     msg="REMINDER: TEST phase. Review lenses are READ-ONLY. Do not edit source files.${item_suffix}" ;;
  REVIEW)   msg="REMINDER: REVIEW phase. Run pr-pipeliner: build, lint, test, merge.${item_suffix}" ;;
  COMPLETE) msg="REMINDER: Sprint complete. Run sprint-retro and present results." ;;
  *)        exit 0 ;;
esac

jq -c -n --arg msg "$msg" '{hookSpecificOutput: {additionalContext: $msg}}'
exit 0

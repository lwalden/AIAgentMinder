#!/bin/bash
# sprint-metrics.sh — Sprint metrics collection for retrospectives.
# Writes .sprint-metrics.json incrementally during a sprint.
#
# Usage:
#   bash .claude/scripts/sprint-metrics.sh init <sprint-id>
#   bash .claude/scripts/sprint-metrics.sh item-start <item-id>
#   bash .claude/scripts/sprint-metrics.sh item-complete <item-id>
#   bash .claude/scripts/sprint-metrics.sh cycle <item-id>
#   bash .claude/scripts/sprint-metrics.sh rework <item-id>
#   bash .claude/scripts/sprint-metrics.sh finalize

METRICS_FILE=".sprint-metrics.json"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -Iseconds)

die() { echo "Error: $1" >&2; exit 1; }

[ $# -ge 1 ] || die "Usage: sprint-metrics.sh <init|item-start|item-complete|cycle|rework|finalize> [args]"

subcmd="$1"
shift

# All commands except init require jq and the metrics file
if [ "$subcmd" != "init" ]; then
  command -v jq >/dev/null 2>&1 || die "jq is required for sprint-metrics.sh"
  [ -f "$METRICS_FILE" ] || die ".sprint-metrics.json not found — run 'sprint-metrics.sh init <sprint-id>' first"
fi

case "$subcmd" in
  init)
    [ $# -eq 1 ] || die "Usage: sprint-metrics.sh init <sprint-id>"
    sprint_id="$1"
    cat > "$METRICS_FILE" <<ENDJSON
{
  "sprintId": "${sprint_id}",
  "startedAt": "${NOW}",
  "completedAt": null,
  "items": [],
  "totals": {
    "planned": 0,
    "completed": 0,
    "rework": 0,
    "blocked": 0,
    "scopeChanges": 0,
    "contextCycles": 0
  }
}
ENDJSON
    ;;

  item-start)
    [ $# -eq 1 ] || die "Usage: sprint-metrics.sh item-start <item-id>"
    item_id="$1"

    # Check if item already exists
    if command -v jq >/dev/null 2>&1; then
      exists=$(jq -r --arg id "$item_id" '.items[] | select(.id == $id) | .id' "$METRICS_FILE")
      if [ -n "$exists" ]; then
        # Item already started — skip
        exit 0
      fi
      # Add new item and increment planned count
      jq --arg id "$item_id" --arg ts "$NOW" '
        .items += [{"id": $id, "startedAt": $ts, "completedAt": null, "contextCycles": 0, "reviewFindings": 0, "reworkCount": 0}]
        | .totals.planned += 1
      ' "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    else
      die "jq is required for sprint-metrics.sh"
    fi
    ;;

  item-complete)
    [ $# -eq 1 ] || die "Usage: sprint-metrics.sh item-complete <item-id>"
    item_id="$1"

    jq --arg id "$item_id" --arg ts "$NOW" '
      if (.items | any(.id == $id)) then
        .items = [.items[] | if .id == $id then .completedAt = $ts else . end]
        | .totals.completed += 1
      else . end
    ' "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    ;;

  cycle)
    [ $# -eq 1 ] || die "Usage: sprint-metrics.sh cycle <item-id>"
    item_id="$1"

    jq --arg id "$item_id" '
      if (.items | any(.id == $id)) then
        .items = [.items[] | if .id == $id then .contextCycles += 1 else . end]
        | .totals.contextCycles += 1
      else . end
    ' "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    ;;

  rework)
    [ $# -eq 1 ] || die "Usage: sprint-metrics.sh rework <item-id>"
    item_id="$1"

    jq --arg id "$item_id" '
      if (.items | any(.id == $id)) then
        .items = [.items[] | if .id == $id then .reworkCount += 1 else . end]
        | .totals.rework += 1
      else . end
    ' "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    ;;

  finalize)
    jq --arg ts "$NOW" '
      .completedAt = $ts
      | .totals.completed = ([.items[] | select(.completedAt != null)] | length)
      | .totals.planned = (.items | length)
    ' "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    ;;

  *)
    die "Unknown subcommand '${subcmd}'"
    ;;
esac

#!/bin/bash
# sprint-update.sh — Zero-token-cost SPRINT.md table updater.
# Mechanically updates table cells so the LLM doesn't burn tokens on file I/O.
#
# Usage:
#   sprint-update.sh postmerge <issue-id> <value>
#   sprint-update.sh sprint-status <value>
#   sprint-update.sh phase <value>
#
# Examples:
#   sprint-update.sh postmerge S1-002 pass
#   sprint-update.sh sprint-status in-progress
#   sprint-update.sh phase EXECUTE
#
# Per-item status (in_progress/completed/blocked) is tracked via native Tasks
# (TaskUpdate), not SPRINT.md. The status subcommand has been removed.

SPRINT_FILE="SPRINT.md"

die() { echo "Error: $1" >&2; exit 1; }

if [ $# -lt 1 ]; then
  die "Usage: sprint-update.sh <postmerge|sprint-status|phase> [issue-id] <value>"
fi

subcmd="$1"
shift

[ -f "$SPRINT_FILE" ] || die "SPRINT.md not found in current directory"

case "$subcmd" in
  postmerge)
    [ $# -ge 2 ] || die "Usage: sprint-update.sh postmerge <issue-id> <value>"
    issue_id="$1"
    shift
    # Join remaining args to support "pending: some description"
    new_value="$*"

    if ! grep -q "^| *${issue_id} *|" "$SPRINT_FILE"; then
      die "Issue '${issue_id}' not found in SPRINT.md"
    fi

    awk -v id="$issue_id" -v val="$new_value" '
    BEGIN { FS="|"; OFS="|" }
    {
      trimmed = $2
      gsub(/^ +| +$/, "", trimmed)
      if (trimmed == id) {
        # Replace field 6 (Post-Merge column in 5-column table: ID|Title|Type|Risk|Post-Merge)
        $6 = " " val " "
      }
      print
    }
    ' "$SPRINT_FILE" > "${SPRINT_FILE}.tmp" && mv "${SPRINT_FILE}.tmp" "$SPRINT_FILE"
    ;;

  sprint-status)
    [ $# -eq 1 ] || die "Usage: sprint-update.sh sprint-status <value>"
    new_value="$1"

    if ! grep -q '^\*\*Status:\*\*' "$SPRINT_FILE"; then
      die "Sprint status line not found in SPRINT.md"
    fi

    awk -v val="$new_value" '
    /^\*\*Status:\*\*/ { print "**Status:** " val; next }
    { print }
    ' "$SPRINT_FILE" > "${SPRINT_FILE}.tmp" && mv "${SPRINT_FILE}.tmp" "$SPRINT_FILE"
    ;;

  phase)
    [ $# -eq 1 ] || die "Usage: sprint-update.sh phase <value>"
    new_value="$1"

    if grep -q '^\*\*Phase:\*\*' "$SPRINT_FILE"; then
      awk -v val="$new_value" '
      /^\*\*Phase:\*\*/ { print "**Phase:** " val; next }
      { print }
      ' "$SPRINT_FILE" > "${SPRINT_FILE}.tmp" && mv "${SPRINT_FILE}.tmp" "$SPRINT_FILE"
    else
      # Insert Phase line after Status line (first occurrence)
      awk -v val="$new_value" '
      /^\*\*Status:\*\*/ && !done { print; print "**Phase:** " val; done=1; next }
      { print }
      ' "$SPRINT_FILE" > "${SPRINT_FILE}.tmp" && mv "${SPRINT_FILE}.tmp" "$SPRINT_FILE"
    fi
    ;;

  *)
    die "Unknown subcommand '${subcmd}'. Usage: sprint-update.sh <postmerge|sprint-status|phase> [issue-id] <value>"
    ;;
esac

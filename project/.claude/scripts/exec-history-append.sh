#!/bin/bash
# exec-history-append.sh — Append current .exec/status.md snapshot to .exec/history.md.
# Zero-token-cost audit trail for the dispatch contract.
#
# Usage:
#   bash .claude/scripts/exec-history-append.sh [label]
#
# The optional label is prepended to the header (e.g., "directive dispatched", "status: blocked").
# If omitted, the script reads status + phase from the status file frontmatter.
#
# Called by sprint-master after each status file write. The agent writes status.md
# (small, ~20 lines); this script handles only the append-to-history operation.

EXEC_DIR=".exec"
STATUS_FILE="$EXEC_DIR/status.md"
HISTORY_FILE="$EXEC_DIR/history.md"

[ -d "$EXEC_DIR" ] || exit 0
[ -f "$STATUS_FILE" ] || exit 0

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ -n "$1" ]; then
  label="$1"
else
  status=$(sed -n 's/^status: *//p' "$STATUS_FILE" | head -1 | tr -d '\r')
  phase=$(sed -n 's/^current_phase: *//p' "$STATUS_FILE" | head -1 | tr -d '\r')
  label="status: ${status:-unknown}${phase:+, phase: $phase}"
fi

{
  echo ""
  echo "## $TIMESTAMP — $label"
  echo ""
  cat "$STATUS_FILE"
} >> "$HISTORY_FILE"

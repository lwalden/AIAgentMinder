#!/bin/bash
# decisions-log.sh — Zero-token-cost DECISIONS.md entry appender.
# Mechanically adds a formatted decision entry so the LLM doesn't burn tokens on file I/O.
#
# Usage:
#   bash .claude/scripts/decisions-log.sh "Title" "X over Y" "reason" "cost"
#
# Arguments (positional, all required):
#   $1 — title
#   $2 — chose (what was chosen over alternatives)
#   $3 — why (rationale)
#   $4 — tradeoff (what was given up)
#
# The entry is inserted above the "## Known Debt" section, following the existing format.

DECISIONS_FILE="DECISIONS.md"

die() { echo "Error: $1" >&2; exit 1; }

if [ $# -lt 4 ]; then
  die "Usage: decisions-log.sh <title> <chose> <why> <tradeoff>"
fi

TITLE="$1"
CHOSE="$2"
WHY="$3"
TRADEOFF="$4"

[ -n "$TITLE" ]    || die "title is required"
[ -n "$CHOSE" ]    || die "chose is required"
[ -n "$WHY" ]      || die "why is required"
[ -n "$TRADEOFF" ] || die "tradeoff is required"
[ -f "$DECISIONS_FILE" ] || die "DECISIONS.md not found in current directory"

# Build the entry
DATE=$(date +%Y-%m)
ENTRY="### ${TITLE} | ${DATE} | Status: Active

Chose: ${CHOSE}. Why: ${WHY}. Tradeoff: ${TRADEOFF}.

---"

# Insert above "## Known Debt" section using ENVIRON to avoid C-escape interpretation
if grep -q '^## Known Debt' "$DECISIONS_FILE"; then
  ENTRY="$ENTRY" awk '
    BEGIN { entry = ENVIRON["ENTRY"] }
    /^## Known Debt/ {
      print entry
      print ""
    }
    { print }
  ' "$DECISIONS_FILE" > "${DECISIONS_FILE}.tmp" && mv "${DECISIONS_FILE}.tmp" "$DECISIONS_FILE"
else
  # No Known Debt section — append to end
  printf '\n%s\n' "$ENTRY" >> "$DECISIONS_FILE"
fi

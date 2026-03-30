#!/bin/bash
# backlog-capture.sh — Zero-token-cost BACKLOG.md manager.
# Mechanically manages backlog items so the LLM doesn't burn tokens on file I/O.
#
# Usage:
#   bash .claude/scripts/backlog-capture.sh add <type> <title> [source]
#   bash .claude/scripts/backlog-capture.sh list [--type=<type>]
#   bash .claude/scripts/backlog-capture.sh promote <id>
#   bash .claude/scripts/backlog-capture.sh detail <id> <text>
#   bash .claude/scripts/backlog-capture.sh count [--type=<type>]
#
# Types: defect, feature, spike, chore
#
# Examples:
#   bash .claude/scripts/backlog-capture.sh add feature "Auto-detect monorepo" "spike research"
#   bash .claude/scripts/backlog-capture.sh list --type=defect
#   bash .claude/scripts/backlog-capture.sh promote B-003
#   bash .claude/scripts/backlog-capture.sh detail B-002 "Spike showed 3 repos with workspaces."
#   bash .claude/scripts/backlog-capture.sh count

BACKLOG_FILE="BACKLOG.md"
VALID_TYPES="defect|feature|spike|chore"

die() { echo "Error: $1" >&2; exit 1; }

# Validate B-NNN format to prevent regex injection in grep patterns
validate_id() {
  echo "$1" | grep -qE '^B-[0-9]{3}$' || die "Invalid ID format '${1}'. Expected B-NNN (e.g., B-001)"
}

if [ $# -lt 1 ]; then
  die "Usage: backlog-capture.sh <add|list|promote|detail|count> [args...]"
fi

subcmd="$1"
shift

# Get the next B-NNN ID by finding the highest existing one
next_id() {
  local last
  last=$(grep -o 'B-[0-9]\+' "$BACKLOG_FILE" 2>/dev/null | sed 's/B-//' | sort -n | tail -1)
  if [ -z "$last" ]; then
    echo "B-001"
  else
    # Guard against corrupt ID values
    if ! echo "$last" | grep -qE '^[0-9]+$'; then
      die "Corrupt ID sequence in BACKLOG.md"
    fi
    printf "B-%03d" $((10#$last + 1))
  fi
}

# Extract title for an ID from the table
get_title() {
  local id="$1"
  grep "^| *${id} *|" "$BACKLOG_FILE" | awk -F'|' '{ gsub(/^ +| +$/, "", $4); print $4 }'
}

case "$subcmd" in
  add)
    [ $# -ge 2 ] || die "Usage: backlog-capture.sh add <type> <title> [source]"

    item_type="$1"
    title="$2"
    source="${3:-session}"

    # Validate type
    if ! echo "$item_type" | grep -qE "^(${VALID_TYPES})$"; then
      die "Invalid type '${item_type}'. Must be one of: defect, feature, spike, chore"
    fi

    # Sanitize pipe characters to prevent table breakage
    title="${title//|/-}"
    source="${source//|/-}"

    [ -f "$BACKLOG_FILE" ] || die "BACKLOG.md not found in current directory"

    new_id=$(next_id)
    today=$(date +%Y-%m-%d)

    # Append row to the table (after the last table row or separator line)
    printf '| %s | %s | %s | %s | %s |\n' "$new_id" "$item_type" "$title" "$source" "$today" >> "$BACKLOG_FILE"

    echo "Added ${new_id}: ${item_type} — ${title}" >&2
    echo "$new_id"
    ;;

  list)
    [ -f "$BACKLOG_FILE" ] || die "BACKLOG.md not found in current directory"

    type_filter=""
    if [ $# -ge 1 ]; then
      type_filter=$(echo "$1" | sed -n 's/^--type=//p')
    fi

    if [ -n "$type_filter" ]; then
      grep "^| *B-" "$BACKLOG_FILE" | awk -F'|' -v t="$type_filter" '{
        typ = $3; gsub(/^ +| +$/, "", typ)
        if (typ == t) print $0
      }'
    else
      grep "^| *B-" "$BACKLOG_FILE" || true
    fi
    ;;

  promote)
    [ $# -eq 1 ] || die "Usage: backlog-capture.sh promote <id>"
    item_id="$1"
    validate_id "$item_id"

    [ -f "$BACKLOG_FILE" ] || die "BACKLOG.md not found in current directory"

    if ! grep -q "^| *${item_id} *|" "$BACKLOG_FILE"; then
      die "Item '${item_id}' not found in BACKLOG.md"
    fi

    # Print the row to stdout
    grep "^| *${item_id} *|" "$BACKLOG_FILE"

    # Remove the row and any detail section in a single awk pass
    awk -v id="$item_id" '
    BEGIN { FS="|"; skip = 0 }
    /^### / {
      if (index($0, "### " id ":") == 1) { skip = 1; next }
      else { skip = 0 }
    }
    {
      trimmed = $2; gsub(/^ +| +$/, "", trimmed)
      if (trimmed == id) next
      if (!skip) print
    }
    ' "$BACKLOG_FILE" > "${BACKLOG_FILE}.tmp" && mv "${BACKLOG_FILE}.tmp" "$BACKLOG_FILE"
    ;;

  detail)
    [ $# -ge 2 ] || die "Usage: backlog-capture.sh detail <id> <text>"
    item_id="$1"
    validate_id "$item_id"
    shift
    detail_text="$*"

    [ -f "$BACKLOG_FILE" ] || die "BACKLOG.md not found in current directory"

    if ! grep -q "^| *${item_id} *|" "$BACKLOG_FILE"; then
      die "Item '${item_id}' not found in BACKLOG.md"
    fi

    title=$(get_title "$item_id")

    # Append detail section at the end of the file
    printf '\n### %s: %s\n\n%s\n' "$item_id" "$title" "$detail_text" >> "$BACKLOG_FILE"
    ;;

  count)
    [ -f "$BACKLOG_FILE" ] || die "BACKLOG.md not found in current directory"

    type_filter=""
    if [ $# -ge 1 ]; then
      type_filter=$(echo "$1" | sed -n 's/^--type=//p')
    fi

    count=0
    if [ -n "$type_filter" ]; then
      count=$(grep "^| *B-" "$BACKLOG_FILE" 2>/dev/null | awk -F'|' -v t="$type_filter" '{
        typ = $3; gsub(/^ +| +$/, "", typ)
        if (typ == t) c++
      } END { print c+0 }')
    else
      count=$(grep -c "^| *B-" "$BACKLOG_FILE" 2>/dev/null || true)
    fi
    echo "${count:-0}"
    ;;

  *)
    die "Unknown subcommand '${subcmd}'. Usage: backlog-capture.sh <add|list|promote|detail|count> [args...]"
    ;;
esac

#!/usr/bin/env bash
# ADR-006 HLPM ping -- writes a session-boundary event to the HLPM
# event log so HLPM's SessionStart summarizer can report "what happened
# while you were away" grouped by consumer repo.
#
# Called by SessionStart (startup matcher) and SessionEnd hooks with the
# event name as $1 (session_start | session_end).
#
# Opt-in: this script is a no-op unless the user explicitly sets the
# HLPM_DIR environment variable to the absolute path of their HLPM
# checkout (e.g. `export HLPM_DIR=/Users/me/src/highest-level-project-management`).
# Without HLPM_DIR set, exit silently — most AAM users don't have HLPM.
#
# Silent fail in four cases:
#   - HLPM_DIR not set (most users)
#   - HLPM_DIR set but the directory doesn't exist
#   - HLPM_PING_DISABLED=1 environment variable set (per-session opt-out)
#   - Running inside HLPM itself (HLPM uses its own hlpm-log-session-end.sh)
set -euo pipefail
trap 'exit 0' ERR

EVENT="${1:-}"
[[ -n "$EVENT" ]] || exit 0

[[ "${HLPM_PING_DISABLED:-0}" == "1" ]] && exit 0

HLPM_DIR="${HLPM_DIR:-}"
[[ -n "$HLPM_DIR" ]] || exit 0
[[ -d "$HLPM_DIR" ]] || exit 0

LOG_FILE="$HLPM_DIR/events.jsonl"
MAX_LINES=10000

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
REPO=$(basename "$REPO_ROOT")

# HLPM has its own session-end marker writer; skip here to avoid duplicates.
[[ "$REPO" == "highest-level-project-management" ]] && exit 0

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
EVENT_JSON=$(printf '{"ts":"%s","repo":"%s","event":"%s","branch":"%s"}' "$TS" "$REPO" "$EVENT" "$BRANCH")

# Inline trim-on-append (mirrors hlpm-log-append.sh in HLPM).
if [[ -f "$LOG_FILE" ]]; then
  CURRENT=$(wc -l < "$LOG_FILE" 2>/dev/null | tr -d ' ' || echo 0)
  if [[ "$CURRENT" -ge "$MAX_LINES" ]]; then
    KEEP=$((MAX_LINES - 1))
    tail -n "$KEEP" "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null && mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

printf '%s\n' "$EVENT_JSON" >> "$LOG_FILE"
exit 0

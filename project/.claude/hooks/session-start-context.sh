#!/usr/bin/env bash
# Hook: SessionStart — Inject current context after compaction
# After context compaction or session resume, injects the current PROGRESS.md
# and DECISIONS.md content back into Claude's context so Claude stays oriented
# without the user needing to re-prompt.
#
# Only injects on 'compact' and 'resume' events (not fresh 'startup').
# Outputs content to stdout which Claude reads as context.
#
# Configured in .claude/settings.json under hooks.SessionStart

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"' 2>/dev/null)

# Only inject context on compact or resume — fresh startups get it from CLAUDE.md protocol
if [ "$SOURCE" != "compact" ] && [ "$SOURCE" != "resume" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

OUTPUT=""

# Inject PROGRESS.md if it exists
if [ -f "$PROJECT_DIR/PROGRESS.md" ]; then
  PROGRESS_CONTENT=$(cat "$PROJECT_DIR/PROGRESS.md")
  OUTPUT="${OUTPUT}--- PROGRESS.md (current state) ---
${PROGRESS_CONTENT}
"
fi

# Inject DECISIONS.md if it exists and has content beyond the template header
if [ -f "$PROJECT_DIR/DECISIONS.md" ]; then
  DECISION_LINES=$(wc -l < "$PROJECT_DIR/DECISIONS.md" | tr -d ' ')
  if [ "$DECISION_LINES" -gt 10 ]; then
    DECISIONS_CONTENT=$(cat "$PROJECT_DIR/DECISIONS.md")
    OUTPUT="${OUTPUT}
--- DECISIONS.md (architectural decisions) ---
${DECISIONS_CONTENT}
"
  fi
fi

if [ -n "$OUTPUT" ]; then
  echo "$OUTPUT"
fi

exit 0

#!/usr/bin/env bash
# Hook: Stop — Auto-update PROGRESS.md timestamp
# Appends a "Last session ended" timestamp to PROGRESS.md after every session.
# Token-free, always-runs, no Claude involvement needed.
#
# Configured in .claude/settings.json under hooks.Stop

set -euo pipefail

# Find PROGRESS.md relative to project root
PROGRESS_FILE="${CLAUDE_PROJECT_DIR:-.}/PROGRESS.md"

if [ ! -f "$PROGRESS_FILE" ]; then
  exit 0
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# Update the "Last Updated" line in PROGRESS.md
if grep -q '^\*\*Last Updated:\*\*' "$PROGRESS_FILE" 2>/dev/null; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^\*\*Last Updated:\*\*.*/\*\*Last Updated:\*\* $TIMESTAMP/" "$PROGRESS_FILE"
  else
    sed -i "s/^\*\*Last Updated:\*\*.*/\*\*Last Updated:\*\* $TIMESTAMP/" "$PROGRESS_FILE"
  fi
fi

exit 0

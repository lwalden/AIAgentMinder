#!/usr/bin/env bash
# Hook: Stop — Auto git commit on session end
# Creates an automatic checkpoint commit when Claude finishes a session.
# Captures all changes (tracked and untracked) so no work is lost.
#
# Configured in .claude/settings.json under hooks.Stop

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

# Only commit if we're in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  # Nothing to commit
  exit 0
fi

# Stage all changes
git add -A

# Create checkpoint commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
git commit -m "auto: session checkpoint ($TIMESTAMP) [$BRANCH]" --no-verify >/dev/null 2>&1 || true

exit 0

#!/usr/bin/env bash
# Hook: PostToolUse — Auto-format/lint after file edits
# Runs project linters/formatters on files after Claude writes or edits them.
# Detects available tools (prettier, eslint, black, rustfmt, dotnet format, etc.)
# and runs the appropriate one. Skips silently if no formatter is found.
#
# Configured in .claude/settings.json under hooks.PostToolUse (matcher: Write|Edit)

set -euo pipefail

# Read hook input from stdin to get the file path
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

# Get file extension
EXT="${FILE_PATH##*.}"

# Try to run the appropriate formatter based on file type and available tools
case "$EXT" in
  js|jsx|ts|tsx|css|scss|json|md|html|yaml|yml)
    # Try prettier first, then eslint --fix
    if [ -f "node_modules/.bin/prettier" ]; then
      npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true
    elif [ -f "node_modules/.bin/eslint" ]; then
      npx eslint --fix "$FILE_PATH" >/dev/null 2>&1 || true
    elif command -v prettier >/dev/null 2>&1; then
      prettier --write "$FILE_PATH" >/dev/null 2>&1 || true
    fi
    ;;
  py)
    # Try black, then ruff format
    if command -v black >/dev/null 2>&1; then
      black --quiet "$FILE_PATH" 2>/dev/null || true
    elif command -v ruff >/dev/null 2>&1; then
      ruff format "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  rs)
    if command -v rustfmt >/dev/null 2>&1; then
      rustfmt "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  go)
    if command -v gofmt >/dev/null 2>&1; then
      gofmt -w "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  cs|fs|vb)
    # .NET format requires a project/solution context
    if command -v dotnet >/dev/null 2>&1; then
      dotnet format --include "$FILE_PATH" >/dev/null 2>&1 || true
    fi
    ;;
esac

exit 0

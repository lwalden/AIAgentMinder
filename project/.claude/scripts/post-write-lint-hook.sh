#!/bin/bash
# post-write-lint-hook.sh — PostToolUse hook that auto-formats source files after Write/Edit.
# Fail-open: always exits 0 to avoid blocking on formatter errors.
# Detects project language and runs the appropriate formatter.

INPUT=$(cat)

# Extract file path from tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty' 2>/dev/null)

if [[ -z "$FILE_PATH" ]] || [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Detect language and format accordingly
case "$FILE_PATH" in
  # C# — dotnet format
  *.cs)
    if command -v dotnet >/dev/null 2>&1; then
      timeout 10 dotnet format --include "$FILE_PATH" --verbosity quiet 2>/dev/null
    fi
    ;;

  # TypeScript/JavaScript — prettier or eslint
  *.ts|*.tsx|*.js|*.jsx)
    if command -v prettier >/dev/null 2>&1; then
      timeout 10 prettier --write "$FILE_PATH" 2>/dev/null
    elif [ -x ./node_modules/.bin/prettier ]; then
      timeout 10 ./node_modules/.bin/prettier --write "$FILE_PATH" 2>/dev/null
    fi
    ;;

  # Python — ruff or black
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      timeout 10 ruff format "$FILE_PATH" 2>/dev/null
    elif command -v black >/dev/null 2>&1; then
      timeout 10 black --quiet "$FILE_PATH" 2>/dev/null
    fi
    ;;

  # Go — gofmt
  *.go)
    if command -v gofmt >/dev/null 2>&1; then
      timeout 10 gofmt -w "$FILE_PATH" 2>/dev/null
    fi
    ;;

  # Rust — rustfmt
  *.rs)
    if command -v rustfmt >/dev/null 2>&1; then
      timeout 10 rustfmt "$FILE_PATH" 2>/dev/null
    fi
    ;;
esac

# Always exit 0 (fail-open) regardless of format result
exit 0

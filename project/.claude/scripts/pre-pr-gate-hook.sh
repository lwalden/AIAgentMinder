#!/bin/bash
# pre-pr-gate-hook.sh — PreToolUse hook that enforces quality gates.
#
# Hard gate: Blocks PR creation (gh pr create / mcp github create_pull_request)
#            unless .quality-gate-pass marker exists and is fresh (< 30 min).
#
# Soft gate: Warns on git commit (except [ai-fix] review-cycle commits)
#            if .tests-passed marker is absent.
#
# Exit codes:
#   0 = allow (tool call proceeds)
#   2 = block (tool call rejected, message sent to Claude)

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only process Bash tool calls
if [[ "$TOOL_NAME" != "Bash" ]] || [[ -z "$COMMAND" ]]; then
  exit 0
fi

MARKER_FILE=".quality-gate-pass"
TESTS_MARKER=".tests-passed"
STALENESS_SECONDS=1800  # 30 minutes

# --- Hard Gate: Block PR creation without quality gate pass ---

if echo "$COMMAND" | grep -qE '(gh pr create|mcp__github__create_pull_request)'; then
  if [[ ! -f "$MARKER_FILE" ]]; then
    echo '{"decision": "block", "reason": "Quality gate has not passed this session. Run /aam-quality-gate first."}' >&2
    exit 2
  fi

  # Check staleness
  MARKER_AGE=$(( $(date +%s) - $(stat -c %Y "$MARKER_FILE" 2>/dev/null || echo 0) ))
  if [[ "$MARKER_AGE" -gt "$STALENESS_SECONDS" ]]; then
    echo '{"decision": "block", "reason": "Quality gate pass is stale (>30 min). Re-run /aam-quality-gate."}' >&2
    exit 2
  fi

  # Check structured review result if available
  REVIEW_FILE=".quality-review-result.json"
  if [[ -f "$REVIEW_FILE" ]]; then
    DECISION=$(jq -r '.decision // empty' "$REVIEW_FILE" 2>/dev/null)
    if [[ "$DECISION" == "block" ]]; then
      CRITICAL=$(jq -r '.critical // 0' "$REVIEW_FILE" 2>/dev/null)
      HIGH=$(jq -r '.high // 0' "$REVIEW_FILE" 2>/dev/null)
      echo "{\"decision\": \"block\", \"reason\": \"Quality review blocked: $CRITICAL critical, $HIGH high findings. Fix before creating PR.\"}" >&2
      exit 2
    fi
  fi

  # All checks passed
  exit 0
fi

# --- Soft Gate: Warn on git commit without test pass ---

if echo "$COMMAND" | grep -qE '^git commit'; then
  # Skip warning for review-cycle fix commits
  if echo "$COMMAND" | grep -qE '\[ai-fix\]'; then
    exit 0
  fi

  if [[ ! -f "$TESTS_MARKER" ]]; then
    # Soft warning via additionalContext (not a block)
    echo '{"additionalContext": "Warning: Tests have not been verified this session. Run the test suite before committing to ensure quality."}' >&2
    exit 0
  fi
fi

# Default: allow
exit 0

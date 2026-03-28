#!/usr/bin/env bash
# context-cycle-hook.sh — PreToolUse hook that enforces context cycling.
#
# When .context-usage says should_cycle=true, this hook BLOCKS tool calls
# (exit 2) except for Bash and Write, which are needed to execute the
# CONTEXT_CYCLE procedure (commit work, write continuation file, self-terminate).
#
# This replaces the voluntary "check at NEXT transitions" rule with involuntary
# enforcement — the agent cannot ignore it because blocked tools fail.
#
# Configured in .claude/settings.json:
#   "hooks": {
#     "PreToolUse": [{
#       "type": "command",
#       "command": "bash .claude/scripts/context-cycle-hook.sh"
#     }]
#   }
#
# Input: JSON on stdin with tool_name, tool_input fields (from Claude Code hooks protocol).
# Output: stdout message shown to Claude. Exit 0 = allow, exit 2 = block.

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Locate .context-usage relative to the project root.
# The hook runs from the project root (cwd), so look there first.
USAGE_FILE=".context-usage"

# If .context-usage doesn't exist, nothing to enforce — allow everything.
if [ ! -f "$USAGE_FILE" ]; then
  exit 0
fi

# Parse should_cycle from the file. Requires jq.
if ! command -v jq >/dev/null 2>&1; then
  # Can't check without jq — fail open (allow).
  exit 0
fi

should_cycle=$(jq -r '.should_cycle // false' "$USAGE_FILE" 2>/dev/null)

# If cycling not needed, allow everything.
if [ "$should_cycle" != "true" ]; then
  exit 0
fi

# --- Cycling IS needed. Determine whether to block this tool call. ---

# Extract the tool name from hook input.
tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"' 2>/dev/null)

# Allow tools needed for the CONTEXT_CYCLE procedure itself:
#   Bash  — git commit, running context-cycle.sh
#   Write — .sprint-continuation.md, .sprint-continue-signal
#   Read  — reading SPRINT.md/specs to write the continuation file
case "$tool_name" in
  Bash|Write|Read)
    # Allow through, but still warn.
    used_tokens=$(jq -r '.used_tokens // "unknown"' "$USAGE_FILE" 2>/dev/null)
    threshold=$(jq -r '.threshold // "unknown"' "$USAGE_FILE" 2>/dev/null)
    echo "CONTEXT CYCLE OVERDUE — $used_tokens tokens used (threshold: $threshold). Execute CONTEXT_CYCLE protocol now. These tool calls are only allowed for cycle steps (commit, write continuation, terminate)."
    exit 0
    ;;
esac

# Block all other tools with a clear directive.
used_tokens=$(jq -r '.used_tokens // "unknown"' "$USAGE_FILE" 2>/dev/null)
threshold=$(jq -r '.threshold // "unknown"' "$USAGE_FILE" 2>/dev/null)
used_pct=$(jq -r '.used_pct // "unknown"' "$USAGE_FILE" 2>/dev/null)

cat <<EOF
BLOCKED — CONTEXT CYCLE REQUIRED

Context usage: $used_tokens tokens ($used_pct%) — threshold was $threshold tokens.
This tool call ($tool_name) is blocked until you complete the CONTEXT_CYCLE protocol.

You MUST do the following NOW (only Bash, Write, and Read are allowed):
1. Commit all uncommitted work (Bash: git add + git commit)
2. Write .sprint-continuation.md with resume state (Write)
3. Write .sprint-continue-signal as empty file (Write)
4. Run: bash .claude/scripts/context-cycle.sh (Bash)

Do NOT attempt to continue sprint work. Every non-cycle tool call will be blocked.
EOF
exit 2

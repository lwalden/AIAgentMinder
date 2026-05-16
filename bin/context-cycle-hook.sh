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
#       "command": "context-cycle-hook.sh"
#     }]
#   }
#
# Input: JSON on stdin with tool_name, tool_input fields (from Claude Code hooks protocol).
# Output: stdout message shown to Claude. Exit 0 = allow, exit 2 = block.

set -euo pipefail
# Fail open: any unexpected error allows the tool call rather than crashing
# into an exit-1 error code that blocks the tool unexpectedly.
trap 'exit 0' ERR

# Read hook input from stdin
input=$(cat)

# Locate .context-usage relative to the project root.
# The hook runs from the project root (cwd), so look there first.
USAGE_FILE=".context-usage"

# If .context-usage doesn't exist, use a tool-call counter as a fallback.
# This covers projects where the status line isn't producing .context-usage
# (e.g. older installs, misconfigured shell, or non-CLI environments).
if [ ! -f "$USAGE_FILE" ]; then
  # Only apply fallback when a sprint is actively in-progress.
  SPRINT_FILE="SPRINT.md"
  if [ -f "$SPRINT_FILE" ] && command -v jq >/dev/null 2>&1; then
    sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "$SPRINT_FILE" 2>/dev/null | tr -d '\r' | head -1)
    if [ "$sprint_status" = "in-progress" ]; then
      COUNTER_FILE=".sprint-tool-count"
      count=0
      [ -f "$COUNTER_FILE" ] && count=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
      count=$((count + 1))
      echo "$count" > "$COUNTER_FILE"
      if [ "$count" -gt 150 ]; then
        # Extract tool_name (already parsed below, but we need it here too)
        tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"' 2>/dev/null)
        case "$tool_name" in
          Bash|Write|Read)
            echo "CONTEXT CYCLE OVERDUE — $count tool calls logged (no status line data; fallback threshold: 150). Execute CONTEXT_CYCLE protocol now. Only Bash, Write, and Read are allowed."
            exit 0
            ;;
        esac
        cat <<EOF
BLOCKED — CONTEXT CYCLE REQUIRED (fallback: $count tool calls, no status line data)

No .context-usage file found. The status line hook may not be running.
This tool call ($tool_name) is blocked. Execute the CONTEXT_CYCLE protocol now
(only Bash, Write, and Read are allowed):

1. Commit all uncommitted work (Bash: git add + git commit)
2. Type /exit to end the session cleanly

The SessionEnd hook will build the continuation file automatically.
Do NOT manually write .sprint-continuation.md.
EOF
        exit 2
      fi
    fi
  fi
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

# --- Cycling IS needed. ---

# F4: sprint-state gating. The cycle protocol is sprint-orchestration
# machinery — it is only meaningful while a sprint is actively running. For
# non-sprint sessions (no SPRINT.md, archive-only SPRINT.md, or status !=
# in-progress) we emit a soft advisory and exit 0 instead of blocking. This
# mirrors the fallback path's behavior and prevents the hook from firing
# during creative/dev work in template-consuming downstream repos.
sprint_active=false
if [ -f "SPRINT.md" ]; then
  sprint_status=$(sed -n 's/^\*\*Status:\*\* //p' "SPRINT.md" 2>/dev/null | tr -d '\r' | head -1)
  if [ "$sprint_status" = "in-progress" ]; then
    sprint_active=true
  fi
fi

used_tokens=$(jq -r '.used_tokens // "unknown"' "$USAGE_FILE" 2>/dev/null)
threshold=$(jq -r '.threshold // "unknown"' "$USAGE_FILE" 2>/dev/null)
used_pct=$(jq -r '.used_pct // "unknown"' "$USAGE_FILE" 2>/dev/null)

if [ "$sprint_active" != "true" ]; then
  echo "Context approaching threshold — $used_tokens tokens used ($used_pct%, threshold $threshold). No active sprint detected; cycle protocol does not apply. Consider /exit when convenient to start a fresh session."
  exit 0
fi

# --- Sprint IS active. Determine whether to block this tool call. ---

tool_name=$(echo "$input" | jq -r '.tool_name // "unknown"' 2>/dev/null)

# F5: allow Edit alongside Bash/Write/Read. Edit is functionally equivalent
# to Write for in-flight files; blocking it forces Bash-via-script
# workarounds (e.g. python file rewrites) that are riskier than the cycle
# protocol they bypass. The cycle protocol's purpose is preventing *new
# exploration* — finalization edits to already-known files are safe.
case "$tool_name" in
  Bash|Write|Read|Edit)
    echo "CONTEXT CYCLE OVERDUE — $used_tokens tokens used (threshold: $threshold). Execute CONTEXT_CYCLE protocol now. These tool calls are only allowed for cycle steps (commit, finalize edits, write continuation, terminate)."
    exit 0
    ;;
esac

# Block all other tools with a clear directive.
cat <<EOF
BLOCKED — CONTEXT CYCLE REQUIRED

Context usage: $used_tokens tokens ($used_pct%) — threshold was $threshold tokens.
This tool call ($tool_name) is blocked until you complete the CONTEXT_CYCLE protocol.

You MUST do the following NOW (only Bash, Write, Read, and Edit are allowed):
1. Commit all uncommitted work (Bash: git add + git commit)
2. Type /exit to end the session cleanly

The SessionEnd hook will build the continuation file automatically.
Do NOT manually write .sprint-continuation.md.
Do NOT attempt to continue sprint work. Every non-cycle tool call will be blocked.
EOF
exit 2

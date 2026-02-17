#!/usr/bin/env bash
# Hook: PreToolUse — Guard against risky Bash commands
# Auto-approves common safe commands (git status, git log, etc.) and blocks
# dangerous patterns (rm -rf, git push --force, etc.).
# Reduces permission prompts for safe operations while enforcing governance.
#
# Exit behavior:
#   - stdout JSON with permissionDecision "allow" → auto-approve (no prompt)
#   - stdout JSON with permissionDecision "deny" → block with reason
#   - exit 0 with no JSON → fall through to normal permission handling
#
# Configured in .claude/settings.json under hooks.PreToolUse (matcher: Bash)

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# ── Deny list: dangerous patterns that should never run ──
# These match the governance deny list in settings.json but catch more variants
DENY_PATTERNS=(
  'rm\s+-rf\s+/'
  'rm\s+-rf\s+~'
  'rm\s+-rf\s+\$HOME'
  'rm\s+-rf\s+C:'
  'rm\s+-rf\s+\.'
  'git\s+push\s+--force'
  'git\s+push\s+-f\b'
  'git\s+reset\s+--hard\s+origin'
  'git\s+clean\s+-fd'
  'chmod\s+-R\s+777'
  '>\s*/dev/sd'
  'mkfs\.'
  'dd\s+if=.*of=/dev'
  ':()\s*\{\s*:\|:\s*&\s*\}'
)

for PATTERN in "${DENY_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$PATTERN" 2>/dev/null; then
    # Output structured deny decision
    jq -n \
      --arg reason "Blocked by governance hook: command matches dangerous pattern ($PATTERN)" \
      '{
        "hookSpecificOutput": {
          "hookEventName": "PreToolUse",
          "permissionDecision": "deny",
          "permissionDecisionReason": $reason
        }
      }'
    exit 0
  fi
done

# ── Allow list: safe read-only commands that don't need prompts ──
SAFE_PATTERNS=(
  '^git\s+status'
  '^git\s+log'
  '^git\s+diff'
  '^git\s+branch'
  '^git\s+show'
  '^git\s+remote\s+-v'
  '^git\s+stash\s+list'
  '^gh\s+pr\s+list'
  '^gh\s+pr\s+view'
  '^gh\s+pr\s+status'
  '^gh\s+issue\s+list'
  '^gh\s+issue\s+view'
  '^ls\b'
  '^pwd$'
  '^cat\s'
  '^head\s'
  '^tail\s'
  '^wc\s'
  '^date$'
  '^which\s'
  '^echo\s'
  '^grep\s'
  '^find\s'
  '^diff\s'
  '^jq\s'
  '^sort\s'
  '^env$'
)

for PATTERN in "${SAFE_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$PATTERN" 2>/dev/null; then
    # Auto-approve safe commands
    jq -n '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "permissionDecisionReason": "Auto-approved: safe read-only command"
      }
    }'
    exit 0
  fi
done

# For everything else, fall through to normal permission handling
exit 0

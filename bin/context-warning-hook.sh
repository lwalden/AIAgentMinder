#!/usr/bin/env bash
# context-warning-hook.sh — Stop hook that warns when context usage has
# crossed the cycling threshold. Replaces the v5.0 auto-cycle protocol.
#
# Design: passive suggestion only. We never restart the session, write
# continuation files, or block tool calls. The user decides whether to
# wrap up via `/aiagentminder:handoff` or keep going. Because this fires
# on Stop and re-checks each turn, the reminder repeats until the user
# wraps up or context settles below threshold.
#
# Dormant when:
#   - .context-usage absent (e.g. Claude Code web, no status line)
#   - should_cycle != true
#   - jq missing

set -euo pipefail
trap 'exit 0' ERR

USAGE_FILE=".context-usage"
[ -f "$USAGE_FILE" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

should_cycle=$(jq -r '.should_cycle // false' "$USAGE_FILE" 2>/dev/null)
[ "$should_cycle" = "true" ] || exit 0

used_tokens=$(jq -r '.used_tokens // 0' "$USAGE_FILE" 2>/dev/null)
threshold=$(jq -r '.threshold // 0' "$USAGE_FILE" 2>/dev/null)
used_pct=$(jq -r '.used_pct // 0' "$USAGE_FILE" 2>/dev/null)

MSG=$(cat <<EOF
⚠ Context over threshold — ${used_tokens} tokens used (~${used_pct}%, threshold ${threshold}).

Two paths:
  • Wrap up cleanly: run /aiagentminder:handoff, commit any work, then /exit. Start the next session and say "resume work".
  • Keep going: just continue. This reminder will repeat each turn while you're over threshold.
EOF
)

jq -c -n --arg msg "$MSG" '{hookSpecificOutput: {additionalContext: $msg}}'
exit 0

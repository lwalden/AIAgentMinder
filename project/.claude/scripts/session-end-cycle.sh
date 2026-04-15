#!/usr/bin/env bash
# session-end-cycle.sh — SessionEnd hook. Writes .sprint-continuation.md
# when the session is ending under context-cycle pressure.
#
# Reads hook input JSON on stdin. The SessionEnd hook receives a "reason"
# field (clear | resume | logout | prompt_input_exit | bypass_permissions_disabled | other).
# We don't care about the reason for the cycle decision — we care only whether
# .context-usage says should_cycle=true at the moment of exit. If yes, build
# a continuation file from external state (git + SPRINT.md + tasks) and drop
# the signal file that sprint-runner.ps1 or the profile prompt hook watches for.
#
# Must be FAST (no network, no heavy work) and must never block the exit.
#
# Configured in .claude/settings.json:
#   "hooks": { "SessionEnd": [{ "matcher": "", "hooks": [{ "type": "command",
#              "command": "bash .claude/scripts/session-end-cycle.sh" }] }] }

set -euo pipefail

# Consume stdin (hook input) but we don't need to parse it for this hook —
# the decision is based purely on .context-usage state.
input=$(cat 2>/dev/null || true)
: "$input"

USAGE_FILE=".context-usage"
CONT_FILE=".sprint-continuation.md"
SIGNAL_FILE=".sprint-continue-signal"

# No usage file = no cycle in progress = silent exit
if [ ! -f "$USAGE_FILE" ]; then
  exit 0
fi

# Need jq to parse should_cycle
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

should_cycle=$(jq -r '.should_cycle // false' "$USAGE_FILE" 2>/dev/null || echo "false")
if [ "$should_cycle" != "true" ]; then
  # Normal exit, not a cycle. Leave no trace.
  exit 0
fi

# --- Cycle IS in progress. Build continuation from external state. ---

used_tokens=$(jq -r '.used_tokens // "unknown"' "$USAGE_FILE" 2>/dev/null || echo unknown)
used_pct=$(jq -r '.used_pct // "unknown"' "$USAGE_FILE" 2>/dev/null || echo unknown)
threshold=$(jq -r '.threshold // "unknown"' "$USAGE_FILE" 2>/dev/null || echo unknown)
model=$(jq -r '.model // "unknown"' "$USAGE_FILE" 2>/dev/null || echo unknown)

timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo "unknown")
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
head_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
git_status=$(git status --short 2>/dev/null || echo "(no git)")
recent_commits=$(git log --oneline -10 2>/dev/null || echo "(no history)")

sprint_block="(no SPRINT.md)"
if [ -f "SPRINT.md" ]; then
  sprint_block=$(cat SPRINT.md)
fi

# Task state (native Claude Code tasks live under ~/.claude/tasks/<project>)
# We don't know the exact path here, so just note its existence.
task_note="(task store not inspected by this hook — TaskList in the next session will show them)"

cat > "$CONT_FILE" <<EOF
# Sprint Continuation State

**Generated:** $timestamp
**Reason:** context cycle ($used_tokens tokens used at $used_pct%, threshold $threshold, model $model)
**Branch:** $branch
**HEAD:** $head_sha

## Working tree status at cycle time

\`\`\`
$git_status
\`\`\`

## Recent commits (last 10)

\`\`\`
$recent_commits
\`\`\`

## Sprint state (from SPRINT.md)

$sprint_block

## Tasks

$task_note

## Resume instructions

1. Read this file for the outside view of where work left off.
2. Run \`TaskList\` to see native task state — that is the authoritative in-progress list.
3. If mid-sprint (SPRINT.md shows \`in-progress\`), continue from the first \`todo\` item per the sprint-workflow rule.
4. If the prior session committed mid-step, inspect the HEAD commit to see how far that step got before deciding whether to advance or rework.
5. Delete \`$CONT_FILE\` and \`$SIGNAL_FILE\` once resumption is complete (the SessionStart hook already does this — this is a backup instruction for manual recovery).
EOF

# Drop the signal file. Its mere existence tells sprint-runner / profile hook
# to re-launch claude after this process exits.
: > "$SIGNAL_FILE"

exit 0

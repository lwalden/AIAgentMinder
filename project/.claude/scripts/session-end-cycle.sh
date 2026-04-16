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
sprint_phase=""
sprint_id=""
current_item=""
current_item_title=""
if [ -f "SPRINT.md" ]; then
  sprint_block=$(cat SPRINT.md)
  sprint_phase=$(sed -n 's/^\*\*Phase:\*\* //p' SPRINT.md 2>/dev/null | tr -d '\r' | head -1)
  sprint_id=$(sed -n 's/^\*\*Sprint:\*\* \(S[0-9]*\).*/\1/p' SPRINT.md 2>/dev/null | tr -d '\r' | head -1)
  # Find the current item: first in-progress, or first todo
  current_item=$(grep -E '\| *in-progress *\|' SPRINT.md 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' || true)
  current_item_title=$(grep -E '\| *in-progress *\|' SPRINT.md 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $3); print $3}' || true)
  if [ -z "$current_item" ]; then
    current_item=$(grep -E '\| *todo *\|' SPRINT.md 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' || true)
    current_item_title=$(grep -E '\| *todo *\|' SPRINT.md 2>/dev/null | head -1 | awk -F'|' '{gsub(/^ +| +$/, "", $3); print $3}' || true)
  fi
fi

# Dispatch state
dispatch_id=""
dispatch_scope=""
if [ -f ".exec/directive.md" ]; then
  dispatch_id=$(sed -n 's/^directive_id: *//p' ".exec/directive.md" 2>/dev/null | tr -d '\r' | head -1)
  dispatch_scope=$(sed -n '/^# Scope/,/^# /{ /^# Scope/d; /^# /d; p; }' ".exec/directive.md" 2>/dev/null | head -3)
fi

# Task state
task_note="(task store not inspected by this hook — TaskList in the next session will show them)"

cat > "$CONT_FILE" <<EOF
# Sprint Continuation State

**Generated:** $timestamp
**Reason:** context cycle ($used_tokens tokens used at $used_pct%, threshold $threshold, model $model)
**Branch:** $branch
**HEAD:** $head_sha

## Quick Resume

- **Sprint:** ${sprint_id:-"(none)"}
- **Phase:** ${sprint_phase:-"(unknown)"}
- **Current item:** ${current_item:-"(none)"}${current_item_title:+ — $current_item_title}
- **Item status:** $([ -n "$current_item" ] && grep -E "\\| *${current_item} *\\|" SPRINT.md 2>/dev/null | awk -F'|' '{gsub(/^ +| +$/, "", $6); print $6}' || echo "(none)")
- **Dispatch:** ${dispatch_id:-"(not dispatched)"}

## Next Action

$(if [ -n "$sprint_phase" ] && [ -n "$current_item" ]; then
  case "$sprint_phase" in
    PLAN)     echo "Resume PLAN phase. Complete sprint-planner, then present plan for approval." ;;
    SPEC)     echo "Resume SPEC phase for $current_item. Write implementation spec, then present for approval." ;;
    EXECUTE)  echo "Resume EXECUTE phase for $current_item ($current_item_title). Check HEAD commit to see how far implementation got. Continue TDD cycle." ;;
    TEST)     echo "Resume TEST phase for $current_item. Run review lenses (read-only), then quality-reviewer judge pass." ;;
    REVIEW)   echo "Resume REVIEW phase for $current_item. Run pr-pipeliner: build, lint, test, merge." ;;
    COMPLETE) echo "Resume COMPLETE phase. Run sprint-retro and present results." ;;
    *)        echo "Resume from $sprint_phase phase, item $current_item." ;;
  esac
elif [ -n "$sprint_phase" ]; then
  echo "Resume from $sprint_phase phase. Check SPRINT.md for item statuses."
else
  echo "Check SPRINT.md and TaskList to determine resume point."
fi)

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
EOF

# Drop the signal file. Its mere existence tells sprint-runner / profile hook
# to re-launch claude after this process exits.
: > "$SIGNAL_FILE"

exit 0

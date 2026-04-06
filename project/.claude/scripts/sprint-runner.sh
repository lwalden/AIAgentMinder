#!/usr/bin/env bash
# sprint-runner.sh — Runs Claude in a loop with automatic context cycling.
#
# When Claude detects context pressure mid-sprint, it writes state files and
# self-terminates. This wrapper catches the exit, waits briefly, and starts
# a fresh Claude instance with a continuation prompt.
#
# Usage:
#   ./sprint-runner.sh
#   ./sprint-runner.sh "plan and start a sprint for phase 2"
#   ./sprint-runner.sh "resume sprint" --permission-mode acceptEdits
#   ./sprint-runner.sh "" --agent dev

set -euo pipefail

CONT_FILE=".sprint-continuation.md"
SIGNAL_FILE=".sprint-continue-signal"
AGENT="sprint-master"
INITIAL_PROMPT="${1:-}"
shift 2>/dev/null || true

# Parse --agent flag from extra args
EXTRA_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --agent)
            AGENT="${2:-sprint-master}"
            shift 2
            ;;
        *)
            EXTRA_ARGS+=("$1")
            shift
            ;;
    esac
done

# Clean stale signals from a previous crashed cycle
if [ -f "$SIGNAL_FILE" ]; then
    echo "Cleaning stale cycle signal from previous session..."
    rm -f "$SIGNAL_FILE"
fi

CYCLE=0

while true; do
    CYCLE=$((CYCLE + 1))

    if [ -f "$CONT_FILE" ]; then
        RESUME_PROMPT="CONTEXT CYCLE: Read $CONT_FILE and resume sprint execution. CLAUDE.md and rules load automatically. Focus on sprint state recovery from the continuation file."
        echo ""
        echo "=== Context Cycle $CYCLE — Resuming sprint with fresh context ==="
        claude --agent "$AGENT" "${EXTRA_ARGS[@]}" "$RESUME_PROMPT" || true
    elif [ -n "$INITIAL_PROMPT" ] && [ "$CYCLE" -eq 1 ]; then
        echo "=== Starting sprint session ==="
        claude --agent "$AGENT" "${EXTRA_ARGS[@]}" "$INITIAL_PROMPT" || true
    else
        if [ "$CYCLE" -eq 1 ]; then
            echo "=== Sprint session ready (context cycling enabled) ==="
        else
            echo ""
            echo "=== Context Cycle $CYCLE — Fresh session ==="
        fi
        claude --agent "$AGENT" "${EXTRA_ARGS[@]}" || true
    fi

    # After Claude exits, check for continuation signal
    if [ -f "$SIGNAL_FILE" ]; then
        rm -f "$SIGNAL_FILE"
        echo ""
        echo "=== Context pressure detected — cycling session ==="
        echo "Environment preserved. Fresh instance starting in 3 seconds..."
        sleep 3
        continue
    fi

    # Normal exit — clean up and stop
    if [ -f "$CONT_FILE" ]; then
        rm -f "$CONT_FILE"
    fi
    echo ""
    echo "=== Sprint session ended ==="
    break
done

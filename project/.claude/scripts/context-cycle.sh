#!/usr/bin/env bash
# context-cycle.sh — Self-termination script for Claude Code context cycling.
# Called by Claude when context pressure warrants a fresh session.
#
# How it works:
#   1. Traces from the current bash shell up the process tree
#   2. Finds the parent claude/claude.exe (CLI) process
#   3. Kills it
#   4. The parent shell gets its prompt back
#   5. The shell prompt hook or sprint-runner catches the signal file
#      and starts a new Claude instance with the continuation prompt.
#
# Prerequisites:
#   - .sprint-continuation.md and .sprint-continue-signal already written
#   - Either the profile hook or sprint-runner set up to catch the restart
#
# Cross-platform: Windows (Git Bash), macOS, Linux.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Verify state files exist before killing anything
if [ ! -f "$PROJECT_DIR/.sprint-continuation.md" ]; then
    echo "ERROR: .sprint-continuation.md not found in $PROJECT_DIR" >&2
    echo "Write the continuation file before calling context-cycle.sh" >&2
    exit 1
fi

if [ ! -f "$PROJECT_DIR/.sprint-continue-signal" ]; then
    echo "ERROR: .sprint-continue-signal not found in $PROJECT_DIR" >&2
    echo "Write the signal file before calling context-cycle.sh" >&2
    exit 1
fi

# --- Platform-specific PID tracing ---

find_claude_pid_windows() {
    # Git Bash on Windows: use /proc/$$/winpid + WMI
    local BASH_WINPID
    BASH_WINPID=$(cat /proc/$$/winpid 2>/dev/null) || return 1

    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
        \$current = $BASH_WINPID
        for (\$i = 0; \$i -lt 15; \$i++) {
            \$proc = Get-CimInstance Win32_Process -Filter \"ProcessId=\$current\" -ErrorAction SilentlyContinue
            if (-not \$proc) { break }
            if (\$proc.Name -eq 'claude.exe' -and \$proc.ExecutablePath -like '*\.local*') {
                Write-Output \$current
                exit 0
            }
            \$current = \$proc.ParentProcessId
        }
        exit 1
    " 2>/dev/null | tr -d '\r\n'
}

find_claude_pid_unix() {
    # macOS / Linux: trace ppid chain using ps
    local current=$$
    for _ in $(seq 1 15); do
        local ppid
        ppid=$(ps -o ppid= -p "$current" 2>/dev/null | tr -d ' ') || return 1
        [ -z "$ppid" ] && return 1
        [ "$ppid" = "0" ] && return 1

        # Check if the parent process is claude
        local pname
        pname=$(ps -o comm= -p "$ppid" 2>/dev/null | tr -d ' ') || return 1

        if [[ "$pname" == "claude" || "$pname" == "claude.exe" ]]; then
            echo "$ppid"
            return 0
        fi
        current="$ppid"
    done
    return 1
}

# Detect platform and find Claude PID
CLAUDE_PID=""
if [ -f /proc/$$/winpid ] 2>/dev/null; then
    # Windows (Git Bash)
    CLAUDE_PID=$(find_claude_pid_windows) || true
else
    # macOS / Linux
    CLAUDE_PID=$(find_claude_pid_unix) || true
fi

if [ -z "$CLAUDE_PID" ]; then
    echo "ERROR: Could not find claude in process ancestry" >&2
    echo "Context cycle aborted — state files are preserved. Restart manually:" >&2
    echo "  claude \"CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution.\"" >&2
    exit 1
fi

echo "Context cycle: terminating Claude CLI (PID $CLAUDE_PID)..."
echo "Fresh session will start automatically via profile hook or sprint-runner."

# Kill the Claude process. This terminates our parent — we become orphaned.
# The signal file tells the restart mechanism to pick up.
if [ -f /proc/$$/winpid ] 2>/dev/null; then
    taskkill //PID "$CLAUDE_PID" //F > /dev/null 2>&1
else
    kill -9 "$CLAUDE_PID" 2>/dev/null || true
fi

# If we get here, the kill may not have taken effect yet.
sleep 2
exit 0

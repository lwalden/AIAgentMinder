#!/usr/bin/env bash
# context-cycle.sh — Self-termination script for Claude Code context cycling.
# Called by Claude when context pressure warrants a fresh session.
#
# How it works:
#   1. Traces from the current bash shell's Windows PID up the process tree
#   2. Finds the parent claude.exe (CLI) process
#   3. Kills it with taskkill
#   4. The parent shell (pwsh) gets its prompt back
#   5. The PowerShell prompt hook or sprint-runner.ps1 catches the signal file
#      and starts a new Claude instance with the continuation prompt.
#
# Prerequisites:
#   - Windows with PowerShell available
#   - .sprint-continuation.md and .sprint-continue-signal already written
#   - Either the profile hook or sprint-runner.ps1 set up to catch the restart
#
# Cross-platform: Windows only (Git Bash on Windows). macOS/Linux TBD.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

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

# Get the persistent bash shell's Windows PID
BASH_WINPID=$(cat /proc/$$/winpid 2>/dev/null)
if [ -z "$BASH_WINPID" ]; then
    echo "ERROR: Could not read /proc/\$\$/winpid — not running in Git Bash on Windows?" >&2
    exit 1
fi

# Trace up the process tree to find claude.exe
# Uses PowerShell + WMI since we're on Windows
CLAUDE_PID=$(powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
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
" 2>/dev/null | tr -d '\r\n')

if [ -z "$CLAUDE_PID" ]; then
    echo "ERROR: Could not find claude.exe in process ancestry" >&2
    echo "The process trace from bash PID $BASH_WINPID did not reach a Claude CLI process." >&2
    echo "Context cycle aborted — state files are preserved. Restart manually:" >&2
    echo "  claude \"CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution.\"" >&2
    exit 1
fi

echo "Context cycle: terminating Claude CLI (PID $CLAUDE_PID)..."
echo "Fresh session will start automatically via profile hook or sprint-runner."

# Kill the Claude process. This terminates our parent — we become orphaned.
# The signal file tells the restart mechanism to pick up.
taskkill //PID "$CLAUDE_PID" //F > /dev/null 2>&1

# If we get here, taskkill may have failed (or hasn't taken effect yet).
# Give it a moment, then exit. The orphaned process will terminate shortly.
sleep 2
exit 0

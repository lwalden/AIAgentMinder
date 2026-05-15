<#
.SYNOPSIS
    Sprint session wrapper — runs Claude in a loop with automatic context cycling.

.DESCRIPTION
    Starts Claude and monitors for context cycle signals. When Claude detects
    context pressure mid-sprint, it writes state files and self-terminates.
    This wrapper catches the exit, waits briefly, and starts a fresh Claude
    instance with a continuation prompt — same terminal, same env vars.

    For sessions started without this wrapper, the PowerShell profile hook
    (installed via install-profile-hook.ps1) provides the same functionality.

.PARAMETER Prompt
    Optional initial prompt to pass to Claude on the first run.

.PARAMETER PermissionMode
    Optional permission mode to pass to Claude (e.g., "auto", "acceptEdits").

.EXAMPLE
    .\sprint-runner.ps1
    .\sprint-runner.ps1 -Prompt "plan and start a sprint for phase 2"
    .\sprint-runner.ps1 -Prompt "resume sprint" -PermissionMode "acceptEdits"
#>

param(
    [string]$Agent = "sprint-master",
    [string]$Prompt = "",
    [string]$PermissionMode = ""
)

$contFile = Join-Path $PWD ".sprint-continuation.md"
$signalFile = Join-Path $PWD ".sprint-continue-signal"

# Clean stale signals from a previous crashed cycle
if (Test-Path $signalFile) {
    Write-Host "Cleaning stale cycle signal from previous session..." -ForegroundColor DarkYellow
    Remove-Item $signalFile -Force
}

$cycle = 0

while ($true) {
    $cycle++

    # Build the Claude argument list
    $claudeArgs = @()
    if ($Agent) {
        $claudeArgs += "--agent"
        $claudeArgs += $Agent
    }
    if ($PermissionMode) {
        $claudeArgs += "--permission-mode"
        $claudeArgs += $PermissionMode
    }

    if (Test-Path $contFile) {
        # Continuation from a previous cycle — pass resume prompt
        $resumePrompt = "CONTEXT CYCLE: Read $contFile and resume sprint execution. CLAUDE.md and rules load automatically. Focus on sprint state recovery from the continuation file."
        Write-Host "`n=== Context Cycle $cycle — Resuming sprint with fresh context ===" -ForegroundColor Cyan
        & claude @claudeArgs $resumePrompt
    }
    elseif ($Prompt -and $cycle -eq 1) {
        # First run with user-provided prompt
        Write-Host "=== Starting sprint session ===" -ForegroundColor Cyan
        & claude @claudeArgs $Prompt
    }
    else {
        # Normal interactive session
        if ($cycle -eq 1) {
            Write-Host "=== Sprint session ready (context cycling enabled) ===" -ForegroundColor Cyan
        }
        else {
            Write-Host "`n=== Context Cycle $cycle — Fresh session ===" -ForegroundColor Cyan
        }
        & claude @claudeArgs
    }

    # After Claude exits, check for continuation signal
    if (Test-Path $signalFile) {
        Remove-Item $signalFile -Force
        Write-Host "`n=== Context pressure detected — cycling session ===" -ForegroundColor Yellow
        Write-Host "Environment preserved. Fresh instance starting in 3 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        continue
    }

    # Normal exit — clean up and stop
    if (Test-Path $contFile) {
        # Stale continuation file without signal — clean it up
        Remove-Item $contFile -Force
    }
    Write-Host "`n=== Sprint session ended ===" -ForegroundColor Cyan
    break
}

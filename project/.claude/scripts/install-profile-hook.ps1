<#
.SYNOPSIS
    Installs the Claude context-cycle prompt hook into your PowerShell profile.

.DESCRIPTION
    Adds a function to your $PROFILE that automatically catches Claude context
    cycle signals. When Claude self-terminates for a context cycle, your shell
    prompt renders, the hook sees the signal file, and starts a fresh Claude
    instance with the continuation prompt — fully automatic, zero intervention.

    This is the recommended setup for context cycling. It works regardless of
    whether you started Claude via sprint-runner.ps1 or plain `claude`.

    Safe to run multiple times — checks for existing installation first.

.PARAMETER Uninstall
    Remove the hook from your profile.

.EXAMPLE
    .\install-profile-hook.ps1
    .\install-profile-hook.ps1 -Uninstall
#>

param(
    [switch]$Uninstall
)

$profilePath = $PROFILE.CurrentUserCurrentHost

# Marker comments to identify our hook
$markerStart = "# === AIAgentMinder Context Cycle Hook START ==="
$markerEnd = "# === AIAgentMinder Context Cycle Hook END ==="

$hookCode = @"

$markerStart
# Auto-restarts Claude after a context cycle (self-termination for fresh context).
# Installed by AIAgentMinder. Remove this block or run install-profile-hook.ps1 -Uninstall.
`$_aamOriginalPrompt = if (Test-Path Function:\prompt) { `${function:prompt}.ToString() } else { `$null }

function prompt {
    # Check for context cycle signal in current directory
    `$signal = Join-Path `$PWD ".sprint-continue-signal"
    if (Test-Path `$signal) {
        Remove-Item `$signal -Force
        `$cont = Join-Path `$PWD ".sprint-continuation.md"
        if (Test-Path `$cont) {
            Write-Host ""
            Write-Host "=== Context cycle — resuming sprint with fresh context ===" -ForegroundColor Cyan
            & claude "CONTEXT CYCLE: Read `$cont and resume sprint execution. CLAUDE.md and rules load automatically. Focus on sprint state recovery from the continuation file."
            # After the resumed session exits, fall through to normal prompt
        }
        else {
            Write-Host "Context cycle signal found but no continuation file. Starting fresh Claude." -ForegroundColor Yellow
            & claude
        }
    }

    # Call original prompt or default
    if (`$_aamOriginalPrompt) {
        [scriptblock]::Create(`$_aamOriginalPrompt).Invoke()
    }
    else {
        "PS `$(`$executionContext.SessionState.Path.CurrentLocation)`$('>' * (`$nestedPromptLevel + 1)) "
    }
}
$markerEnd
"@

# --- Uninstall ---
if ($Uninstall) {
    if (-not (Test-Path $profilePath)) {
        Write-Host "No profile found at $profilePath — nothing to uninstall." -ForegroundColor Yellow
        exit 0
    }

    $content = Get-Content $profilePath -Raw
    if ($content -match [regex]::Escape($markerStart)) {
        $pattern = "(?s)\r?\n?" + [regex]::Escape($markerStart) + ".*?" + [regex]::Escape($markerEnd)
        $content = [regex]::Replace($content, $pattern, "")
        Set-Content $profilePath -Value $content.TrimEnd() -NoNewline
        Write-Host "Context cycle hook removed from $profilePath" -ForegroundColor Green
    }
    else {
        Write-Host "Hook not found in profile — nothing to uninstall." -ForegroundColor Yellow
    }
    exit 0
}

# --- Install ---

# Create profile if it doesn't exist
if (-not (Test-Path $profilePath)) {
    $profileDir = Split-Path $profilePath -Parent
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
    Write-Host "Created new profile at $profilePath" -ForegroundColor DarkGray
}

# Check for existing installation
$existingContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($existingContent -and $existingContent.Contains($markerStart)) {
    Write-Host "Context cycle hook is already installed in $profilePath" -ForegroundColor Yellow
    Write-Host "To reinstall, run with -Uninstall first, then install again." -ForegroundColor DarkGray
    exit 0
}

# Append hook to profile
Add-Content $profilePath -Value $hookCode

Write-Host "Context cycle hook installed in $profilePath" -ForegroundColor Green
Write-Host ""
Write-Host "How it works:" -ForegroundColor Cyan
Write-Host "  When Claude self-terminates for a context cycle, your shell prompt"
Write-Host "  automatically catches the signal and starts a fresh Claude instance."
Write-Host "  Same terminal, same environment variables, zero intervention."
Write-Host ""
Write-Host "To activate now, run:  . `$PROFILE" -ForegroundColor Yellow
Write-Host "To uninstall later:    .\install-profile-hook.ps1 -Uninstall" -ForegroundColor DarkGray

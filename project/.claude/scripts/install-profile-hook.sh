#!/usr/bin/env bash
# install-profile-hook.sh — Installs the Claude context-cycle prompt hook
# into your shell profile (~/.bashrc, ~/.zshrc, or both).
#
# When Claude self-terminates for a context cycle, your shell prompt
# renders, the hook sees the signal file, and starts a fresh Claude
# instance with the continuation prompt — fully automatic.
#
# Usage:
#   ./install-profile-hook.sh            # Install
#   ./install-profile-hook.sh --uninstall # Remove

set -euo pipefail

MARKER_START="# === AIAgentMinder Context Cycle Hook START ==="
MARKER_END="# === AIAgentMinder Context Cycle Hook END ==="

HOOK_CODE='
'"$MARKER_START"'
# Auto-restarts Claude after a context cycle (self-termination for fresh context).
# Installed by AIAgentMinder. Remove this block or run install-profile-hook.sh --uninstall.

_aam_context_cycle_check() {
    if [ -f ".sprint-continue-signal" ]; then
        rm -f ".sprint-continue-signal"
        if [ -f ".sprint-continuation.md" ]; then
            echo ""
            echo "=== Context cycle — resuming sprint with fresh context ==="
            claude "CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution. CLAUDE.md and rules load automatically. Focus on sprint state recovery from the continuation file."
        else
            echo "Context cycle signal found but no continuation file. Starting fresh Claude."
            claude
        fi
    fi
}

# Install into the appropriate shell hook
if [ -n "${ZSH_VERSION:-}" ]; then
    # Zsh: use precmd hook
    autoload -Uz add-zsh-hook 2>/dev/null || true
    if type add-zsh-hook &>/dev/null; then
        add-zsh-hook precmd _aam_context_cycle_check
    else
        precmd_functions+=(_aam_context_cycle_check)
    fi
elif [ -n "${BASH_VERSION:-}" ]; then
    # Bash: append to PROMPT_COMMAND
    if [[ "${PROMPT_COMMAND:-}" != *"_aam_context_cycle_check"* ]]; then
        PROMPT_COMMAND="${PROMPT_COMMAND:+${PROMPT_COMMAND};}_aam_context_cycle_check"
    fi
fi
'"$MARKER_END"''

# --- Detect which profile files to modify ---
detect_profiles() {
    local profiles=()
    # Always check for zshrc if zsh exists
    if command -v zsh &>/dev/null && [ -f "$HOME/.zshrc" ]; then
        profiles+=("$HOME/.zshrc")
    elif command -v zsh &>/dev/null; then
        profiles+=("$HOME/.zshrc")
    fi
    # Always check for bashrc if bash exists
    if [ -f "$HOME/.bashrc" ]; then
        profiles+=("$HOME/.bashrc")
    fi
    # Fallback: if nothing found, use .bashrc
    if [ ${#profiles[@]} -eq 0 ]; then
        profiles+=("$HOME/.bashrc")
    fi
    echo "${profiles[@]}"
}

# --- Uninstall ---
if [ "${1:-}" = "--uninstall" ]; then
    for profile in $(detect_profiles); do
        if [ -f "$profile" ] && grep -qF "$MARKER_START" "$profile"; then
            # Remove the hook block
            sed -i.bak "/$MARKER_START/,/$MARKER_END/d" "$profile"
            rm -f "${profile}.bak"
            echo "Context cycle hook removed from $profile"
        else
            echo "Hook not found in $profile — nothing to uninstall."
        fi
    done
    exit 0
fi

# --- Install ---
for profile in $(detect_profiles); do
    # Create profile if it doesn't exist
    if [ ! -f "$profile" ]; then
        touch "$profile"
        echo "Created $profile"
    fi

    # Check for existing installation
    if grep -qF "$MARKER_START" "$profile"; then
        echo "Context cycle hook is already installed in $profile"
        echo "To reinstall, run with --uninstall first, then install again."
        continue
    fi

    # Append hook
    echo "$HOOK_CODE" >> "$profile"
    echo "Context cycle hook installed in $profile"
done

echo ""
echo "How it works:"
echo "  When Claude self-terminates for a context cycle, your shell prompt"
echo "  automatically catches the signal and starts a fresh Claude instance."
echo "  Same terminal, same environment variables, zero intervention."
echo ""
echo "To activate now, run:  source ~/.bashrc  (or ~/.zshrc)"
echo "To uninstall later:    ./install-profile-hook.sh --uninstall"

#!/usr/bin/env bash
# aam-bootstrap.sh — Copy AAM templates into the current project.
#
# Invoked by the /aiagentminder:setup skill after the interactive interview.
# Performs the mechanical file copies; the skill handles the interactive
# parts (identity prompts, CLAUDE.md substitution, .gitignore augmentation).
#
# Never overwrites existing user files — reports skips instead.
#
# CWD: target project root (the user's repo).
# CLAUDE_PLUGIN_ROOT: AAM plugin install location.

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
TEMPLATES="${PLUGIN_ROOT}/templates"

if [ ! -d "$TEMPLATES" ]; then
  echo "Error: templates directory not found at $TEMPLATES" >&2
  exit 1
fi

copy_if_absent() {
  local src="$1"
  local dst="$2"
  if [ -e "$dst" ]; then
    echo "skip   $dst (already exists)"
  else
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "create $dst"
  fi
}

# .claude/rules — always overwrite (AAM-managed)
mkdir -p .claude/rules
for f in "$TEMPLATES"/.claude/rules/*.md; do
  [ -e "$f" ] || continue
  cp "$f" ".claude/rules/$(basename "$f")"
  echo "update .claude/rules/$(basename "$f")"
done

# Version stamp — always overwrite
cp "$TEMPLATES/.claude/aiagentminder-version" .claude/aiagentminder-version
echo "update .claude/aiagentminder-version"

# Root files — preserve if user already has them
copy_if_absent "$TEMPLATES/DECISIONS.md" "DECISIONS.md"
copy_if_absent "$TEMPLATES/BACKLOG.md" "BACKLOG.md"

# SPRINT.md — only if user explicitly asks (skill prompts separately)
if [ "${AAM_INSTALL_SPRINT:-0}" = "1" ]; then
  copy_if_absent "$TEMPLATES/SPRINT.md" "SPRINT.md"
fi

# .pr-pipeline.json — only if user explicitly asks
if [ "${AAM_INSTALL_PR_PIPELINE:-0}" = "1" ]; then
  copy_if_absent "$TEMPLATES/.pr-pipeline.json" ".pr-pipeline.json"
fi

# docs/strategy-roadmap.md — preserve if user already has one
copy_if_absent "$TEMPLATES/docs/strategy-roadmap.md" "docs/strategy-roadmap.md"

# .claude/settings.json — wire the context-monitor statusLine.
# Claude Code plugin manifests don't support shipping a statusLine setting
# (per the docs, plugin settings.json only honors `agent` and
# `subagentStatusLine`), so we surgically inject the config into the user's
# project-level .claude/settings.json at install time.
#
# Behavior: additive only. If the user already has a statusLine config,
# we leave it alone and warn — they may have customized it intentionally.
SETTINGS_FILE=".claude/settings.json"
STATUSLINE_CMD='bash "${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"'

merge_statusline() {
  mkdir -p .claude
  if [ ! -f "$SETTINGS_FILE" ]; then
    cat > "$SETTINGS_FILE" <<EOF
{
  "statusLine": {
    "type": "command",
    "command": "$STATUSLINE_CMD"
  }
}
EOF
    echo "create $SETTINGS_FILE (statusLine wired)"
    return
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "warn   jq not found; cannot safely merge $SETTINGS_FILE — add statusLine manually:"
    echo "       \"statusLine\": { \"type\": \"command\", \"command\": \"$STATUSLINE_CMD\" }"
    return
  fi

  if jq -e '.statusLine' "$SETTINGS_FILE" >/dev/null 2>&1; then
    echo "skip   $SETTINGS_FILE already has a statusLine (preserving user config)"
    return
  fi

  jq --arg cmd "$STATUSLINE_CMD" \
     '.statusLine = { "type": "command", "command": $cmd }' \
     "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
  echo "update $SETTINGS_FILE (statusLine added)"
}

merge_statusline

# Strip retired auto-cycle hook registrations left behind by pre-5.0 installs.
# Those installs wired the context-cycle protocol into the project's own
# settings file(s); the plugin now registers hooks via hooks.json, and the
# leftover PreToolUse cycle hook can block edits on Windows. Idempotent no-op
# when nothing matches. Applies to both the shared and local settings files.
strip_retired_hooks() {
  local script="${PLUGIN_ROOT}/bin/strip-retired-hooks.sh"
  [ -f "$script" ] || return 0
  local f
  for f in ".claude/settings.json" ".claude/settings.local.json"; do
    [ -f "$f" ] || continue
    bash "$script" "$f"
  done
}

strip_retired_hooks

echo "bootstrap complete"

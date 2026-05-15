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

echo "bootstrap complete"

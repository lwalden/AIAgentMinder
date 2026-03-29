#!/bin/bash
# version-bump.sh — Zero-token-cost version bump across all version points.
# Updates all 4 version files atomically so the LLM doesn't burn tokens on file I/O.
#
# Usage:
#   bash .claude/scripts/version-bump.sh <semver>
#
# Examples:
#   bash .claude/scripts/version-bump.sh 3.4.0
#   bash .claude/scripts/version-bump.sh 4.0.0
#
# Updates:
#   project/.claude/aiagentminder-version  (source of truth)
#   package.json                           (npm)
#   .claude-plugin/plugin.json             (plugin manifest)
#   .claude-plugin/marketplace.json        (marketplace listing)

die() { echo "Error: $1" >&2; exit 1; }

if [ $# -lt 1 ]; then
  die "Usage: version-bump.sh <semver> (e.g., 3.4.0)"
fi

VERSION="$1"

# Validate semver format (MAJOR.MINOR.PATCH, optional pre-release)
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
  die "Invalid version format: '$VERSION'. Expected semver (e.g., 3.4.0)"
fi

# Check required files exist
VERSION_FILE="project/.claude/aiagentminder-version"
PKG_FILE="package.json"
PLUGIN_FILE=".claude-plugin/plugin.json"
MARKETPLACE_FILE=".claude-plugin/marketplace.json"

[ -f "$VERSION_FILE" ] || die "Version file not found: $VERSION_FILE"
[ -f "$PKG_FILE" ] || die "Package file not found: $PKG_FILE"

# 1. Update aiagentminder-version (plain text)
echo "$VERSION" > "$VERSION_FILE"

# 2. Update package.json
if command -v jq >/dev/null 2>&1; then
  jq --arg v "$VERSION" '.version = $v' "$PKG_FILE" > "${PKG_FILE}.tmp" && mv "${PKG_FILE}.tmp" "$PKG_FILE"
else
  # Fallback: sed-based update for environments without jq
  sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$VERSION\"/" "$PKG_FILE"
fi

# 3. Update plugin.json (if exists)
if [ -f "$PLUGIN_FILE" ]; then
  if command -v jq >/dev/null 2>&1; then
    jq --arg v "$VERSION" '.version = $v' "$PLUGIN_FILE" > "${PLUGIN_FILE}.tmp" && mv "${PLUGIN_FILE}.tmp" "$PLUGIN_FILE"
  else
    sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$VERSION\"/" "$PLUGIN_FILE"
  fi
fi

# 4. Update marketplace.json (if exists)
if [ -f "$MARKETPLACE_FILE" ]; then
  if command -v jq >/dev/null 2>&1; then
    jq --arg v "$VERSION" '.plugins[0].version = $v' "$MARKETPLACE_FILE" > "${MARKETPLACE_FILE}.tmp" && mv "${MARKETPLACE_FILE}.tmp" "$MARKETPLACE_FILE"
  else
    sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$VERSION\"/" "$MARKETPLACE_FILE"
  fi
fi


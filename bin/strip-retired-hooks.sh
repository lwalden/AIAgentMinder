#!/usr/bin/env bash
# strip-retired-hooks.sh — Remove retired AAM auto-cycle hook registrations
# from a project settings file.
#
# Pre-5.0 AAM installs wired the autonomous context-cycle protocol directly
# into the project's .claude/settings.json (before the plugin moved hook
# registration to hooks.json). v5.1 retired that protocol. The leftover
# entries are stale at best; the PreToolUse one (context-cycle-hook.sh) spawns
# bash on every tool call and can block edits on Windows. This script removes
# them surgically while preserving every other hook and setting.
#
# Usage: bash strip-retired-hooks.sh <settings-file>
#
# Idempotent. No-op (exit 0) when the file or jq is absent, or when no retired
# hooks are present. Exits non-zero only on a usage error.

set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "usage: strip-retired-hooks.sh <settings-file>" >&2
  exit 2
fi

# Retired auto-cycle hook scripts (v5.1 removed the protocol).
PAT='context-cycle-hook\.sh|session-start-continuation\.sh|session-end-cycle\.sh'

if [ ! -f "$FILE" ]; then
  echo "skip   $FILE (not present)"
  exit 0
fi

# Leave the file completely untouched when there's nothing to strip — avoids
# needless reformatting of a user's settings file.
if ! grep -qE "$PAT" "$FILE"; then
  echo "ok     $FILE (no retired hooks)"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "warn   jq not found; cannot strip retired hooks from $FILE — remove manually:" >&2
  echo "       delete any hook whose command references context-cycle-hook.sh," >&2
  echo "       session-start-continuation.sh, or session-end-cycle.sh" >&2
  exit 0
fi

removed="$(grep -oE "$PAT" "$FILE" | sort -u | tr '\n' ' ')"
removed="${removed% }"

tmp="${FILE}.tmp"
jq --arg pat "$PAT" '
  # true when a hook entry should be KEPT (its command does not match a retired script)
  def keep(h): (((h.command // "") | test($pat)) | not);
  # given an array of hook groups, drop retired inner hooks then drop emptied groups
  def clean_groups:
    map(.hooks |= ((. // []) | map(select(keep(.)))))
    | map(select(((.hooks // []) | length) > 0));
  if (.hooks | type) == "object" then
      ( .hooks |= (
          with_entries(.value |= clean_groups)
          | with_entries(select(((.value | type) == "array") and ((.value | length) > 0)))
        ) )
    | (if ((.hooks | type) == "object") and ((.hooks | length) == 0) then del(.hooks) else . end)
  else .
  end
' "$FILE" > "$tmp" && mv "$tmp" "$FILE"

echo "update $FILE (removed retired auto-cycle hooks: ${removed})"

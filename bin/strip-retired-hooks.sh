#!/usr/bin/env bash
# strip-retired-hooks.sh — Remove retired AAM hook registrations from a
# project settings file.
#
# Pre-5.0 AAM installs wired hooks directly into the project's
# .claude/settings.json (before the plugin moved hook registration to
# hooks.json). The leftover entries are stale at best; the PreToolUse one
# (context-cycle-hook.sh) spawns bash on every tool call and can block edits
# on Windows. This script removes them surgically while preserving every
# other hook and setting.
#
# Usage:
#   strip-retired-hooks.sh <settings-file>
#       Remove retired hook registrations from one settings file (called by
#       aam-bootstrap.sh on the upgrade path). Idempotent. No-op (exit 0)
#       when the file or jq is absent.
#
#   strip-retired-hooks.sh migrate [--apply] [--force-divergent]
#       Full pre-5.0 legacy-install migration (stale file copies + hook
#       de-dup). Delegates to legacy-migrate.sh — see that script and
#       docs/migration-guide.md.
#
# Exits non-zero only on a usage error. Also sourceable as a library
# (legacy-migrate.sh sources it for the shared jq transform).

set -euo pipefail

# Retired hook scripts (v4.6 retired correction-capture; v5.1 the auto-cycle
# protocol). Nothing ships these now — remove them wherever they appear.
RETIRED_PAT='context-cycle-hook\.sh|session-start-continuation\.sh|session-end-cycle\.sh|correction-capture-hook\.sh'

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATUSLINE_CMD='bash "${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"'
LEGACY_STATUSLINE_PAT='\.claude[/\\]scripts[/\\]context-monitor\.sh'

# Surgical jq transform: drop hooks whose command matches pattern $2, prune
# emptied groups/arrays, optionally ($3 = 1) repoint a legacy
# ".claude/scripts/context-monitor.sh" statusLine at the plugin copy.
# Writes the transformed JSON to stdout.
strip_hooks_json() {
  jq --arg pat "$2" --arg slpat "$LEGACY_STATUSLINE_PAT" \
     --arg slcmd "$STATUSLINE_CMD" --argjson repoint "${3:-0}" '
    def keep(h): (((h.command // "") | test($pat)) | not);
    def clean_groups:
      map(.hooks |= ((. // []) | map(select(keep(.)))))
      | map(select(((.hooks // []) | length) > 0));
    (if (.hooks | type) == "object" then
        ( .hooks |= (
            with_entries(.value |= clean_groups)
            | with_entries(select(((.value | type) == "array") and ((.value | length) > 0)))
          ) )
      | (if ((.hooks | type) == "object") and ((.hooks | length) == 0) then del(.hooks) else . end)
    else . end)
    | (if ($repoint == 1) and ((.statusLine.command // "") | test($slpat))
       then .statusLine.command = $slcmd else . end)
  ' "$1"
}

run_legacy() {
  local FILE="$1"

  if [ ! -f "$FILE" ]; then
    echo "skip   $FILE (not present)"
    exit 0
  fi

  # Leave the file completely untouched when there's nothing to strip — avoids
  # needless reformatting of a user's settings file.
  if ! grep -qE "$RETIRED_PAT" "$FILE"; then
    echo "ok     $FILE (no retired hooks)"
    exit 0
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "warn   jq not found; cannot strip retired hooks from $FILE — remove manually:" >&2
    echo "       delete any hook whose command references context-cycle-hook.sh," >&2
    echo "       session-start-continuation.sh, session-end-cycle.sh, or correction-capture-hook.sh" >&2
    exit 0
  fi

  local removed
  removed="$(grep -oE "$RETIRED_PAT" "$FILE" | sort -u | tr '\n' ' ')"
  removed="${removed% }"

  local tmp="${FILE}.tmp"
  strip_hooks_json "$FILE" "$RETIRED_PAT" 0 > "$tmp" && mv "$tmp" "$FILE"

  echo "update $FILE (removed retired auto-cycle hooks: ${removed})"
}

# Dispatch — skipped when sourced as a library.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  if [ $# -lt 1 ]; then
    echo "usage: strip-retired-hooks.sh <settings-file>" >&2
    echo "       strip-retired-hooks.sh migrate [--apply] [--force-divergent]" >&2
    exit 2
  fi
  if [ "$1" = "migrate" ]; then
    shift
    exec bash "${PLUGIN_ROOT}/bin/legacy-migrate.sh" "$@"
  fi
  run_legacy "$1"
fi

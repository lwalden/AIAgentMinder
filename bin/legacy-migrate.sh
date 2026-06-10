#!/usr/bin/env bash
# legacy-migrate.sh — Migrate a pre-plugin (pre-5.0) file-copied AAM install
# to the plugin layout. Run from the project root. Also reachable as
# `strip-retired-hooks.sh migrate`. Full walkthrough: docs/migration-guide.md.
#
# Usage: legacy-migrate.sh [--apply] [--force-divergent]
#
# DRY-RUN by default; --apply performs the actions:
#
#   1. Hook de-dup: removes project hook entries whose command basename
#      matches a hook the plugin already registers via hooks.json (read from
#      ${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json when available, else a built-in
#      list), plus the retired hooks, from .claude/settings.json and
#      .claude/settings.local.json. All other hooks and settings are
#      preserved. A legacy ".claude/scripts/context-monitor.sh" statusLine is
#      repointed at the plugin copy — statusLine wiring itself is
#      intentionally project-level and stays.
#
#   2. File retirement: MOVES stale AAM file copies in .claude/agents/ and
#      .claude/scripts/ to .claude/legacy-retired-<UTC>/ (backup-first, never
#      rm; the files are typically git-tracked too, so doubly recoverable).
#      Manifest-driven: only filenames AAM has ever shipped are candidates —
#      anything else is user property and is NEVER touched. A candidate that
#      DIVERGES from the current plugin copy (beyond whitespace/line endings)
#      is skipped by default, since the customization guide invites local
#      edits; --force-divergent overrides. A script still referenced by
#      surviving project settings is kept.
#
# Post-migration script access needs no project shim: Claude Code puts the
# plugin's bin/ on the Bash tool's PATH while the plugin is enabled, so bare
# names (sprint-update.sh, backlog-capture.sh, ...) keep resolving.
#
# Exits non-zero only on usage errors.

set -euo pipefail

# Shared library: RETIRED_PAT, PLUGIN_ROOT, STATUSLINE_CMD,
# LEGACY_STATUSLINE_PAT, strip_hooks_json (dispatch is source-guarded).
# shellcheck source=strip-retired-hooks.sh
source "${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/bin/strip-retired-hooks.sh"

# Filenames AAM has ever shipped: union of the historical (pre-5.0 installer)
# names and whatever the current plugin payload carries — never a glob over
# the user's directories.
manifest_agents() {
  {
    printf '%s\n' api-reviewer.md cost-reviewer.md debug.md dev.md hotfix.md \
      item-executor.md performance-reviewer.md pr-pipeliner.md qa.md \
      quality-reviewer.md security-reviewer.md sprint-master.md \
      sprint-planner.md sprint-retro.md sprint-speccer.md ux-reviewer.md
    if [ -d "$PLUGIN_ROOT/agents" ]; then
      find "$PLUGIN_ROOT/agents" -maxdepth 1 -type f -name '*.md' -exec basename {} \;
    fi
  } | sort -u
}

manifest_scripts() {
  {
    printf '%s\n' aam-bootstrap.sh backlog-capture.sh context-cycle-hook.sh \
      context-monitor.sh context-warning-hook.sh correction-capture-hook.sh \
      decisions-log.sh exec-history-append.sh hlpm-ping.sh \
      install-profile-hook.ps1 install-profile-hook.sh legacy-migrate.sh \
      pre-pr-gate-hook.sh session-end-cycle.sh session-start-continuation.sh \
      session-start-cycle-reset.sh session-start-hook.sh sprint-metrics.sh \
      sprint-phase-guard.sh sprint-phase-reminder.sh sprint-runner.ps1 \
      sprint-runner.sh sprint-stop-guard.sh sprint-update.sh \
      stop-failure-hook.sh strip-retired-hooks.sh version-bump.sh
    if [ -d "$PLUGIN_ROOT/bin" ]; then
      find "$PLUGIN_ROOT/bin" -maxdepth 1 -type f \( -name '*.sh' -o -name '*.ps1' \) -exec basename {} \;
    fi
  } | sort -u
}

in_list() { # <needle> <newline-separated haystack>
  printf '%s\n' "$2" | grep -qxF "$1"
}

# Hook script basenames the plugin registers itself, from hooks.json when
# readable, else the built-in fallback list (v5.3 hook set).
plugin_hook_basenames() {
  local hj="$PLUGIN_ROOT/hooks/hooks.json"
  if [ -f "$hj" ] && command -v jq >/dev/null 2>&1; then
    jq -r '[.hooks // {} | to_entries[].value[]?.hooks[]?.command // empty] | .[]' "$hj" \
      | grep -oE '[A-Za-z0-9._-]+\.(sh|ps1)' | sort -u
  else
    printf '%s\n' context-warning-hook.sh hlpm-ping.sh pre-pr-gate-hook.sh \
      session-start-cycle-reset.sh session-start-hook.sh sprint-phase-guard.sh \
      sprint-phase-reminder.sh sprint-stop-guard.sh stop-failure-hook.sh
  fi
}

# Normalized content (CRLF -> LF, trailing whitespace and trailing blank lines
# stripped) so whitespace/line-ending-only differences count as a match.
normalize() {
  tr -d '\r' < "$1" | sed -e 's/[[:space:]]*$//' \
    | awk '/^$/ { blanks = blanks "\n"; next } { printf "%s%s\n", blanks, $0; blanks = "" }'
}

content_matches() { # <candidate> <plugin copy>
  diff -q <(normalize "$1") <(normalize "$2") >/dev/null 2>&1
}

# Is this script basename still referenced (as .claude/scripts/<name>) by the
# would-be post-migration settings content?
is_referenced() {
  local esc f
  esc="$(printf '%s' "$1" | sed 's/\./\\./g')"
  for f in "$REF_A" "$REF_B"; do
    [ -n "$f" ] && [ -f "$f" ] || continue
    if grep -qE "\.claude[/\\\\]scripts[/\\\\]${esc}" "$f"; then return 0; fi
  done
  return 1
}

decide_file() { # <path> <plugin-copy-path> <agents|scripts>
  local p="$1" copy="$2" sub="$3" why b
  b="$(basename "$p")"
  if [ "$sub" = "scripts" ] && is_referenced "$b"; then
    echo "keep    $p — still referenced by project settings (resolve the reference first)"
    N_REF=$((N_REF + 1)); return
  fi
  if [ ! -f "$copy" ]; then
    why="retired AAM file; no current plugin counterpart"
  elif content_matches "$p" "$copy"; then
    why="matches the current plugin copy"
  elif [ "$FORCE" = 1 ]; then
    why="DIVERGES from the plugin copy (--force-divergent)"
  else
    echo "skip    $p — DIVERGES from the plugin copy (local customization preserved; --force-divergent to retire)"
    N_DIVERGENT=$((N_DIVERGENT + 1)); return
  fi
  if [ "$APPLY" = 1 ]; then
    mkdir -p "$RETIRE_DIR/$sub"
    mv "$p" "$RETIRE_DIR/$sub/"
    echo "retire  $p → $RETIRE_DIR/$sub/$b — $why"
  else
    echo "retire  $p — $why (would move to $RETIRE_DIR/$sub/)"
  fi
  N_RETIRED=$((N_RETIRED + 1))
}

migrate_settings() { # <file> <slot: A|B> <dedup-pat>
  local f="$1" slot="$2" dedup_pat="$3"
  [ -f "$f" ] || return 0
  if [ "$HAVE_JQ" = 0 ]; then
    echo "warn    $f — jq not found; hook de-dup skipped (remove duplicate AAM hook entries manually)"
    if [ "$slot" = A ]; then REF_A="$f"; else REF_B="$f"; fi
    return 0
  fi
  local removed repoint=0 tmp="${f}.migrate.tmp"
  removed="$(grep -oE "$dedup_pat" "$f" | sort -u | tr '\n' ' ' || true)"
  removed="${removed% }"
  if jq -r '.statusLine.command // ""' "$f" | grep -qE "$LEGACY_STATUSLINE_PAT"; then repoint=1; fi
  strip_hooks_json "$f" "$dedup_pat" "$repoint" > "$tmp"
  if [ "$slot" = A ]; then REF_A="$tmp"; TMP_A="$tmp"; else REF_B="$tmp"; TMP_B="$tmp"; fi

  if [ -n "$removed" ]; then
    N_DEDUP=$((N_DEDUP + $(echo "$removed" | wc -w)))
    if [ "$APPLY" = 1 ]; then echo "dedup   $f — removed: $removed"
    else echo "dedup   $f — would remove: $removed"; fi
  fi
  if [ "$repoint" = 1 ]; then
    N_REPOINT=$((N_REPOINT + 1))
    if [ "$APPLY" = 1 ]; then echo "repoint $f statusLine → \${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"
    else echo "repoint $f statusLine → \${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh (would update)"; fi
  fi
  if [ -z "$removed" ] && [ "$repoint" = 0 ]; then
    echo "ok      $f — no duplicate or retired AAM hooks"
  elif [ "$APPLY" = 1 ]; then
    cp "$tmp" "$f"
  fi
}

APPLY=0; FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --force-divergent) FORCE=1 ;;
    *) echo "usage: legacy-migrate.sh [--apply] [--force-divergent]" >&2; exit 2 ;;
  esac
  shift
done

mode_label="DRY-RUN — no changes will be made"
[ "$APPLY" = 1 ] && mode_label="APPLY"
echo "== AAM legacy migration ($mode_label) =="
echo "   plugin root: $PLUGIN_ROOT"

HAVE_JQ=1
command -v jq >/dev/null 2>&1 || HAVE_JQ=0

# Hook de-dup pattern: retired hooks + everything the plugin registers.
DEDUP_PAT="$RETIRED_PAT"
while IFS= read -r b; do
  [ -n "$b" ] || continue
  DEDUP_PAT="${DEDUP_PAT}|$(printf '%s' "$b" | sed 's/\./\\./g')"
done < <(plugin_hook_basenames)

N_RETIRED=0; N_DIVERGENT=0; N_KEPT=0; N_REF=0; N_DEDUP=0; N_REPOINT=0
RETIRE_DIR=".claude/legacy-retired-$(date -u +%Y%m%dT%H%M%SZ)"
REF_A=""; REF_B=""; TMP_A=""; TMP_B=""

migrate_settings .claude/settings.json A "$DEDUP_PAT"
migrate_settings .claude/settings.local.json B "$DEDUP_PAT"

AGENTS_MANIFEST="$(manifest_agents)"
SCRIPTS_MANIFEST="$(manifest_scripts)"

if [ -d .claude/agents ]; then
  for p in .claude/agents/*; do
    [ -f "$p" ] || continue
    b="$(basename "$p")"
    if in_list "$b" "$AGENTS_MANIFEST"; then
      decide_file "$p" "$PLUGIN_ROOT/agents/$b" agents
    else
      echo "keep    $p — not an AAM-shipped file (user property)"
      N_KEPT=$((N_KEPT + 1))
    fi
  done
fi
if [ -d .claude/scripts ]; then
  for p in .claude/scripts/*; do
    [ -f "$p" ] || continue
    b="$(basename "$p")"
    if in_list "$b" "$SCRIPTS_MANIFEST"; then
      decide_file "$p" "$PLUGIN_ROOT/bin/$b" scripts
    else
      echo "keep    $p — not an AAM-shipped file (user property)"
      N_KEPT=$((N_KEPT + 1))
    fi
  done
fi

[ -n "$TMP_A" ] && rm -f "$TMP_A"
[ -n "$TMP_B" ] && rm -f "$TMP_B"

echo ""
echo "== summary: retired=$N_RETIRED skipped-divergent=$N_DIVERGENT kept-not-ours=$N_KEPT kept-referenced=$N_REF hooks-deduped=$N_DEDUP statusline-repointed=$N_REPOINT =="
if [ "$APPLY" = 1 ]; then
  [ "$N_RETIRED" -gt 0 ] && echo "Retired files were MOVED (not deleted) to $RETIRE_DIR/ — review, then commit the removal."
else
  echo "Dry-run only — re-run with --apply to perform these actions."
fi
exit 0

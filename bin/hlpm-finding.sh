#!/usr/bin/env bash
# HLPM tooling-finding capture -- appends a structured finding about
# AIAgentMinder itself (a defect, friction point, or feature gap observed
# during a sprint retrospective) to the HLPM findings inbox so the user's
# executive layer can triage it centrally across all consumer repos.
#
# Called by the retrospective skill / sprint-retro agent:
#   hlpm-finding.sh <type> <severity> "<summary>" ["<detail>"] ["<sprint>"]
#
#   type:     defect | friction | feature
#   severity: low | medium | high
#   summary:  one-line description of the finding
#   detail:   optional context -- environment (OS, shell), error text, repro
#   sprint:   optional sprint id (e.g. S9)
#
# Opt-in: this script is a no-op unless the user explicitly sets the
# HLPM_DIR environment variable to the absolute path of their HLPM
# checkout. Without HLPM_DIR set, exit silently -- most AAM users don't
# have HLPM, and their findings stay in the retrospective report.
#
# Unlike events.jsonl (a rolling log trimmed on append), the findings
# inbox is never trimmed: findings persist until HLPM's /findings triage
# disposes them (promote to AAM backlog, escalate to GitHub issue, or
# dismiss).
#
# Silent exit 0 cases (capture channel absent -- not an error):
#   - HLPM_DIR not set (most users)
#   - HLPM_DIR set but the directory doesn't exist
#   - HLPM_PING_DISABLED=1 environment variable set (per-session opt-out)
# Loud exit 1 cases (the channel exists; the caller must fix the call):
#   - invalid type / severity / missing summary
#   - jq not available
set -euo pipefail

[[ "${HLPM_PING_DISABLED:-0}" == "1" ]] && exit 0

HLPM_DIR="${HLPM_DIR:-}"
[[ -n "$HLPM_DIR" ]] || exit 0
[[ -d "$HLPM_DIR" ]] || exit 0

die() { echo "hlpm-finding: $1" >&2; exit 1; }

TYPE="${1:-}"
SEVERITY="${2:-}"
SUMMARY="${3:-}"
DETAIL="${4:-}"
SPRINT="${5:-}"

echo "$TYPE" | grep -qE '^(defect|friction|feature)$' \
  || die "invalid type '${TYPE}' -- must be defect, friction, or feature"
echo "$SEVERITY" | grep -qE '^(low|medium|high)$' \
  || die "invalid severity '${SEVERITY}' -- must be low, medium, or high"
[[ -n "$SUMMARY" ]] || die "summary is required"
command -v jq >/dev/null 2>&1 || die "jq is required to record findings"

INBOX="$HLPM_DIR/tooling-findings.jsonl"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
REPO=$(basename "$REPO_ROOT")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Plugin version travels with the finding so triage can spot already-fixed
# issues. Resolve package.json from the plugin root, falling back to the
# script's own parent directory (source checkout).
PKG="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}/package.json"
AAM_VERSION=$(jq -r '.version // "unknown"' "$PKG" 2>/dev/null || echo "unknown")

FINDING_JSON=$(jq -c -n \
  --arg ts "$TS" \
  --arg repo "$REPO" \
  --arg branch "$BRANCH" \
  --arg sprint "$SPRINT" \
  --arg type "$TYPE" \
  --arg severity "$SEVERITY" \
  --arg summary "$SUMMARY" \
  --arg detail "$DETAIL" \
  --arg aam_version "$AAM_VERSION" \
  '{ts: $ts, repo: $repo, branch: $branch, sprint: $sprint, type: $type,
    severity: $severity, summary: $summary, detail: $detail,
    aam_version: $aam_version}')

printf '%s\n' "$FINDING_JSON" >> "$INBOX"
echo "Captured tooling finding to HLPM inbox: ${TYPE}/${SEVERITY} -- ${SUMMARY}" >&2
exit 0

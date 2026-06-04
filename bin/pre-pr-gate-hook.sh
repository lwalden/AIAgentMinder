#!/usr/bin/env bash
# pre-pr-gate-hook.sh — PreToolUse hook (matcher: "Bash") that mechanically
# enforces the quality gate at the PR boundary.
#
# Hard gate only (single-purpose by design — mirrors sprint-phase-guard.sh):
# blocks `gh pr create` / `mcp__github__create_pull_request` unless BOTH:
#   1. `.quality-gate-pass` exists and is fresh (default < 60 min), AND
#   2. `.quality-review-result.json`, IF present, does not say decision=block.
#
# The marker files are WRITTEN by /aiagentminder:quality-gate (.quality-gate-pass)
# and the quality-reviewer agent (.quality-review-result.json). This hook is the
# READ side that makes the README's "deterministic enforcement of quality" claim
# real instead of trusting the model to remember.
#
# History: a working version of this hook shipped in v4.3.0 (PR #143) and was
# deleted in v5.0 prep (commit d4415fa) under an inaccurate "empty placeholder"
# label — the git diff shows the deleted file was a full implementation. There is
# no decision on record that the approach was wrong. See DECISIONS.md.
#
# Block contract: exit 2 + reason on stdout (same convention as
# sprint-phase-guard.sh). No-op = exit 0 with no output.
#
# Fail open everywhere: missing jq, unreadable input, or any error → allow.
# A quality hook must never wedge a session shut.
#
# Bypass (per-session opt-out): set AAM_PR_GATE_BYPASS=1. Use when creating a PR
# outside the AAM quality workflow (e.g. a docs-only or chore PR). The
# /aiagentminder:quality-gate override path writes a fresh marker, so an explicit
# human override flows through the gate normally without needing this env var.

set -euo pipefail
trap 'exit 0' ERR

# Per-session opt-out.
[ "${AAM_PR_GATE_BYPASS:-0}" = "1" ] && exit 0

input=$(cat 2>/dev/null || true)
[ -n "$input" ] || exit 0

# jq is required to parse the hook payload safely. Without it, fail open.
command -v jq >/dev/null 2>&1 || exit 0

tool_name=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)
[ "$tool_name" = "Bash" ] || exit 0

command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
[ -n "$command" ] || exit 0

# Fast-path exit: only PR-creation commands are gated.
if ! printf '%s' "$command" | grep -qE 'gh pr create|mcp__github__create_pull_request'; then
  exit 0
fi

MARKER=".quality-gate-pass"
REVIEW=".quality-review-result.json"
TTL_SECONDS="${AAM_PR_GATE_TTL_SECONDS:-3600}"  # 60 min default; configurable

block() {
  cat <<EOF
BLOCKED — Quality gate not satisfied.

$1

Run /aiagentminder:quality-gate (and, if reviewing, /aiagentminder:self-review)
before creating the PR. To create a PR outside the AAM quality workflow, re-run
with AAM_PR_GATE_BYPASS=1.
EOF
  exit 2
}

# --- Gate 1: quality-gate must have passed ---
[ -f "$MARKER" ] || block "Quality gate has not passed this session ($MARKER absent)."

# Staleness check. Portable mtime: GNU stat first, then BSD/macOS stat.
now=$(date +%s 2>/dev/null || echo 0)
mtime=$(stat -c %Y "$MARKER" 2>/dev/null || stat -f %m "$MARKER" 2>/dev/null || echo 0)
if [ "$now" -gt 0 ] && [ "$mtime" -gt 0 ]; then
  age=$((now - mtime))
  if [ "$age" -gt "$TTL_SECONDS" ]; then
    block "Quality gate pass is stale ($((age / 60)) min old; limit $((TTL_SECONDS / 60)) min)."
  fi
fi

# --- Gate 2: review judge decision must not be 'block' ---
if [ -f "$REVIEW" ]; then
  decision=$(jq -r '.decision // empty' "$REVIEW" 2>/dev/null || true)
  if [ "$decision" = "block" ]; then
    critical=$(jq -r '.critical // 0' "$REVIEW" 2>/dev/null || echo 0)
    high=$(jq -r '.high // 0' "$REVIEW" 2>/dev/null || echo 0)
    block "Quality review blocked: ${critical} critical, ${high} high finding(s) unresolved."
  fi
fi

# All gates satisfied — allow PR creation.
exit 0

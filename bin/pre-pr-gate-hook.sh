#!/usr/bin/env bash
# pre-pr-gate-hook.sh — PreToolUse hook that mechanically enforces the quality
# gate at the PR boundary. Registered in hooks.json under TWO matchers: "Bash"
# (catches `gh pr create`) and "mcp__github__create_pull_request" (catches the
# GitHub MCP tool by name — that call has no command string to grep).
#
# Hard gate only (single-purpose by design — mirrors sprint-phase-guard.sh):
# blocks PR creation unless ALL of:
#   1. `.quality-gate-pass` exists and is fresh (default < 60 min), AND
#   2. `.quality-review-result.json`, IF present, does not say decision=block, AND
#   3. the PR diff's added lines contain no high-confidence hardcoded secret
#      (distinctive key formats only; AAM_PR_GATE_SECRETS=0 disables this gate).
#
# The marker files are WRITTEN by /aiagentminder:quality-gate (.quality-gate-pass)
# and — because the quality-reviewer judge is read-only — persisted from its
# verdict by the caller (sprint-master TEST state / self-review) into
# .quality-review-result.json. Gate 2 is therefore best-effort: flows that don't
# run the judge (e.g. the pr-pipeliner baseline review) leave the file absent and
# rely on Gate 1. This hook is the READ side that makes the README's
# "deterministic enforcement of quality" claim real at the PR boundary.
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
# A quality hook must never wedge a session shut. The ERR trap leaves a one-line
# stderr breadcrumb so a silent self-disable (a future bug tripping fail-open) is
# detectable rather than invisible.
#
# Bypass (per-session opt-out): set AAM_PR_GATE_BYPASS=1. Use when creating a PR
# outside the AAM quality workflow (e.g. a docs-only or chore PR). The
# /aiagentminder:quality-gate override path writes a fresh marker, so an explicit
# human override flows through the gate normally without needing this env var.

set -euo pipefail
trap 'echo "pre-pr-gate-hook: internal error — allowing (fail-open)" >&2; exit 0' ERR

# Per-session opt-out.
[ "${AAM_PR_GATE_BYPASS:-0}" = "1" ] && exit 0

input=$(cat 2>/dev/null || true)
[ -n "$input" ] || exit 0

# jq is required to parse the hook payload safely. Without it, fail open.
command -v jq >/dev/null 2>&1 || exit 0

tool_name=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null || true)

# Determine whether this call creates a PR. Two paths are gated:
#   - Bash: `gh pr create` appears in the command string (the plugin's own flows)
#   - the GitHub MCP tool, matched by tool name (no command string to grep)
case "$tool_name" in
  Bash)
    command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
    printf '%s' "$command" | grep -qE 'gh pr create' || exit 0
    ;;
  mcp__github__create_pull_request)
    : # always a PR creation — gate directly
    ;;
  *)
    exit 0
    ;;
esac

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

# --- Gate 3: high-confidence secret scan of the PR diff ---
# Stack-agnostic defense-in-depth. Scans ONLY added lines, ONLY for distinctive
# key formats with near-zero false-positive rate (no generic password=/api_key=
# heuristics — those are the security-reviewer lens's and quality-gate's job and
# would make this hard gate too noisy). Fail open on any uncertainty: no git, not
# a repo, no resolvable base ref, or grep error → skip silently rather than block.
# Disable just this gate with AAM_PR_GATE_SECRETS=0.
if [ "${AAM_PR_GATE_SECRETS:-1}" = "1" ] && command -v git >/dev/null 2>&1; then
  base=""
  for ref in origin/HEAD origin/main origin/master main master; do
    if git rev-parse --verify --quiet "$ref" >/dev/null 2>&1; then base="$ref"; break; fi
  done
  if [ -n "$base" ]; then
    # Added lines only (drop the +++ file headers); empty on any git error.
    added=$(git diff "$base"...HEAD 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' || true)
    if [ -n "$added" ]; then
      # Distinctive credential formats. Categories are reported; values never are.
      secret_re='AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk_live_[0-9a-zA-Z]{24}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
      if printf '%s' "$added" | grep -qE "$secret_re"; then
        # Count matching lines (the grep -qE above guarantees at least one).
        hits=$(printf '%s' "$added" | grep -cE "$secret_re")
        block "Likely hardcoded secret detected in ${hits} added line(s) of the PR diff (AWS/GitHub/Google/Slack/Stripe key or private key). Remove it (use env vars / a secret manager) before creating the PR. Set AAM_PR_GATE_SECRETS=0 to skip this scan if it is a false positive."
      fi
    fi
  fi
fi

# All gates satisfied — allow PR creation.
exit 0

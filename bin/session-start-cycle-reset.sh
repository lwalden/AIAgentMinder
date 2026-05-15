#!/usr/bin/env bash
# session-start-cycle-reset.sh — SessionStart hook. Removes stale cycling
# state files so the new session does not inherit `should_cycle=true` (or a
# tool counter past threshold) from a prior session.
#
# Background (S9-001 spike): without this hook, the PreToolUse cycle hook
# reads `.context-usage` left behind by a prior session and blocks the very
# first Edit before the status line has a chance to write fresh, current-
# session data. See tests/spike/cycling-failure-modes.md F1.
#
# Configured in .claude/settings.json with matcher "" so it runs on both
# `claude` (startup) and `claude --continue` (resume) invocations.
#
# Consumes stdin (hook input JSON) silently. Never blocks. Always exits 0.

set -euo pipefail
trap 'exit 0' ERR

cat >/dev/null 2>&1 || true

rm -f .context-usage .sprint-tool-count 2>/dev/null || true

exit 0

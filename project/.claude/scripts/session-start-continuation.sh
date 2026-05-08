#!/usr/bin/env bash
# session-start-continuation.sh — SessionStart hook. If a continuation file
# exists from a prior context-cycle exit, inject its contents into the new
# session via stdout (Claude Code pipes hook stdout into the session context).
#
# Consume-once semantics: after reading, delete the continuation file and
# signal file so a subsequent session doesn't see stale state.
#
# Configured in .claude/settings.json under TWO matcher entries — "startup"
# AND "resume" — so this hook fires on both `claude` (fresh) and `claude
# --continue` (resume) invocations. F3 fix (S9-005): a prior version was
# registered only under "startup", so resume-mode launches silently skipped
# the auto-injection. Consume-once semantics (delete-after-read) make it
# safe to register under multiple matchers.

set -euo pipefail

CONT_FILE=".sprint-continuation.md"
SIGNAL_FILE=".sprint-continue-signal"

# Consume stdin (hook input JSON) silently — we don't need it for this hook.
cat >/dev/null 2>&1 || true

# No continuation file = nothing to inject = silent exit
if [ ! -f "$CONT_FILE" ]; then
  exit 0
fi

# Emit the continuation content wrapped in a clear banner so Claude recognizes
# it as prior-session state and not user input.
cat <<EOF
CONTEXT CYCLE RESUME — the prior session terminated under context pressure.
The block below is the continuation state written by the SessionEnd hook.
Read it, then continue from where work left off. Do NOT re-plan; do NOT
re-derive sprint state — the continuation file is the authoritative handoff.

--- BEGIN CONTINUATION ---
EOF

cat "$CONT_FILE"

cat <<EOF
--- END CONTINUATION ---

Now run \`TaskList\` to see the authoritative in-progress task state and
continue sprint execution per the sprint-workflow rule.
EOF

# Consume-once: remove the files so a future startup doesn't re-inject stale state
rm -f "$CONT_FILE" "$SIGNAL_FILE" 2>/dev/null || true

exit 0

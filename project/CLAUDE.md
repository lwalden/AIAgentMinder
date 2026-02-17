# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise -- every line costs context tokens.

@AGENTS.md

---

## Governance Hooks (Claude Code only)

Four hooks run automatically (configured in `.claude/settings.json`):
- **Stop:** Updates PROGRESS.md timestamp and creates a git checkpoint commit (feature branches only)
- **SessionStart:** Re-injects PROGRESS.md and DECISIONS.md after context compaction
- **PostToolUse:** Auto-runs formatters after file edits (if available)

# How It Works

## The Context System

Four files work together:

| File | Role | Analogy |
|------|------|---------|
| `CLAUDE.md` | Behavioral rules and workflow | Employee handbook |
| `PROGRESS.md` | Current state and session memory | Daily standup notes |
| `DECISIONS.md` | Architectural decision log | Meeting minutes |
| `docs/strategy-roadmap.md` | Project goals and architecture | Product brief |

Claude reads `CLAUDE.md` automatically every session. PROGRESS.md and DECISIONS.md are injected by the SessionStart hook.

## Session Continuity

**Starting:** The SessionStart hook injects PROGRESS.md (tasks, blockers, priorities) and DECISIONS.md automatically. Claude checks `git status` for uncommitted work, then resumes from priorities.

**During:** Code written to files immediately. Commits at natural checkpoints. Feature branches only. Use Claude's native Tasks for complex multi-step work.

**Ending:** Run `/handoff` to write a clear briefing for the next session. Stop hooks handle timestamp and auto-commit automatically.

**Unexpected end / compaction:** The PreCompact hook saves PROGRESS.md state before context compression. The SessionStart hook re-injects everything when the session continues.

## Context Budget

| File | Target Lines | Read Frequency |
|------|-------------|---------------|
| CLAUDE.md | ~70 | Every session (auto) |
| PROGRESS.md | ~20 active | Every session (hook-injected) |
| DECISIONS.md | Grows over time | Hook-injected when decisions exist |
| strategy-roadmap.md | ~40 | On-demand |

PROGRESS.md self-trims: Claude keeps only 3 session notes, dropping older ones (preserved in git history).

## Commands

| Command | Purpose | Modifies Files? |
|---------|---------|----------------|
| `/setup` | Initialize a project from the template (run from AIAgentMinder repo) | Yes |
| `/plan` | Create or update strategy-roadmap.md interactively | Yes |
| `/handoff` | End-of-session: write briefing for next session, update tracking, commit | Yes |

## Safety

`.claude/settings.json` ships a deny list blocking dangerous operations. Claude Code's default permission system handles everything else.

**Explicitly denied:** `rm -rf /` / `~` / `C:` / `.`, `git push --force`, `git reset --hard origin`, `git clean -fd`, `chmod -R 777`.

## Governance Hooks

Five cross-platform hooks (Node.js) configured in `settings.json`:

| Hook | Event | Script |
|------|-------|--------|
| PROGRESS.md timestamp | Stop | `session-end-timestamp.js` |
| Auto-commit checkpoint | Stop | `session-end-commit.js` |
| Pre-compaction state save | PreCompact | `pre-compact-save.js` |
| Context re-injection + task hydration | SessionStart | `session-start-context.js` |

The auto-commit hook only runs on feature branches and stages only tracked files. It respects git hooks (no `--no-verify`).

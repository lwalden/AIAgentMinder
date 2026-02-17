# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise -- every line costs context tokens.
>
> **Reading order:** PROGRESS.md first → DECISIONS.md before architectural choices → other docs on-demand.

---

## Session Protocol

### Starting a Session
1. Read `PROGRESS.md` -- understand current state and priorities
2. Run `git status` -- check for uncommitted work
3. Run `gh pr list` -- check for open PRs awaiting review
4. Check "Blockers" section -- ask user about pending items
5. Resume from "Next Priorities" in PROGRESS.md

### During a Session
- Write code to files immediately -- don't accumulate changes in memory
- Commit at natural checkpoints (compiles, tests pass, logical unit complete)
- Prefer smaller, frequent commits over one large commit

### Ending a Session
Run `/checkpoint` or manually update PROGRESS.md and DECISIONS.md, then commit.

---

## Project Identity

**Project:** [Project Name]
**Description:** [Brief description]
**Type:** [web-app | api | cli-tool | library | mobile-app | other]
**Stack:** [Language / Framework / Database / etc.]

**Developer Profile:**
- [Experience level and tech expertise]
- [Risk tolerance: conservative / medium / aggressive]

---

## MVP Goals

<!-- Populated by /plan with Phase 1 deliverables -->

---

## Behavioral Rules

### Git Workflow
- **Never commit directly to main** -- always use feature branches
- Branch naming: `feature/short-description`, `fix/short-description`, `chore/short-description`
- All changes via PR. Claude creates PRs; human reviews and merges

### Credentials
- Never store credentials in code. Use `.env` files (gitignored).

### Autonomy Boundaries
**You CAN autonomously:** Create files, install packages, run builds/tests, create branches and PRs, scaffold code
**Ask the human first:** Create GitHub repos, merge PRs, sign up for services, provide API keys, approve major architectural changes

### Verification-First Development
- Confirm requirements before implementing
- Write tests appropriate to the project's quality tier (see strategy-roadmap.md)
- When Standard tier or above: write failing tests first, then implement

---

## Context Budget

| File | Target Size | Action if Exceeded |
|------|------------|-------------------|
| CLAUDE.md | ~80 lines | Don't add without removing something |
| PROGRESS.md | ~20 lines active | Self-trimming: only 3 session notes kept |
| DECISIONS.md | Grows over time | Delete superseded entries (git history preserves them) |

**Reading Strategy:**
- PROGRESS.md: Every session (first thing)
- DECISIONS.md: Before architectural choices
- strategy-roadmap.md: On-demand


---

## Governance Hooks

Four hooks run automatically (configured in `.claude/settings.json`):
- **Stop:** Updates PROGRESS.md timestamp and creates a git checkpoint commit (feature branches only)
- **SessionStart:** Re-injects PROGRESS.md and DECISIONS.md after context compaction
- **PostToolUse:** Auto-runs formatters after file edits (if available)

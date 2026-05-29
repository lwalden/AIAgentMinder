# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise — every line costs context tokens.

## Project Identity

**Project:** aiagentminder
**Description:** An opinionated governance layer for Claude Code, built for solo developers — agents, skills, hooks, and templates installable via the plugin marketplace
**Type:** claude-code-plugin
**Stack:** Markdown / Bash (hook scripts) / Node.js (test harness + `lib/validate.js` only)

**Developer Profile:**

- Experienced developer, familiar with Claude Code internals
- Medium autonomy — confirm architectural changes; proceed freely on doc and command file edits

### Current State

v5.1 shipped — see `docs/strategy-roadmap.md` and `CHANGELOG.md` for the running state of versions, sprints, and roadmap.

### Git / PR state — verify, don't assume

After a user says "merged" (or after any pause), refetch and check before continuing to operate on a branch as if its PR were still open. Don't update PR descriptions or treat merged branches as PRs-in-flight. Before adding commits to a branch with a closed/merged PR, decide: new PR, or restart the branch. Check `gh pr list` / `git log origin/main..HEAD` first.

### Behavioral Rules

#### Source of Truth

- `agents/`, `skills/<name>/SKILL.md`, `bin/`, `hooks/hooks.json`, `.claude-plugin/` — the **plugin payload** that ships to users via the marketplace
- `templates/` — the **bootstrap files** copied into target projects by `/aiagentminder:setup` (e.g. `CLAUDE.md`, `DECISIONS.md`, `BACKLOG.md`, `SPRINT.md`, `docs/strategy-roadmap.md`, `.claude/rules/*`)
- Root-level files in this repo (this `CLAUDE.md`, `DECISIONS.md`, `README.md`, etc.) — govern THIS repo only; not installed anywhere

Never edit `templates/` files and the equivalent root files as if they're the same thing. Changes to what target projects receive go in `templates/`. Changes to how we work on this repo go in the matching root file.

#### Scope

`docs/strategy-roadmap.md` is the authoritative scope document, matching the convention used in target projects.

#### Decision Recording

Log significant decisions in `DECISIONS.md`.

## Context Budget

**Always loaded:** CLAUDE.md — keep under ~50 lines; don't add without removing something

**On-demand:** DECISIONS.md — add `@DECISIONS.md` here to auto-load if working on architecture

# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise — every line costs context tokens.

## Project Identity

**Project:** aiagentminder
**Description:** Claude Code project governance framework — installable template commands, rules, and hooks
**Type:** cli-tool
**Stack:** Markdown / Node.js (CLI only) / Bash (scripts)

**Developer Profile:**

- Experienced developer, familiar with Claude Code internals
- Medium autonomy — confirm architectural changes; proceed freely on doc and command file edits

## Current State

v3.3 shipped. npm/npx installer, codebase fingerprinting, architecture fitness defaults, plugin marketplace, GitHub Releases. See docs/strategy-roadmap.md for details.

## Behavioral Rules

### Source of Truth

- `project/` — installable template; these files are copied to target projects by `/aam-setup`
- `.claude/commands/` at repo root — meta-commands only (`aam-setup.md`, `aam-update.md`)
- `.claude/rules/` at repo root — governs THIS repo's sessions; not installed to targets

Never edit `project/` files and the root governance files as if they're the same thing. Changes to the template go in `project/`. Changes to how we work on this repo go in `.claude/rules/`.

### Scope

`docs/strategy-roadmap.md` is the authoritative scope document, matching the convention used in target projects.

### Git Workflow

See `.claude/rules/git-workflow.md` — loaded natively by Claude Code each session.

### Decision Recording

Log significant decisions in DECISIONS.md. Key architectural decisions are already recorded there.

## Context Budget

**Always loaded:** CLAUDE.md — keep under ~50 lines; don't add without removing something

**On-demand:** DECISIONS.md — add `@DECISIONS.md` here to auto-load if working on architecture

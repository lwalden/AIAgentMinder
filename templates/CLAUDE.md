# CLAUDE.md - Project Instructions

> Claude reads this file automatically at the start of every session.
> Keep it concise — every line costs context tokens.
> Use `claude --continue` to restore the previous session's full message history.

## Project Identity

**Project:** [Project Name]
**Description:** [Brief description]
**Type:** [web-app | api | cli-tool | library | mobile-app | other]
**Stack:** [Language / Framework / Database / etc.]

**Developer Profile:**

- [Experience level and tech expertise]
- [Risk tolerance: conservative / medium / aggressive]

## MVP Goals

<!-- Populated by /aam-brief with Phase 1 deliverables -->

## Behavioral Rules

### Git Workflow

See `.claude/rules/git-workflow.md` — loaded natively by Claude Code each session.

### Autonomy Boundaries

**You CAN autonomously:** Create files, install packages, run builds/tests, create branches and PRs, scaffold code, install and use CLI tools, query cloud services and APIs

**Only when explicitly asked:** Merge PRs

**Ask the human first:** Create GitHub repos, sign up for services, provide API keys, approve major architectural changes

**Tool-first rule:** See `.claude/rules/tool-first.md` — never ask the user to do something you can do with a tool

### Verification-First Development

- Write failing tests first, then implement
- Run the full test suite before every commit

### Decision Recording

- Record significant architectural decisions in DECISIONS.md (library choices, API contracts, auth approach, data model changes, deploy decisions)
- Record known shortcuts and workarounds in the Known Debt section of DECISIONS.md
- Include alternatives considered — a decision without alternatives is an assertion, not a record
- To auto-load DECISIONS.md every session, add `@DECISIONS.md` to this file

## Context Budget

> Use `/context` for real-time context usage and optimization tips.

**Always loaded:** CLAUDE.md — keep under ~50 lines; don't add without removing something

**On-demand:** DECISIONS.md — add `@DECISIONS.md` here to auto-load; delete superseded entries

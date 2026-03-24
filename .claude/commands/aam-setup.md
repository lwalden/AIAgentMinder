# /aam-setup - Project Initialization

You are running this command from the **AIAgentMinder template repository**. Your job is to help the user set up AIAgentMinder in a target project by copying and customizing the template files from the `project/` directory in this repo.

Follow these steps in order. Ask questions in grouped batches, not one at a time.

---

## Step 1: Determine Scenario

Ask the user which applies:

**A) Add to an existing repository** -- The user has a repo with code already. You'll add template files without overwriting their existing work.
**B) Initialize in a directory** -- The user has a blank or near-blank directory (with or without `git init`). You'll set up files here.

For both: ask the user for the **full path** to the target directory.

For scenario B in the current directory: confirm with the user -- "This will set up AIAgentMinder files in this template repository's directory. Is that what you want, or did you mean to target a different project?"

---

## Step 2: Gather Project Identity

Ask all of these in one grouped prompt:

1. **Project name** (short, kebab-case friendly)
2. **One-sentence description** of what it does
3. **Project type:** web-app | api | cli-tool | library | mobile-app | other
4. **Primary tech stack:** Language, Framework, Database, other key dependencies
5. **Developer profile:** Experience level, autonomy preference (conservative / medium / aggressive)
6. **Project scale:** Personal tool, small team tool, or public-facing product?
7. **MCP servers:** Any MCP servers? (database, browser automation, etc. -- or "none")
8. **Code quality guidance:** Enable? (TDD, review-before-commit, build-before-commit — loaded via `.claude/rules/` natively, ~18 lines per session) (y/n)
9. **Sprint planning:** Enable? (Structured issue decomposition with per-issue PRs — recommended for multi-phase projects) (y/n)
10. **Architecture fitness rules:** Enable? (Customizable structural constraints — layer boundaries, external API rules, etc.) (y/n — recommended for Rigorous/Comprehensive quality tiers)
11. **GitHub Issues sync:** Enable `/aam-sync-issues` command? Syncs current sprint issues to GitHub Issues for visibility outside Claude Code. (y/n — recommended for team projects with a GitHub remote)
12. **PR pipeline automation:** Enable `/aam-pr-pipeline`? Automatically reviews, fixes, tests, and merges PRs after creation. Requires Node.js and `gh` CLI. (y/n — recommended for any project where you create PRs from Claude Code)

---

## Step 3: Set Up Repository

The template files are in the `project/` directory of this repository. Copy them to the target location based on the scenario.

### Scenario A: Existing Repo
Copy template files into the user's repo. Before copying each file, check if it already exists:
- If it exists, ask: "You already have [file]. Should I merge, replace, or skip it?"
- Never overwrite without asking
- Always copy `.claude/` directory (commands, settings, hooks)

### Scenario B: New/Blank Directory
If no git repo exists, run `git init`. Then copy all files from this repo's `project/` directory.

### Core files (always copy)

Copy these to the target unconditionally (create directories as needed).

**Note:** Copy `project/.claude/settings.json` as part of the `.claude/` directory. After copying, if PR pipeline was **not** enabled in Step 2, remove the `PostToolUse` hook entry from the copied `settings.json` — without `pr-pipeline-trigger.js` present, that entry would fire on every Bash call and fail silently.

- `project/.claude/rules/git-workflow.md` → `[target]/.claude/rules/git-workflow.md`
- `project/.claude/rules/scope-guardian.md` → `[target]/.claude/rules/scope-guardian.md`
- `project/.claude/rules/approach-first.md` → `[target]/.claude/rules/approach-first.md`
- `project/.claude/rules/debug-checkpoint.md` → `[target]/.claude/rules/debug-checkpoint.md`
- `project/.claude/rules/tool-first.md` → `[target]/.claude/rules/tool-first.md`
- `project/.claude/rules/correction-capture.md` → `[target]/.claude/rules/correction-capture.md`
- `project/.claude/rules/README.md` → `[target]/.claude/rules/README.md`
- `project/.claude/commands/aam-brief.md` → `[target]/.claude/commands/aam-brief.md`
- `project/.claude/commands/aam-revise.md` → `[target]/.claude/commands/aam-revise.md`
- `project/.claude/commands/aam-checkup.md` → `[target]/.claude/commands/aam-checkup.md`
- `project/.claude/commands/aam-handoff.md` → `[target]/.claude/commands/aam-handoff.md`
- `project/.claude/commands/aam-quality-gate.md` → `[target]/.claude/commands/aam-quality-gate.md`
- `project/.claude/commands/aam-scope-check.md` → `[target]/.claude/commands/aam-scope-check.md`
- `project/.claude/commands/aam-self-review.md` → `[target]/.claude/commands/aam-self-review.md`
- `project/.claude/commands/aam-milestone.md` → `[target]/.claude/commands/aam-milestone.md`
- `project/.claude/commands/aam-retrospective.md` → `[target]/.claude/commands/aam-retrospective.md`
- `project/.claude/commands/aam-tdd.md` → `[target]/.claude/commands/aam-tdd.md`
- `project/.claude/commands/aam-triage.md` → `[target]/.claude/commands/aam-triage.md`
- `project/.claude/commands/aam-grill.md` → `[target]/.claude/commands/aam-grill.md`

### Optional features (based on Step 2 answers)

**Code quality guidance:** If enabled, copy `project/.claude/rules/code-quality.md` to `[target]/.claude/rules/code-quality.md`.

**Sprint planning:** If enabled:
- Copy `project/.claude/rules/sprint-workflow.md` to `[target]/.claude/rules/sprint-workflow.md`
- Copy `project/SPRINT.md` to `[target]/SPRINT.md`

**Architecture fitness rules:** If enabled:
- Copy `project/.claude/rules/architecture-fitness.md` to `[target]/.claude/rules/architecture-fitness.md`
- Tell the user: "Architecture fitness rules copied. Open `.claude/rules/architecture-fitness.md` and replace the placeholder examples with constraints that match your project's architecture."

**GitHub Issues sync:** If enabled:

- Copy `project/.claude/commands/aam-sync-issues.md` to `[target]/.claude/commands/aam-sync-issues.md`

**PR pipeline automation:** If enabled:
- Copy `project/.claude/hooks/pr-pipeline-trigger.js` to `[target]/.claude/hooks/pr-pipeline-trigger.js`
- Copy `project/.claude/commands/aam-pr-pipeline.md` to `[target]/.claude/commands/aam-pr-pipeline.md`
- Copy `project/.pr-pipeline.json` to `[target]/.pr-pipeline.json`
- Ask: "Email address for escalation notifications? (leave blank to use PR comments only)"
  - If provided, update `notification.email` in the copied `.pr-pipeline.json`
- Tell the user: "PR pipeline installed. After `gh pr create`, a background agent will review, fix, test, and merge the PR automatically. Check `.pr-pipeline.json` to configure high-risk patterns, cycle limit, and auto-merge behavior."

---

## Step 4: Check Hook Prerequisites

The governance hooks require Node.js. Check if `node` is available:
```bash
node --version
```
If Node.js is not found, warn the user: "Governance hooks require Node.js. The hooks will be copied but won't run until Node.js is installed. You can disable them by removing the hooks section from .claude/settings.json."

---

## Step 5: Customize Files

Using the project identity from Step 2, update these files **in the target project** (not in this template repo):

### CLAUDE.md -- Project Identity Section
Replace the placeholder block with actual values:
```markdown
**Project:** [actual name]
**Description:** [actual description]
**Type:** [actual type]
**Stack:** [actual stack details]
**MCP Servers:** [list MCP servers, or omit line if none]

**Developer Profile:**
- [actual experience info]
- [actual risk tolerance]
```

### CLAUDE.md -- Sprint import (if sprint planning enabled)
Add `@SPRINT.md` after the Context Budget section in CLAUDE.md. This uses Claude Code's native `@import` syntax — it loads SPRINT.md into every session automatically when the file exists.

Also add to the Context Budget:
```
**Sprint tracking:** SPRINT.md — auto-loaded via @import; archived when sprint completes
```

### .gitignore -- Append Stack-Specific Entries
The template `.gitignore` covers secrets, IDE files, OS artifacts. Append stack-specific entries:
- **Node.js**: `node_modules/`, `dist/`, `build/`, `.next/`, `*.tsbuildinfo`
- **Python**: `__pycache__/`, `*.py[cod]`, `.venv/`, `.pytest_cache/`
- **.NET**: `bin/`, `obj/`, `*.user`, `.vs/`
- **Rust**: `target/`, `*.rs.bk`
- **Go**: `*.exe`, `*.test`, `*.out`

### docs/strategy-roadmap.md -- Set Initial Quality Tier
Based on project scale: Personal → Lightweight, Small team → Standard, Public → Rigorous.

---

## Step 6: Write Version Stamp and Initial Commit

Write the current AIAgentMinder version to the target project:
- Read the version from `project/.claude/aiagentminder-version` in this repo
- Write that version to `[target]/.claude/aiagentminder-version`

Then in the **target project directory**:
```bash
git add -A
git commit -m "chore: initialize project with AIAgentMinder"
```

---

## Step 7: Summary

Print based on what was enabled:

```
Project initialized successfully!

Created files:
- CLAUDE.md (project instructions — ~50 lines)
- DECISIONS.md (architectural decisions and known debt log)
- docs/strategy-roadmap.md (product brief template)
- .claude/settings.json (hook configuration)
- .claude/commands/aam-brief.md (/aam-brief — product brief & roadmap creation)
- .claude/commands/aam-revise.md (/aam-revise — mid-stream plan revision)
- .claude/commands/aam-checkup.md (/aam-checkup — installation health check)
- .claude/commands/aam-handoff.md (/aam-handoff — session checkpoint)
- .claude/commands/aam-quality-gate.md (/aam-quality-gate — tiered pre-PR checks)
- .claude/commands/aam-scope-check.md (/aam-scope-check — active scope governance)
- .claude/commands/aam-self-review.md (/aam-self-review — subagent code review before PR)
- .claude/commands/aam-milestone.md (/aam-milestone — project health assessment)
- .claude/commands/aam-retrospective.md (/aam-retrospective — sprint metrics and feedback)
- .claude/commands/aam-tdd.md (/aam-tdd — guided TDD workflow)
- .claude/commands/aam-triage.md (/aam-triage — structured bug triage)
- .claude/commands/aam-grill.md (/aam-grill — plan interrogation)
- .claude/hooks/ (1 Node.js hook: sprint reorientation post-compaction)
- .claude/rules/git-workflow.md (git discipline — commit, branch, PR workflow)
- .claude/rules/scope-guardian.md (scope governance — checks work against roadmap)
- .claude/rules/approach-first.md (approach-first protocol — state intent before executing)
- .claude/rules/debug-checkpoint.md (debug checkpoint — prevents debugging spirals)
- .claude/rules/tool-first.md (tool-first autonomy — use CLI/API tools instead of asking the user)
- .claude/rules/correction-capture.md (correction capture — flags repeated wrong-first-approach patterns)
- .claude/aiagentminder-version (version stamp for /aam-update)
- .gitignore (core + [stack] entries)
[if code quality enabled:]
- .claude/rules/code-quality.md (code quality guidance — TDD, review-before-commit)
[if sprint planning enabled:]
- .claude/rules/sprint-workflow.md (sprint planning workflow)
- SPRINT.md (sprint state tracking)
[if architecture fitness enabled:]
- .claude/rules/architecture-fitness.md (structural constraints — customize for your architecture)

Next steps:
1. Open Claude Code in your project directory
2. Run /aam-brief to create your product brief & roadmap
3. Run /aam-checkup to verify the installation is healthy
[if sprint planning enabled:]
4. When ready to build, say "start a sprint" or "begin Phase 1" — I'll propose issues for your review
[else:]
4. Or tell Claude "start Phase 1" if you already have a plan
```

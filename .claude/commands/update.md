# /update - Upgrade AIAgentMinder in a Target Project

You are running this command from the **AIAgentMinder template repository**. Your job is to upgrade an existing AIAgentMinder installation in a target project to match the current version of the template files in `project/`.

---

## File Taxonomy

Before touching anything, understand what each file is:

| Category | Files | Action |
|---|---|---|
| **AIAgentMinder-owned** | `.claude/hooks/*.js` (4 files), `.claude/settings.json`, `.claude/commands/handoff.md`, `.claude/commands/plan.md` | Overwrite unconditionally |
| **AIAgentMinder-owned (optional)** | `.claude/guidance/code-quality.md`, `.claude/guidance/sprint-workflow.md` | Overwrite if present; prompt to add if absent |
| **Hybrid** | `CLAUDE.md` | Surgical merge — update structural sections, preserve user content |
| **User-owned (AIAgentMinder creates initial)** | `SPRINT.md` | Never overwrite if active sprint; create from template if missing and sprint planning is enabled |
| **User-owned** | `PROGRESS.md`, `DECISIONS.md`, `docs/strategy-roadmap.md`, `.gitignore` | Never touch |
| **Version stamp** | `.claude/aiagentminder-version` | Write current version at the end |

---

## Step 0: Get Target Path

Ask the user: "What is the full path to the project you want to update?"

Then confirm before proceeding:
```
I'll update AIAgentMinder files in [path].

This will overwrite:
  - .claude/hooks/ (4 Node.js hook files)
  - .claude/settings.json
  - .claude/commands/handoff.md and plan.md
  - .claude/guidance/ (existing guidance files only — not adding new ones without asking)
  - CLAUDE.md (structural sections only — Project Identity and MVP Goals preserved)

You'll be prompted about:
  - New optional features not yet enabled (code quality guidance, sprint planning)

These will NOT be touched:
  - PROGRESS.md, DECISIONS.md, docs/strategy-roadmap.md, .gitignore
  - SPRINT.md (if active sprint exists)

Proceed? (y/n)
```

Stop if the user says no.

---

## Step 1: Check Installed Version

Read `[target]/.claude/aiagentminder-version`.

Read the current version from `project/.claude/aiagentminder-version` in this repo.

- **Version file found:** Display "Installed version: X.Y.Z → updating to A.B.C"
  - If versions match: tell the user "Already at vA.B.C — no update needed. Run anyway? (y/n)" and stop if they say no.
- **Version file not found:** Warn the user:
  > "No version stamp found. This project was installed before versioning was added (pre-0.5.2). Treating as outdated and proceeding carefully. A version stamp will be written at the end."

---

## Step 2: Overwrite AIAgentMinder-Owned Files

Copy each file from `project/` in this repo to the target, overwriting whatever is there:

```
project/.claude/hooks/session-end-timestamp.js  →  [target]/.claude/hooks/session-end-timestamp.js
project/.claude/hooks/session-end-commit.js     →  [target]/.claude/hooks/session-end-commit.js
project/.claude/hooks/session-start-context.js  →  [target]/.claude/hooks/session-start-context.js
project/.claude/hooks/pre-compact-save.js       →  [target]/.claude/hooks/pre-compact-save.js
project/.claude/settings.json                   →  [target]/.claude/settings.json
project/.claude/commands/handoff.md             →  [target]/.claude/commands/handoff.md
project/.claude/commands/plan.md                →  [target]/.claude/commands/plan.md
```

Print each file as it's updated: "✓ Updated: .claude/hooks/session-end-commit.js"

Then handle optional guidance files:

### code-quality.md
- If `[target]/.claude/guidance/code-quality.md` **exists**: overwrite from `project/.claude/guidance/code-quality.md`. Print "✓ Updated: .claude/guidance/code-quality.md"
- If **absent**: prompt "Code quality guidance is available (new in this version). Enable? Adds TDD, review-before-commit, and build-before-commit instructions (~18 lines of context per session). (y/n)"
  - If yes: create `[target]/.claude/guidance/` directory if needed, copy `project/.claude/guidance/README.md` and `project/.claude/guidance/code-quality.md`. Print "✓ Added: .claude/guidance/code-quality.md"
  - If no: Print "⊘ Skipped: code quality guidance (not enabled)"

### sprint-workflow.md
- If `[target]/.claude/guidance/sprint-workflow.md` **exists**: overwrite from `project/.claude/guidance/sprint-workflow.md`. Print "✓ Updated: .claude/guidance/sprint-workflow.md"
  - Then check SPRINT.md (see below).
- If **absent**: prompt "Sprint planning is available (new in this version). Structured issue decomposition with per-issue PRs. Enable? (y/n)"
  - If yes: create `[target]/.claude/guidance/` directory if needed, copy `project/.claude/guidance/README.md` (if not already copied) and `project/.claude/guidance/sprint-workflow.md`. Create `SPRINT.md` from template if missing. Print "✓ Added: .claude/guidance/sprint-workflow.md"
  - If no: Print "⊘ Skipped: sprint planning (not enabled)"

### SPRINT.md
- If sprint-workflow.md was updated or added AND `[target]/SPRINT.md` does **not** exist: create from `project/SPRINT.md`. Print "✓ Created: SPRINT.md"
- If `[target]/SPRINT.md` exists with an active sprint (`**Status:** in-progress`): do **not** overwrite. Print "⚠ SPRINT.md has an active sprint — not modified"
- If `[target]/SPRINT.md` exists with placeholder or archived content: leave it alone (no action needed)

---

## Step 3: Surgical Merge of CLAUDE.md

Read both files:
- **Template:** `project/CLAUDE.md` from this repo
- **Installed:** `[target]/CLAUDE.md`

The structural sections **owned by AIAgentMinder** (safe to update):
- `## Session Protocol` and all its subsections
- `## Behavioral Rules` and all its subsections
- `## Context Budget` (table + Reading Strategy)

The user-owned sections **never to touch**:
- `## Project Identity` block
- `## MVP Goals` block
- Any `##` section in the installed file that doesn't exist in the template (user additions)

### Merge procedure

For each structural section:
1. Extract the section content from both template and installed file
2. If identical: skip, note "unchanged"
3. If different: show a brief plain-English summary of what changed (not a raw diff), then confirm: "Apply this update to `## [Section Name]`? (y/n)"
4. Apply only confirmed changes

After all sections: "CLAUDE.md: updated N section(s), preserved Project Identity and MVP Goals."

If the installed `CLAUDE.md` is missing a structural section that exists in the template (e.g. a new section added in this version), append it after the last structural section, before any user sections.

**Note on SPRINT.md in Context Budget:** If sprint planning was added during this update (sprint-workflow.md was absent and user said yes), also add the SPRINT.md row to the Context Budget table and the Reading Strategy line in CLAUDE.md.

---

## Step 4: Write Version Stamp

Write the current version to `[target]/.claude/aiagentminder-version`:
```
[current version from project/.claude/aiagentminder-version]
```

---

## Step 5: Check Node.js

Run `node --version` in the target project directory.

If Node.js is not found: warn the user that the governance hooks require Node.js and will not run until it's installed.

---

## Step 6: Commit in Target Project

```bash
cd [target]
git add .claude/ CLAUDE.md
git commit -m "chore: update AIAgentMinder to v[new version]"
```

If the target project has uncommitted changes beyond what we just updated, warn the user before committing: "There are other uncommitted changes in this project. The commit above will include them. Proceed? (y/n)"

---

## Step 7: Print Summary

```
AIAgentMinder updated: v[old] → v[new]  (or: unknown → v[new])

Updated:
- .claude/hooks/ (4 files)
- .claude/settings.json
- .claude/commands/handoff.md
- .claude/commands/plan.md
- CLAUDE.md ([N] section(s) updated, Project Identity preserved)
- .claude/aiagentminder-version

Optional features:
[list each of: ✓ Updated / ✓ Added / ⊘ Skipped / ⚠ Active sprint preserved]
- .claude/guidance/code-quality.md
- .claude/guidance/sprint-workflow.md
- SPRINT.md

Not touched (user-owned):
- PROGRESS.md
- DECISIONS.md
- docs/strategy-roadmap.md
- .gitignore

Next: open Claude Code in [target] — your session continuity and governance are now current.
```

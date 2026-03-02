# /update - Upgrade AIAgentMinder in a Target Project

You are running this command from the **AIAgentMinder template repository**. Your job is to upgrade an existing AIAgentMinder installation in a target project to match the current version of the template files in `project/`.

---

## File Taxonomy

Before touching anything, understand what each file is:

| Category | Files | Action |
|---|---|---|
| **AIAgentMinder-owned** | `.claude/hooks/compact-reorient.js`, `.claude/settings.json`, `.claude/commands/handoff.md`, `.claude/commands/brief.md`, `.claude/commands/quality-gate.md`, `.claude/rules/git-workflow.md`, `.claude/rules/scope-guardian.md` | Overwrite unconditionally |
| **AIAgentMinder-owned (optional)** | `.claude/rules/code-quality.md`, `.claude/rules/sprint-workflow.md`, `.claude/rules/architecture-fitness.md` | Overwrite if present; prompt to add if absent |
| **Obsolete (v0.6.0 → v0.7.0)** | `.claude/hooks/session-start-context.js`, `.claude/hooks/session-end-timestamp.js`, `.claude/hooks/pre-compact-save.js`, `.claude/guidance/` directory | Delete during migration |
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
  - .claude/hooks/ (1 Node.js hook file: compact-reorient.js)
  - .claude/settings.json
  - .claude/commands/handoff.md, brief.md, quality-gate.md
  - .claude/rules/git-workflow.md, scope-guardian.md (always-active governance rules)
  - .claude/rules/ (existing optional rules files only — not adding new ones without asking)
  - CLAUDE.md (structural sections only — Project Identity and MVP Goals preserved)

[If upgrading from v0.6.0, these will also be removed:]
  - .claude/hooks/session-start-context.js (replaced by native .claude/rules/ loading)
  - .claude/hooks/session-end-timestamp.js (PROGRESS.md timestamp no longer needed)
  - .claude/hooks/pre-compact-save.js (replaced by compact-matcher hook)
  - .claude/guidance/ directory (migrated to .claude/rules/)

You'll be prompted about:
  - New optional features not yet enabled (code quality guidance, sprint planning, architecture fitness rules)

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

### v0.7.0 Migration: Remove Stop Hook and Rename /plan to /brief

Check if any of these exist in the target. If so, handle them:

```
[target]/.claude/hooks/session-end-commit.js   → DELETE (replaced by .claude/rules/git-workflow.md)
[target]/.claude/commands/plan.md              → DELETE (renamed to brief.md)
```

For each deleted file, print: `✓ Removed (obsolete): .claude/hooks/session-end-commit.js`

If `[target]/.claude/commands/plan.md` is deleted: print `✓ Renamed: .claude/commands/plan.md → brief.md (new file will be written in next step)`

Also update the Stop hook entry in `[target]/.claude/settings.json` if it references `session-end-commit.js` — the settings.json file will be overwritten in the copy step below, so this is handled automatically.

### v0.6.0 Migration: Remove Obsolete Files

Check if any of these exist in the target. If so, delete them:

```
[target]/.claude/hooks/session-start-context.js   → DELETE (replaced by native .claude/rules/ loading)
[target]/.claude/hooks/session-end-timestamp.js   → DELETE (PROGRESS.md timestamp no longer maintained)
[target]/.claude/hooks/pre-compact-save.js         → DELETE (replaced by compact-matcher hook)
```

For each deleted file, print: `✓ Removed (obsolete): .claude/hooks/session-start-context.js`

### v0.6.0 Migration: Migrate guidance/ → rules/

If `[target]/.claude/guidance/code-quality.md` exists:
- Copy `project/.claude/rules/code-quality.md` to `[target]/.claude/rules/code-quality.md` (create `.claude/rules/` if needed)
- Delete `[target]/.claude/guidance/code-quality.md`
- Print: `✓ Migrated: .claude/guidance/code-quality.md → .claude/rules/code-quality.md`

If `[target]/.claude/guidance/sprint-workflow.md` exists:
- Copy `project/.claude/rules/sprint-workflow.md` to `[target]/.claude/rules/sprint-workflow.md`
- Delete `[target]/.claude/guidance/sprint-workflow.md`
- Print: `✓ Migrated: .claude/guidance/sprint-workflow.md → .claude/rules/sprint-workflow.md`

If `[target]/.claude/guidance/README.md` exists: delete it silently.

If `[target]/.claude/guidance/` directory is now empty (or only had the above files): remove the directory.
Print: `✓ Removed (obsolete): .claude/guidance/ directory`

### Copy Current Hook and Command Files

Copy each file from `project/` in this repo to the target, overwriting whatever is there:

```
project/.claude/hooks/compact-reorient.js              →  [target]/.claude/hooks/compact-reorient.js
project/.claude/settings.json                          →  [target]/.claude/settings.json
project/.claude/commands/handoff.md                    →  [target]/.claude/commands/handoff.md
project/.claude/commands/brief.md                      →  [target]/.claude/commands/brief.md
project/.claude/commands/quality-gate.md               →  [target]/.claude/commands/quality-gate.md
project/.claude/rules/git-workflow.md                  →  [target]/.claude/rules/git-workflow.md
project/.claude/rules/scope-guardian.md                →  [target]/.claude/rules/scope-guardian.md
```

Print each file as it's updated: `✓ Updated: .claude/hooks/session-end-commit.js`

Also copy `project/.claude/rules/README.md` to `[target]/.claude/rules/README.md` if `.claude/rules/` exists in the target.

Then handle optional rules files:

### code-quality.md
- If `[target]/.claude/rules/code-quality.md` **exists** (including just-migrated): overwrite from `project/.claude/rules/code-quality.md`. Print `✓ Updated: .claude/rules/code-quality.md`
- If **absent**: prompt "Code quality guidance is available. Enable? Adds TDD, review-before-commit, and build-before-commit instructions (~18 lines, loaded natively via .claude/rules/). (y/n)"
  - If yes: create `[target]/.claude/rules/` directory if needed, copy `project/.claude/rules/README.md` and `project/.claude/rules/code-quality.md`. Print `✓ Added: .claude/rules/code-quality.md`
  - If no: Print `⊘ Skipped: code quality guidance (not enabled)`

### sprint-workflow.md
- If `[target]/.claude/rules/sprint-workflow.md` **exists** (including just-migrated): overwrite from `project/.claude/rules/sprint-workflow.md`. Print `✓ Updated: .claude/rules/sprint-workflow.md`
  - Then check SPRINT.md (see below).
- If **absent**: prompt "Sprint planning is available. Structured issue decomposition with per-issue PRs. Enable? (y/n)"
  - If yes: create `[target]/.claude/rules/` directory if needed, copy `project/.claude/rules/README.md` (if not already copied) and `project/.claude/rules/sprint-workflow.md`. Create `SPRINT.md` from template if missing. Print `✓ Added: .claude/rules/sprint-workflow.md`
  - If no: Print `⊘ Skipped: sprint planning (not enabled)`

### SPRINT.md
- If sprint-workflow.md was updated or added AND `[target]/SPRINT.md` does **not** exist: create from `project/SPRINT.md`. Print `✓ Created: SPRINT.md`
- If `[target]/SPRINT.md` exists with an active sprint (`**Status:** in-progress`): do **not** overwrite. Print `⚠ SPRINT.md has an active sprint — not modified`
- If `[target]/SPRINT.md` exists with placeholder or archived content: leave it alone (no action needed)

### architecture-fitness.md
- If `[target]/.claude/rules/architecture-fitness.md` **exists**: overwrite from `project/.claude/rules/architecture-fitness.md`. Print `✓ Updated: .claude/rules/architecture-fitness.md`
- If **absent**: prompt "Architecture fitness rules are available. These are structural constraints (layer boundaries, external API rules, etc.) that you customize for your project. Enable? (y/n)"
  - If yes: copy `project/.claude/rules/architecture-fitness.md`. Print `✓ Added: .claude/rules/architecture-fitness.md`. Tell the user: "Open `.claude/rules/architecture-fitness.md` and replace the placeholder examples with your project's architectural constraints."
  - If no: Print `⊘ Skipped: architecture fitness rules (not enabled)`

---

## Step 3: Surgical Merge of CLAUDE.md

Read both files:
- **Template:** `project/CLAUDE.md` from this repo
- **Installed:** `[target]/CLAUDE.md`

The structural sections **owned by AIAgentMinder** (safe to update):
- `## Behavioral Rules` and all its subsections
- `## Context Budget` (table only)

The user-owned sections **never to touch**:
- `## Project Identity` block
- `## MVP Goals` block
- Any `##` section in the installed file that doesn't exist in the template (user additions)

### v0.6.0 → v0.7.0 CLAUDE.md Migration

In addition to the standard section merge, perform these one-time migration steps:

1. **Remove `## Session Protocol` section entirely** — look for the section starting with `## Session Protocol` and delete it and all its subsections through the next `##` heading. Print: `✓ Removed: ## Session Protocol (replaced by native Session Memory + claude --continue)`

2. **Remove the `> **Reading order:**` blockquote** from the header block if present.

3. **Add `claude --continue` hint to header** — add this line to the header blockquote block:
   `> Use \`claude --continue\` to restore the previous session's full message history.`

4. **Remove PROGRESS.md and DECISIONS.md rows from Context Budget table** — these are no longer auto-injected. (The CLAUDE.md template no longer includes them.)

5. **Remove `Reading Strategy:` subsection** from Context Budget if present — this was the bullet list describing injection frequency.

6. **Add `### Decision Recording` to `## Behavioral Rules`** if not already present — add it as the last subsection of Behavioral Rules with this content:
   ```
   ### Decision Recording
   - Record significant architectural decisions in DECISIONS.md (library choices, API contracts, auth approach, data model changes, deploy decisions)
   - Include alternatives considered — a decision without alternatives is an assertion, not a record
   - To auto-load DECISIONS.md every session, add `@DECISIONS.md` to this file
   ```

7. **Sprint planning @import** — Detect whether sprint planning is enabled:
   - Check if `[target]/.claude/rules/sprint-workflow.md` exists (after migration above)
   - OR check if the old installed CLAUDE.md had a SPRINT.md row in the Context Budget table
   - If sprint planning was enabled: add `@SPRINT.md` to CLAUDE.md after the Context Budget table (if not already present). This replaces the old hook injection mechanism.

### Standard Merge Procedure

For each structural section (`## Behavioral Rules`, `## Context Budget`):
1. Extract the section content from both template and installed file
2. If identical: skip, note "unchanged"
3. If different: show a brief plain-English summary of what changed (not a raw diff), then confirm: "Apply this update to `## [Section Name]`? (y/n)"
4. Apply only confirmed changes

After all sections: "CLAUDE.md: updated N section(s), preserved Project Identity and MVP Goals."

If the installed `CLAUDE.md` is missing a structural section that exists in the template (e.g. a new section added in this version), append it after the last structural section, before any user sections.

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
- .claude/hooks/ (1 file: compact-reorient.js)
- .claude/settings.json
- .claude/commands/handoff.md
- .claude/commands/brief.md
- .claude/commands/quality-gate.md
- .claude/rules/git-workflow.md
- .claude/rules/scope-guardian.md
- CLAUDE.md ([N] section(s) updated, Project Identity preserved)
- .claude/aiagentminder-version

Optional features:
[list each of: ✓ Updated / ✓ Added / ⊘ Skipped / ⚠ Active sprint preserved]
- .claude/rules/code-quality.md
- .claude/rules/sprint-workflow.md
- SPRINT.md
- .claude/rules/architecture-fitness.md

[If migrating from v0.7.0:]
Migration actions:
[list each of: ✓ Removed / ✓ Renamed for each obsolete file that was found]
- .claude/hooks/session-end-commit.js (auto-commit removed — use git-workflow.md rule instead)
- .claude/commands/plan.md (renamed to brief.md — avoids collision with native Plan Mode)

[If migrating from v0.6.0:]
Migration actions:
[list each of: ✓ Removed / ✓ Migrated for each obsolete file that was found]
- .claude/hooks/session-start-context.js
- .claude/hooks/session-end-timestamp.js
- .claude/hooks/pre-compact-save.js
- .claude/guidance/ directory

Not touched (user-owned):
- PROGRESS.md
- DECISIONS.md
- docs/strategy-roadmap.md
- .gitignore

Next: open Claude Code in [target] — your project governance is now current.
Use `claude --continue` to restore your previous session, or start a new one.
```

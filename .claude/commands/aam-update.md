# /aam-update - Upgrade AIAgentMinder in a Target Project

You are running this command from the **AIAgentMinder template repository**. Your job is to upgrade an existing AIAgentMinder installation in a target project to match the current version of the template files in `project/`.

---

## File Taxonomy

Before touching anything, understand what each file is:

| Category | Files | Action |
|---|---|---|
| **AIAgentMinder-owned** | `.claude/hooks/compact-reorient.js`, `.claude/settings.json`, `.claude/commands/aam-handoff.md`, `.claude/commands/aam-brief.md`, `.claude/commands/aam-checkup.md`, `.claude/commands/aam-quality-gate.md`, `.claude/commands/aam-scope-check.md`, `.claude/commands/aam-self-review.md`, `.claude/commands/aam-milestone.md`, `.claude/commands/aam-retrospective.md`, `.claude/rules/git-workflow.md`, `.claude/rules/scope-guardian.md`, `.claude/rules/approach-first.md`, `.claude/rules/debug-checkpoint.md` | Overwrite unconditionally |
| **AIAgentMinder-owned (optional)** | `.claude/rules/code-quality.md`, `.claude/rules/sprint-workflow.md`, `.claude/rules/architecture-fitness.md` | Overwrite if present; prompt to add if absent |
| **Obsolete (v0.9.1 → v1.0)** | `PROGRESS.md` (if AIAgentMinder-scaffolded) | Offer to delete — see migration notes below |
| **Obsolete (v0.7.0 → v0.8.0)** | `.claude/hooks/session-end-commit.js`, `.claude/commands/plan.md` | Delete during migration |
| **Obsolete (v0.6.0 → v0.7.0)** | `.claude/hooks/session-start-context.js`, `.claude/hooks/session-end-timestamp.js`, `.claude/hooks/pre-compact-save.js`, `.claude/guidance/` directory | Delete during migration |
| **Hybrid** | `CLAUDE.md` | Surgical merge — update structural sections, preserve user content |
| **User-owned (AIAgentMinder creates initial)** | `SPRINT.md` | Never overwrite if active sprint; create from template if missing and sprint planning is enabled |
| **User-owned** | `DECISIONS.md`, `docs/strategy-roadmap.md`, `.gitignore` | Never touch |
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
  - .claude/commands/aam-handoff.md, aam-brief.md, aam-checkup.md, aam-quality-gate.md, aam-scope-check.md
  - .claude/rules/git-workflow.md, scope-guardian.md, approach-first.md, debug-checkpoint.md
  - .claude/rules/ (existing optional rules files only — not adding new ones without asking)
  - CLAUDE.md (structural sections only — Project Identity and MVP Goals preserved)

[If upgrading from v0.9.1, also:]
  - PROGRESS.md — no longer scaffolded by AIAgentMinder (see migration note below)

[If upgrading from v0.7.0, these will also be removed:]
  - .claude/hooks/session-end-commit.js (replaced by .claude/rules/git-workflow.md)
  - .claude/commands/plan.md (renamed to aam-brief.md)

[If upgrading from v0.6.0, these will also be removed:]
  - .claude/hooks/session-start-context.js
  - .claude/hooks/session-end-timestamp.js
  - .claude/hooks/pre-compact-save.js
  - .claude/guidance/ directory

You'll be prompted about:
  - New optional features not yet enabled (code quality, sprint planning, architecture fitness)
  - New always-active rules not yet present (approach-first, debug-checkpoint)

These will NOT be touched:
  - DECISIONS.md, docs/strategy-roadmap.md, .gitignore
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

## Step 2: Handle Migrations and Overwrite AIAgentMinder-Owned Files

### v0.9.1 → v1.0 Migration: PROGRESS.md

Check if `[target]/PROGRESS.md` exists. If so:

> "PROGRESS.md is no longer scaffolded by AIAgentMinder in v1.0. Session continuity is handled by native Session Memory and `--continue`. You can keep PROGRESS.md as your own file, or delete it. Delete it? (y/n)"

- If yes: delete `[target]/PROGRESS.md`. Print: `✓ Removed: PROGRESS.md (no longer AIAgentMinder-managed — session continuity is native)`
- If no: Print: `⊘ Kept: PROGRESS.md (user-owned — AIAgentMinder will not manage it going forward)`

### v0.9.1 → v1.0 Migration: CLAUDE.md Context Budget

During the CLAUDE.md merge (Step 3), simplify the Context Budget section if it contains a detailed table. The new format is two plain lines:

```
**Always loaded:** CLAUDE.md — keep under ~50 lines; don't add without removing something

**On-demand:** DECISIONS.md — add `@DECISIONS.md` here to auto-load; delete superseded entries
```

Add the tip line above the budget: `> Use \`/context\` for real-time context usage and optimization tips.`

### v0.7.0 → v0.8.0 Migration: Remove Stop Hook and Rename /plan to /aam-brief

Check if any of these exist in the target. If so, handle them:

```
[target]/.claude/hooks/session-end-commit.js   → DELETE (replaced by .claude/rules/git-workflow.md)
[target]/.claude/commands/plan.md              → DELETE (renamed to aam-brief.md)
```

For each deleted file, print: `✓ Removed (obsolete): .claude/hooks/session-end-commit.js`

### v0.6.0 → v0.7.0 Migration: Remove Obsolete Files

Check if any of these exist in the target. If so, delete them:

```
[target]/.claude/hooks/session-start-context.js   → DELETE
[target]/.claude/hooks/session-end-timestamp.js   → DELETE
[target]/.claude/hooks/pre-compact-save.js         → DELETE
```

### v0.6.0 → v0.7.0 Migration: Migrate guidance/ → rules/

If `[target]/.claude/guidance/code-quality.md` exists:
- Copy `project/.claude/rules/code-quality.md` to `[target]/.claude/rules/code-quality.md`
- Delete `[target]/.claude/guidance/code-quality.md`
- Print: `✓ Migrated: .claude/guidance/code-quality.md → .claude/rules/code-quality.md`

If `[target]/.claude/guidance/sprint-workflow.md` exists:
- Copy `project/.claude/rules/sprint-workflow.md` to `[target]/.claude/rules/sprint-workflow.md`
- Delete `[target]/.claude/guidance/sprint-workflow.md`
- Print: `✓ Migrated: .claude/guidance/sprint-workflow.md → .claude/rules/sprint-workflow.md`

If `[target]/.claude/guidance/` directory is now empty: remove it. Print: `✓ Removed (obsolete): .claude/guidance/ directory`

### Copy Current Hook and Command Files

Copy each file from `project/` in this repo to the target, overwriting whatever is there:

```
project/.claude/hooks/compact-reorient.js              →  [target]/.claude/hooks/compact-reorient.js
project/.claude/settings.json                          →  [target]/.claude/settings.json
project/.claude/commands/aam-handoff.md                    →  [target]/.claude/commands/aam-handoff.md
project/.claude/commands/aam-brief.md                      →  [target]/.claude/commands/aam-brief.md
project/.claude/commands/aam-checkup.md                    →  [target]/.claude/commands/aam-checkup.md
project/.claude/commands/aam-quality-gate.md               →  [target]/.claude/commands/aam-quality-gate.md
project/.claude/commands/aam-scope-check.md                →  [target]/.claude/commands/aam-scope-check.md
project/.claude/commands/aam-self-review.md                →  [target]/.claude/commands/aam-self-review.md
project/.claude/commands/aam-milestone.md                  →  [target]/.claude/commands/aam-milestone.md
project/.claude/commands/aam-retrospective.md              →  [target]/.claude/commands/aam-retrospective.md
project/.claude/rules/git-workflow.md                  →  [target]/.claude/rules/git-workflow.md
project/.claude/rules/scope-guardian.md                →  [target]/.claude/rules/scope-guardian.md
project/.claude/rules/approach-first.md                →  [target]/.claude/rules/approach-first.md
project/.claude/rules/debug-checkpoint.md              →  [target]/.claude/rules/debug-checkpoint.md
```

Print each file as it's updated: `✓ Updated: .claude/commands/aam-checkup.md`

Also copy `project/.claude/rules/README.md` to `[target]/.claude/rules/README.md` if `.claude/rules/` exists in the target.

Then handle optional rules files:

### code-quality.md
- If present: overwrite. Print `✓ Updated: .claude/rules/code-quality.md`
- If absent: prompt "Code quality guidance is available (TDD, review-before-commit, ~18 lines). Enable? (y/n)"

### sprint-workflow.md
- If present: overwrite. Print `✓ Updated: .claude/rules/sprint-workflow.md`
  - Then check SPRINT.md (see below).
- If absent: prompt "Sprint planning is available. Structured issue decomposition with per-issue PRs. Enable? (y/n)"

### SPRINT.md
- If sprint-workflow.md was updated or added AND `[target]/SPRINT.md` does **not** exist: create from `project/SPRINT.md`. Print `✓ Created: SPRINT.md`
- If `[target]/SPRINT.md` exists with an active sprint (`**Status:** in-progress`): do **not** overwrite. Print `⚠ SPRINT.md has an active sprint — not modified`
- If `[target]/SPRINT.md` exists with placeholder or archived content: leave it alone

### architecture-fitness.md
- If present: overwrite. Print `✓ Updated: .claude/rules/architecture-fitness.md`
- If absent: prompt "Architecture fitness rules are available (structural constraints — customize for your project). Enable? (y/n)"

---

## Step 3: Surgical Merge of CLAUDE.md

Read both files:
- **Template:** `project/CLAUDE.md` from this repo
- **Installed:** `[target]/CLAUDE.md`

The structural sections **owned by AIAgentMinder** (safe to update):
- `## Behavioral Rules` and all its subsections
- `## Context Budget`

The user-owned sections **never to touch**:
- `## Project Identity` block
- `## MVP Goals` block
- Any `##` section in the installed file that doesn't exist in the template (user additions)

### v0.9.1 → v1.0 CLAUDE.md Migration

In addition to the standard section merge, apply these one-time updates:

1. **Simplify `## Context Budget`** — Replace the existing table with the new plain-text format (see migration note in Step 2). Add the `/context` tip line above.

2. **Add Decision Recording subsection** if not already present in `## Behavioral Rules`:
   ```
   ### Decision Recording
   - Record significant architectural decisions in DECISIONS.md
   - Include alternatives considered — a decision without alternatives is an assertion, not a record
   - To auto-load DECISIONS.md every session, add `@DECISIONS.md` to this file
   ```

### Standard Merge Procedure

For each structural section (`## Behavioral Rules`, `## Context Budget`):
1. Extract the section content from both template and installed file
2. If identical: skip, note "unchanged"
3. If different: show a brief plain-English summary of what changed, then confirm: "Apply this update to `## [Section Name]`? (y/n)"
4. Apply only confirmed changes

After all sections: "CLAUDE.md: updated N section(s), preserved Project Identity and MVP Goals."

---

## Step 4: Write Version Stamp

Write the current version to `[target]/.claude/aiagentminder-version`.

---

## Step 5: Check Node.js

Run `node --version` in the target project directory. Warn if not found.

---

## Step 6: Commit in Target Project

```bash
cd [target]
git add .claude/ CLAUDE.md
git commit -m "chore: update AIAgentMinder to v[new version]"
```

If the target project has uncommitted changes beyond what we just updated, warn before committing.

---

## Step 7: Print Summary

```
AIAgentMinder updated: v[old] → v[new]  (or: unknown → v[new])

Updated:
- .claude/hooks/ (1 file: compact-reorient.js)
- .claude/settings.json
- .claude/commands/aam-handoff.md
- .claude/commands/aam-brief.md
- .claude/commands/aam-checkup.md
- .claude/commands/aam-quality-gate.md
- .claude/commands/aam-scope-check.md
- .claude/commands/aam-self-review.md
- .claude/commands/aam-milestone.md
- .claude/commands/aam-retrospective.md
- .claude/rules/git-workflow.md
- .claude/rules/scope-guardian.md
- .claude/rules/approach-first.md
- .claude/rules/debug-checkpoint.md
- CLAUDE.md ([N] section(s) updated, Project Identity preserved)
- .claude/aiagentminder-version

Optional features:
[list each of: ✓ Updated / ✓ Added / ⊘ Skipped / ⚠ Active sprint preserved]
- .claude/rules/code-quality.md
- .claude/rules/sprint-workflow.md
- SPRINT.md
- .claude/rules/architecture-fitness.md

[If migrating from v0.9.1:]
Migration actions:
- PROGRESS.md: [✓ Removed / ⊘ Kept as user-owned]
- CLAUDE.md Context Budget: simplified to plain-text format

[If migrating from v0.7.0:]
Migration actions:
[list each: ✓ Removed / ✓ Renamed]
- .claude/hooks/session-end-commit.js
- .claude/commands/plan.md → aam-brief.md

[If migrating from v0.6.0:]
Migration actions:
[list each: ✓ Removed / ✓ Migrated]
- .claude/hooks/session-start-context.js
- .claude/hooks/session-end-timestamp.js
- .claude/hooks/pre-compact-save.js
- .claude/guidance/ directory

Not touched (user-owned):
- DECISIONS.md
- docs/strategy-roadmap.md
- .gitignore

Next: open Claude Code in [target] — your project governance is now current.
Use `claude --continue` to restore your previous session, or start a new one.
Run /aam-checkup to verify the installation is healthy.
```

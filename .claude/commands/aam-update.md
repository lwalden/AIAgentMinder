# /aam-update - Upgrade AIAgentMinder in a Target Project

You are running this command from the **AIAgentMinder template repository**. Your job is to upgrade an existing AIAgentMinder installation in a target project using the CLI sync command.

---

## Step 0: Get Target Path

Ask the user: "What is the full path to the project you want to update?"

---

## Step 1: Dry Run

Run the sync command in dry-run mode to see the upgrade plan:

```bash
node bin/aam.js sync [target-path] --dry-run
```

Present the output to the user. This shows:
- Installed version → template version
- Migrations that will be applied (file deletions, renames)
- Files to add, update, merge, and skip
- Hybrid files (CLAUDE.md) that need manual merge

Ask: "Proceed with this upgrade? (y/n)"

Stop if the user says no.

---

## Step 2: Apply

Run the sync command in apply mode:

```bash
node bin/aam.js sync [target-path] --apply
```

This deterministically:
- Executes migration deletions and renames
- Copies all aam-owned files (scripts, agents, rules, skills, version stamp)
- Creates missing user-owned files (DECISIONS.md, BACKLOG.md, etc.) without overwriting existing ones
- Merges settings.json (adds AAM hooks, preserves user hooks, removes obsolete entries)
- Skips CLAUDE.md (hybrid — handled in Step 3)

---

## Step 3: CLAUDE.md Surgical Merge

This is the one step that requires judgment — the CLI skips it.

Read both files:
- **Template:** `project/CLAUDE.md` from this repo
- **Installed:** `[target]/CLAUDE.md`

**AIAgentMinder-owned sections** (safe to update):
- `## Behavioral Rules` and all its subsections
- `## Context Budget`

**User-owned sections** (never touch):
- `## Project Identity` block
- `## MVP Goals` block
- Any `##` section in the installed file that doesn't exist in the template

For each structural section:
1. Compare template vs installed
2. If identical: skip
3. If different: show a brief summary of what changed, confirm with user
4. Apply only confirmed changes

After: "CLAUDE.md: updated N section(s), preserved Project Identity and MVP Goals."

---

## Step 4: Check jq

Run `jq --version`. Warn if not found — context monitoring requires it.

---

## Step 5: Commit

```bash
cd [target]
git add .claude/ CLAUDE.md
git commit -m "chore: update AIAgentMinder to v[new version]"
```

Warn if the target has uncommitted changes beyond what was just updated.

---

## Step 6: Summary

Print a concise summary based on the sync output:

```
AIAgentMinder updated: v[old] → v[new]

The sync command handled all file operations. See the output above for details.

Hybrid (manually merged):
- CLAUDE.md: [N section(s) updated / no changes needed]

Not touched (user-owned):
- DECISIONS.md, docs/strategy-roadmap.md, .gitignore, .pr-pipeline.json

Next: open Claude Code in [target] — your project governance is now current.
Run `npx aiagentminder sync . --dry-run` to verify everything is current.
```

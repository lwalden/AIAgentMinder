# /setup - Project Initialization

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

## Step 6: Initial Commit

In the **target project directory**:
```bash
git add -A
git commit -m "chore: initialize project with AIAgentMinder"
```

---

## Step 7: Summary

Print:
```
Project initialized successfully!

Created files:
- CLAUDE.md (project instructions)
- PROGRESS.md (session tracking)
- DECISIONS.md (architectural decisions)
- docs/strategy-roadmap.md (product brief template)
- .claude/settings.json (safety deny list + hooks)
- .claude/commands/plan.md (/plan command)
- .claude/commands/handoff.md (/handoff command)
- .claude/hooks/ (5 Node.js hooks: timestamp, auto-commit, pre-compaction save, session context injection)
- .gitignore (core + [stack] entries)

Next steps:
1. Open Claude Code in your project directory
2. Run /plan to create your product brief & roadmap
3. Or tell Claude "start Phase 1" if you already have a plan
```

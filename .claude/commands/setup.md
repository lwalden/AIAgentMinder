# /setup - Project Initialization

You are running this command from the **AIAgentMinder template repository**. Your job is to help the user set up AIAgentMinder in a target project by copying and customizing the template files from the `project/` directory in this repo.

Follow these steps in order. Ask questions in grouped batches, not one at a time.

---

## Step 1: Determine Scenario

Ask the user which applies:

**A) Create a new GitHub repository** -- You'll create the repo, initialize it, and set up all files.
**B) Add to an existing repository** -- The user has a repo with code already. You'll add template files without overwriting their existing work.
**C) Create a new local project** -- No GitHub yet. You'll create the directory, run `git init`, and set up files.
**D) Initialize in current directory** -- The user already has a blank or near-blank local repo open. You'll set up files here.

For scenarios A, B, and C: ask the user for the **full path** to the target directory (or where they want it created).

For scenario D: confirm with the user -- "This will set up AIAgentMinder files in this template repository's directory. Is that what you want, or did you mean to target a different project?"

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
8. **GitHub username/org** (only for Scenario A)

---

## Step 3: Set Up Repository

The template files are in the `project/` directory of this repository. Copy them to the target location based on the scenario.

### Scenario A: New GitHub Repo
```bash
gh repo create [org/name] --public --clone
cd [name]
```
Then copy all files from this repo's `project/` directory into the new repo.

### Scenario B: Existing Repo
Copy template files into the user's repo. Before copying each file, check if it already exists:
- If it exists, ask: "You already have [file]. Should I merge, replace, or skip it?"
- Never overwrite without asking
- Always copy `.claude/` directory (commands, settings, hooks)

### Scenario C: New Local Project
```bash
mkdir -p [path]/[name]
cd [path]/[name]
git init
```
Then copy all files from this repo's `project/` directory.

### Scenario D: Current Directory
Copy all files from this repo's `project/` directory into the confirmed target directory.

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

### .claude/settings.json -- Add Stack-Specific Permissions
Append to the `allow` array based on the chosen stack:
- **Node.js**: `"Bash(npm:*)", "Bash(npx:*)", "Bash(node:*)"` (add pnpm/yarn/bun as applicable)
- **Python**: `"Bash(pip:*)", "Bash(python:*)", "Bash(pytest:*)", "Bash(uv:*)"`
- **.NET / C#**: `"Bash(dotnet:*)"`
- **Rust**: `"Bash(cargo:*)", "Bash(rustup:*)"`
- **Go**: `"Bash(go:*)"`
- **Docker**: `"Bash(docker:*)", "Bash(docker-compose:*)"`
Only add what the project actually uses.

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
git commit -m "chore: initialize project with AIAgentMinder template"
```

For Scenario A, also push:
```bash
git push -u origin main
```

---

## Step 7: Summary

Print:
```
Project initialized successfully!

Created files:
- CLAUDE.md (project instructions -- ~80 lines)
- PROGRESS.md (session tracking)
- DECISIONS.md (architectural decisions)
- docs/strategy-roadmap.md (planning template)
- .claude/settings.json (permissions + hooks)
- .claude/commands/ (2 commands: /plan, /checkpoint)
- .claude/hooks/ (4 Node.js hooks: timestamp, auto-commit, context re-injection, auto-lint)
- .gitignore (core + [stack] entries)

Next steps:
1. Open Claude Code in your new project directory
2. Run /plan to create your strategy roadmap
3. Or tell Claude "start Phase 1" if you already have a plan
```

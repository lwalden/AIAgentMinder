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

For scenario D: confirm with the user -- "This will set up AIAgentMinder files in this template repository's directory. Is that what you want, or did you mean to target a different project?" If they want a different project, ask for the path and treat it as scenario B or C.

---

## Step 2: Gather Project Identity

Ask all of these in one grouped prompt:

1. **Project name** (short, kebab-case friendly)
2. **One-sentence description** of what it does
3. **Project type:** web-app | api | cli-tool | library | mobile-app | other
4. **Primary tech stack:**
   - Language (e.g., TypeScript, Python, C#, Rust, Go)
   - Framework (e.g., Next.js, FastAPI, ASP.NET, Axum)
   - Database (if any)
   - Other key dependencies
5. **Developer profile:**
   - Experience level with chosen stack
   - How much autonomy Claude should have (conservative / medium / aggressive)
6. **Project scale:** Will this be a personal tool, a small team tool, or a public-facing product?
7. **MCP servers:** Will you be using any MCP servers? (e.g., a database MCP, browser automation, custom API integration -- or "none")
8. **GitHub username/org** (only for Scenario A)

---

## Step 3: Set Up Repository

The template files are in the `project/` directory of this repository (the AIAgentMinder repo you're currently in). Copy them to the target location based on the scenario.

### Scenario A: New GitHub Repo
```bash
gh repo create [org/name] --public --clone
cd [name]
```
Then copy all files from this repo's `project/` directory into the new repo.

### Scenario B: Existing Repo
Copy template files from this repo's `project/` directory into the user's repo. Before copying each file, check if it already exists in the target:
- If the file exists, ask the user: "You already have [file]. Should I merge the template content, replace it, or skip it?"
- Never overwrite without asking
- Always copy `.claude/` directory (commands and settings)

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

## Step 4: Customize Files

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
- [actual autonomy preference]
```

### .claude/settings.json -- Add Stack-Specific Permissions
The template starts with a minimal set of safe permissions (git, gh, basic shell utilities).
Add permissions for the chosen stack by appending to the `allow` array:
- **Node.js**: `"Bash(npm:*)", "Bash(npx:*)", "Bash(node:*)", "Bash(pnpm:*)"` (or yarn/bun)
- **Python**: `"Bash(pip:*)", "Bash(python:*)", "Bash(pytest:*)", "Bash(uv:*)"`
- **.NET / C#**: `"Bash(dotnet:*)"`
- **Rust**: `"Bash(cargo:*)", "Bash(rustup:*)"`
- **Go**: `"Bash(go:*)"`
- **Docker** (if using containers): `"Bash(docker:*)", "Bash(docker-compose:*)"`
Only add what the project actually uses.

### .gitignore -- Append Stack-Specific Entries
The template `.gitignore` covers secrets, IDE files, OS artifacts, and logs.
Append stack-specific ignores at the bottom after the marker line:

- **Node.js**: `node_modules/`, `dist/`, `build/`, `.next/`, `*.tsbuildinfo`, `.eslintcache`
- **Python**: `__pycache__/`, `*.py[cod]`, `*.egg-info/`, `.venv/`, `.mypy_cache/`, `.ruff_cache/`, `.pytest_cache/`, `htmlcov/`
- **.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `.vs/`, `*.nupkg`
- **Rust**: `target/`, `*.rs.bk`
- **Go**: `*.exe`, `*.test`, `*.out`
- **Terraform**: `.terraform/`, `*.tfstate`, `*.tfstate.*`

### docs/strategy-roadmap.md -- Set Initial Quality Tier
Based on the project scale answer from Step 2, set the quality tier placeholder:
- Personal tool → Lightweight
- Small team tool → Standard
- Public-facing product → Rigorous
This is a starting point -- `/plan` will refine it based on deeper questioning.

---

## Step 5: Initial Commit

In the **target project directory**, run:

```bash
git add -A
git commit -m "chore: initialize project with AIAgentMinder template"
```

For Scenario A, also push:
```bash
git push -u origin main
```

---

## Step 6: Summary

Print a summary like this:

```
Project initialized successfully!

Created files:
- CLAUDE.md (project instructions)
- PROGRESS.md (session tracking)
- DECISIONS.md (architectural decisions)
- docs/strategy-roadmap.md (project planning template)
- .claude/settings.json (permissions -- stack tools added)
- .claude/commands/ (4 slash commands: /plan, /status, /checkpoint, /archive)
- .gitignore (core + [stack] entries)

CI/CD: Not included. When ready, open the project in Claude Code and say:
"Set up GitHub Actions CI for this project." Claude will generate an accurate
workflow based on your actual project structure.

Next steps:
1. Open Claude Code in your new project directory
2. Close and reopen the Claude Code panel (VS Code) so new slash commands are detected
3. Run /plan to create your strategy roadmap
4. Or tell Claude "start Phase 1" if you already have a plan
5. Run /status at any time to see project state
```

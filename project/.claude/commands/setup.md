# /setup - Project Initialization

You are helping the user set up a new project using AIAgentMinder, a governance and lifecycle framework for Claude Code.
Follow these steps in order. Ask questions in grouped batches, not one at a time.

---

## Step 1: Determine Scenario

Ask the user which applies:

**A) Create a new GitHub repository** -- You'll create the repo, initialize it, and set up all files.
**B) Add to an existing repository** -- The user has a repo with code already. You'll add template files without overwriting their existing work.
**C) Create a new local project** -- No GitHub yet. You'll create the directory, run `git init`, and set up files.
**D) Initialize in current directory** -- The user already has a blank or near-blank local repo open. You'll set up files here.

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
7. **GitHub username/org** (only for Scenario A)

---

## Step 3: Set Up Repository

Based on the scenario:

### Scenario A: New GitHub Repo
```bash
gh repo create [org/name] --public --clone
cd [name]
```
Then copy all files from the `project/` directory of the template into the new repo.

### Scenario B: Existing Repo
Copy template files into the user's repo. Before copying each file, check if it already exists:
- If the file exists, ask the user: "You already have [file]. Should I merge the template content, replace it, or skip it?"
- Never overwrite without asking
- Always copy `.claude/` directory (commands and settings)

### Scenario C: New Local Project
```bash
mkdir -p [path]/[name]
cd [path]/[name]
git init
```
Then copy all files from the `project/` directory.

### Scenario D: Current Directory
Copy all files from the `project/` directory into the current working directory.

---

## Step 4: Customize Files

Using the project identity from Step 2, update these files:

### CLAUDE.md -- Project Identity Section
Replace the placeholder block with actual values:
```markdown
**Project:** [actual name]
**Description:** [actual description]
**Type:** [actual type]
**Stack:** [actual stack details]

**Developer Profile:**
- [actual experience info]
- [actual autonomy preference]
```

### .env.example -- Generate Stack-Specific Variables
Start with the base template, then add sections relevant to the chosen stack:
- **Python + PostgreSQL**: Add DATABASE_URL, REDIS_URL if caching mentioned
- **Node.js + MongoDB**: Add MONGODB_URI
- **C# + Azure**: Add AZURE_* variables
- **Any web app**: Add JWT_SECRET, SESSION_SECRET
- Only include what the stack actually needs. Do not include Web3, Telegram, or other unrelated sections.

### .claude/settings.json -- Trim Permissions
The template includes permissions for all supported stacks. Remove permission blocks for stacks the user is NOT using:
- Python project? Remove .NET, Rust, Go, Node.js permissions
- Node.js project? Remove .NET, Python, Rust, Go permissions
- Keep: git, GitHub CLI, shell utilities, Docker (always useful)

### .github/workflows/ci.yml -- Enable Stack Job
The CI workflow has a skeleton structure. Add the build/test job for the chosen stack:
- Python: pip install, pytest
- Node.js: npm ci, npm test
- .NET: dotnet restore, dotnet build, dotnet test
- Rust: cargo build, cargo test
- Go: go build, go test

### .github/dependabot.yml -- Add Package Ecosystem
Add the relevant package ecosystem entry:
- Python: pip
- Node.js: npm
- .NET: nuget
- Rust: cargo
- Go: gomod

### docs/ARCHITECTURE.md -- Include for Complex Project Types
Include `docs/ARCHITECTURE.md` for project types `web-app`, `api`, and `mobile-app`.
Skip it for `cli-tool` and `library` unless the user described something complex.

### docs/strategy-roadmap.md -- Set Initial Quality Tier
Based on the project scale answer from Step 2, set the quality tier placeholder:
- Personal tool → Lightweight
- Small team tool → Standard
- Public-facing product → Rigorous
This is a starting point -- `/plan` will refine it based on deeper questioning.

---

## Step 5: Initial Commit

```bash
git add -A
git commit -m "chore: initialize project with Claude Code template"
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
- docs/ARCHITECTURE.md (living architecture doc -- web-app, api, mobile-app only)
- .claude/settings.json (permissions)
- .claude/commands/ (5 slash commands)
- .env.example (environment template)
- .github/ (CI/CD workflows)
- .gitignore

Next steps:
1. Run /plan to create your strategy roadmap
2. Or tell me "start Phase 1" if you already have a plan
3. Run /status at any time to see project state
```

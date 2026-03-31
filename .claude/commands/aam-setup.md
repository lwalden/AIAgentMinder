# /aam-setup - Project Initialization

You are running this command from the **AIAgentMinder template repository**. Your job is to help the user set up AIAgentMinder in a target project using the CLI installer.

Follow these steps in order. Ask questions in grouped batches, not one at a time.

---

## Step 1: Determine Target

Ask the user for the **full path** to the target directory.

If they want to set up in the current directory (this template repo), confirm: "This will set up AIAgentMinder files in this template repository's directory. Is that what you want, or did you mean to target a different project?"

---

## Step 2: Gather Project Identity

Ask all of these in one grouped prompt:

1. **Project name** (short, kebab-case friendly)
2. **One-sentence description** of what it does
3. **Project type:** web-app | api | cli-tool | library | mobile-app | other
4. **Primary tech stack:** Language, Framework, Database, other key dependencies
5. **Developer profile:** Experience level, autonomy preference (conservative / medium / aggressive)
6. **Sprint planning:** Enable? (y/n — recommended for multi-phase projects)
7. **GitHub Issues sync:** Enable `/aam-sync-issues`? (y/n — recommended for team projects)
8. **PR pipeline automation:** Enable `/aam-pr-pipeline`? (y/n — recommended for any project with PRs)

---

## Step 3: Run CLI Installer

Run the CLI installer with the appropriate flags based on Step 2 answers:

```bash
cd [target-path]
node [path-to-aiagentminder]/bin/aam.js init --force
```

If the user wants all optional features: add `--all`.
If core only (no optional features): add `--core`.

The CLI handles:
- Copying all core files (scripts, agents, rules, skills, settings, root files)
- Copying optional feature files based on flags
- Codebase fingerprinting (auto-detects language, framework, test runner)
- Writing the version stamp

---

## Step 4: Customize Project Identity

After the CLI finishes, customize these files **in the target project**:

### CLAUDE.md — Project Identity Section

Replace the placeholder block with actual values from Step 2:

```markdown
**Project:** [actual name]
**Description:** [actual description]
**Type:** [actual type]
**Stack:** [actual stack details]

**Developer Profile:**

- [actual experience info]
- [actual autonomy preference]
```

### CLAUDE.md — Sprint import (if sprint planning enabled)

Add `@SPRINT.md` after the Context Budget section. Also add:

```
**Sprint tracking:** SPRINT.md — auto-loaded via @import; archived when sprint completes
```

### .gitignore — Append Stack-Specific Entries

The template `.gitignore` covers secrets, IDE files, OS artifacts. Append stack-specific entries:
- **Node.js**: `node_modules/`, `dist/`, `build/`, `.next/`, `*.tsbuildinfo`
- **Python**: `__pycache__/`, `*.py[cod]`, `.venv/`, `.pytest_cache/`
- **.NET**: `bin/`, `obj/`, `*.user`, `.vs/`
- **Rust**: `target/`, `*.rs.bk`
- **Go**: `*.exe`, `*.test`, `*.out`

### docs/strategy-roadmap.md — Set Testing Strategy

Based on project scope, fill in the Testing Strategy section with appropriate testing approach.

---

## Step 5: Check Prerequisites

Run `jq --version`. Warn if not found — context monitoring requires it.

---

## Step 6: Initial Commit

In the **target project directory**:

```bash
cd [target]
git add -A
git commit -m "chore: initialize project with AIAgentMinder v4.2"
```

---

## Step 7: Summary

```
Project initialized successfully!

Created files:
- CLAUDE.md (project instructions)
- DECISIONS.md (architectural decisions and known debt log)
- BACKLOG.md (work inbox)
- docs/strategy-roadmap.md (product brief template)
- .claude/settings.json (hook configuration)
- .claude/agents/ (session profiles)
- .claude/skills/ (aam-* skills)
- .claude/scripts/ (hooks and utilities)
- .claude/rules/ (universal rules)
- .claude/aiagentminder-version (version stamp)
- .gitignore (core + [stack] entries)
[if sprint planning enabled:]
- SPRINT.md (sprint state tracking)

Next steps:
1. Open Claude Code in your project directory
2. Run /aam-brief to create your product brief & roadmap
3. Run /aam-checkup to verify the installation
[if sprint planning enabled:]
4. When ready to build, say "start a sprint" — I'll propose issues for review
```

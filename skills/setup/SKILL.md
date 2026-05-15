---
description: Initialize AIAgentMinder governance in the current project — interactive interview, project bootstrap, codebase fingerprinting, and starter docs.
user-invocable: true
---

# /aiagentminder:setup

One-time initialization of AIAgentMinder in the current project. Run this in
the target project's repo root, NOT in the AIAgentMinder repo itself.

## Inputs

- Current working directory (= target project root)
- User interaction for project identity questions

## Process

### 1. Detect existing install

Read `.claude/aiagentminder-version` if it exists.

- **If present:** Tell the user "AIAgentMinder is already installed (version X)." Ask if they want to re-run setup or upgrade. If upgrade, stop and direct them to `/aiagentminder:update`. If re-run, continue but note that user files will be preserved.
- **If absent:** Continue to step 2.

### 2. Codebase fingerprint

Inspect the project root for stack signals (do this via Read/Glob tools, not by asking the user). Note what you find:

| Signal | Indicates |
|---|---|
| `package.json` | Node.js / JavaScript |
| `tsconfig.json` + `package.json` | TypeScript |
| `next.config.*`, `app/` or `pages/` dir | Next.js |
| `*.csproj`, `*.sln`, `global.json` | C# / .NET |
| `pyproject.toml`, `requirements.txt`, `setup.py` | Python |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pom.xml`, `build.gradle*` | Java |
| `Gemfile` | Ruby |
| `.github/workflows/*.yml` | GitHub Actions CI |
| `.gitlab-ci.yml` | GitLab CI |
| `pytest.ini`, `jest.config.*`, `xunit`, etc. | Specific test runner |

Form a short summary like "Node.js + TypeScript + Next.js, Jest, GitHub Actions" and use it to seed default answers below.

### 3. Project identity interview

Ask the user for these in one go (numbered list, then wait for a single response covering all):

1. **Project name** — (default from current directory name)
2. **One-sentence description**
3. **Type** — `web-app | api | cli-tool | library | mobile-app | other` (suggest based on fingerprint)
4. **Stack** — language / framework / database / hosting (pre-fill from fingerprint)
5. **Experience level** — your familiarity with the stack: novice / intermediate / experienced
6. **Risk tolerance** — `conservative | medium | aggressive` (affects how often Claude asks vs. acts)

### 4. Run the bootstrap script

```bash
bash "${CLAUDE_PLUGIN_ROOT}/bin/aam-bootstrap.sh"
```

This copies the non-substituted template files into the target:

- `templates/.claude/rules/*.md` → `.claude/rules/`
- `templates/.claude/aiagentminder-version` → `.claude/aiagentminder-version`
- `templates/DECISIONS.md` → `DECISIONS.md` (if not already present)
- `templates/BACKLOG.md` → `BACKLOG.md` (if not already present)
- `templates/.pr-pipeline.json` → `.pr-pipeline.json` (only if user wants the PR pipeline)
- `templates/docs/strategy-roadmap.md` → `docs/strategy-roadmap.md` (if not already present)

The script never overwrites existing user files — it skips and reports.

### 5. Customize CLAUDE.md

Read `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md`. Substitute the Project Identity placeholders with the answers from step 3. Write the result to `./CLAUDE.md`. If `./CLAUDE.md` already exists, ask the user before overwriting.

### 6. Augment .gitignore

Read the current `.gitignore` (or create one). Add stack-specific entries based on the fingerprint:

- Node: `node_modules/`, `dist/`, `.next/`, `coverage/`, `.env*.local`
- Python: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `*.egg-info/`
- .NET: `bin/`, `obj/`, `.vs/`
- Rust: `target/`
- Go: `vendor/`

Plus universal AAM state files (these are ephemeral, never commit):

```
.context-usage
.sprint-continuation.md
.sprint-continue-signal
.sprint-human-checkpoint
.sprint-metrics.json
.exec/
```

### 7. Confirm

Print a short summary:

```
AIAgentMinder v{version} initialized in {project-name}.

Created/updated:
- CLAUDE.md           (project identity)
- DECISIONS.md        (architectural decision log — empty starter)
- BACKLOG.md          (work inbox — empty)
- docs/strategy-roadmap.md  (product brief — empty, run /aiagentminder:brief to fill)
- .claude/rules/      (universal rules: git-workflow, tool-first, context-cycling)
- .claude/aiagentminder-version  ({version})
- .gitignore          (stack-specific + AAM state files)

Next steps:
1. Run /aiagentminder:brief to draft a product roadmap interactively.
2. When ready, run /aiagentminder:tdd to start your first feature with
   guided TDD, or just describe what you're building.
```

## What this skill does NOT do

- Install hooks or scripts — those live in the plugin (`${CLAUDE_PLUGIN_ROOT}/bin/`)
  and are picked up automatically by Claude Code's plugin system.
- Modify `~/.claude/settings.json` — plugin hooks register themselves.
- Detect / migrate from a prior `npx aiagentminder init` install — that's
  handled by `/aiagentminder:update`.

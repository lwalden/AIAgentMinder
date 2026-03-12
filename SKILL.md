# AIAgentMinder Plugin

> **Status:** Placeholder — proper plugin packaging planned for v0.9.1.
> This file documents intended plugin metadata. Actual skill directories and plugin manifest will be built in v0.9.1.
> The commands listed here work today via `/setup`.

---

## Plugin Metadata

```yaml
name: aiagentminder
version: 0.9.0
description: Project governance and methodology layer for AI-assisted development. Provides structured planning, sprint governance, scope control, quality gates, and architectural fitness checks.
author: lwalden
repository: https://github.com/lwalden/aiagentminder
license: MIT
```

## What This Plugin Provides

Once packaged and installed, the following commands become available in any project:

| Command | Purpose |
|---------|---------|
| `/brief` | Structured product brief and roadmap creation interview |
| `/handoff` | Session checkpoint — log decisions, write priorities to memory |
| `/quality-gate` | Tiered pre-PR checks matching the project's quality tier |
| `/self-review` | Subagent-based code review (security, performance, API design) |
| `/milestone` | Project health assessment — scope drift, complexity, timeline |
| `/retrospective` | Sprint retrospective with metrics and adaptive sizing |

The following rules are activated in every session:

| Rule | Purpose |
|------|---------|
| `git-workflow.md` | Commit discipline, branch naming, PR workflow |
| `scope-guardian.md` | Scope governance against the roadmap |

Optional rules (enabled during setup or `/brief`):

| Rule | Purpose |
|------|---------|
| `code-quality.md` | TDD, review-before-commit, build-before-commit |
| `sprint-workflow.md` | Sprint governance over native Tasks |
| `architecture-fitness.md` | Project-customizable structural constraints |

## Installation (Current — Manual)

```bash
git clone https://github.com/lwalden/aiagentminder
cd aiagentminder
```

Then in Claude Code:
```
/setup
```

Follow the setup interview to initialize AIAgentMinder in your target project.

## Installation (Planned — Plugin Marketplace, v0.9.1)

```
/plugin marketplace add lwalden/aiagentminder
```

## v0.9.1 Plugin Packaging Plan

The marketplace requires a specific structure that differs from the current `/setup` install path:

1. **Per-skill directories**: Each command gets its own `.claude/skills/<name>/SKILL.md` with frontmatter (`name`, `description`, `argument-hint`, `allowed-tools`, `user-invocable`, etc.)
2. **Plugin manifest**: `.claude-plugin/plugin.json` declaring plugin metadata and skill list
3. **Marketplace index**: `marketplace.json` at repo root for discovery
4. **Submission**: via https://claude.ai/settings/plugins/submit

The `/setup` install path continues to work after v0.9.1. Marketplace is an additional distribution channel.

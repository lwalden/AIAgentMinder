# AIAgentMinder Plugin

> **Status:** Plugin packaging scaffold — awaiting Claude Code Plugin Marketplace availability.
> The commands below work today via `/setup`. This file prepares for marketplace distribution.

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

Once installed, the following commands become available in any project:

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

## Installation (Future — Plugin Marketplace)

```
/plugin install airagentminder
```

This will copy the governance files and run the setup interview automatically.

## Notes for Marketplace Distribution

When the Claude Code Plugin Marketplace is available, the following steps are needed to complete packaging:

1. Add `skills:` frontmatter to each command file in `project/.claude/commands/` per marketplace spec
2. Register the plugin at the marketplace submission endpoint
3. Test `/plugin install airagentminder` end-to-end
4. Verify rule files are activated post-install without manual setup

The existing file structure is already compatible with the skills system — commands in `.claude/commands/` and rules in `.claude/rules/` are the correct locations.

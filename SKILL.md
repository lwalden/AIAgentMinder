# AIAgentMinder Plugin

> **Status:** v1.1.0 — All commands prefixed with `aam-` to avoid collision with Claude Code built-ins and other plugins.

---

## Installation

### Plugin Marketplace (recommended)

```
/plugin marketplace add lwalden/AIAgentMinder
```

### Manual (`/aam-setup`)

```bash
git clone https://github.com/lwalden/AIAgentMinder
cd AIAgentMinder
```

Then in Claude Code:
```
/aam-setup
```

The `/aam-setup` interview copies governance files to your project and customizes them for your stack.

---

## Plugin Metadata

```json
{
  "name": "aiagentminder",
  "version": "1.1.0",
  "description": "Project governance and methodology layer for AI-assisted development.",
  "repository": "https://github.com/lwalden/AIAgentMinder",
  "license": "MIT"
}
```

See `.claude-plugin/plugin.json` for the full manifest.

---

## Skills

| Skill | Purpose |
|-------|---------|
| `/aam-brief` | Structured product brief and roadmap creation interview |
| `/aam-handoff` | Session checkpoint — log decisions, write priorities to memory |
| `/aam-checkup` | Installation health check — files, hooks, Node.js, version stamp |
| `/aam-scope-check` | Active scope governance — compare proposed work against roadmap |
| `/aam-quality-gate` | Tiered pre-PR checks matching the project's quality tier |
| `/aam-self-review` | Subagent-based code review (security, performance, API design) |
| `/aam-milestone` | Project health assessment — scope drift, complexity, timeline, known debt |
| `/aam-retrospective` | Sprint retrospective with metrics and adaptive sizing |

Skill definitions live in `skills/<name>/SKILL.md`.

---

## Rules (copied to project by `/aam-setup`)

Always active:

| Rule | Purpose |
|------|---------|
| `git-workflow.md` | Commit discipline, branch naming, PR workflow |
| `scope-guardian.md` | Scope governance against the roadmap |
| `approach-first.md` | State approach before executing architecture/multi-file changes |
| `debug-checkpoint.md` | Stop debugging spirals after 3 failed attempts |

Optional:

| Rule | Purpose |
|------|---------|
| `code-quality.md` | TDD, review-before-commit, build-before-commit |
| `sprint-workflow.md` | Sprint governance over native Tasks |
| `architecture-fitness.md` | Project-customizable structural constraints |

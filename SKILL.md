# AIAgentMinder Plugin

> **Status:** v0.9.1 — Plugin packaging complete. Skills in `skills/`, manifest at `.claude-plugin/plugin.json`.

---

## Installation

### Plugin Marketplace (recommended)

```
/plugin marketplace add lwalden/AIAgentMinder
```

### Manual (`/setup`)

```bash
git clone https://github.com/lwalden/AIAgentMinder
cd AIAgentMinder
```

Then in Claude Code:
```
/setup
```

The `/setup` interview copies governance files to your project and customizes them for your stack.

---

## Plugin Metadata

```json
{
  "name": "aiagentminder",
  "version": "0.9.1",
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
| `/brief` | Structured product brief and roadmap creation interview |
| `/handoff` | Session checkpoint — log decisions, write priorities to memory |
| `/quality-gate` | Tiered pre-PR checks matching the project's quality tier |
| `/self-review` | Subagent-based code review (security, performance, API design) |
| `/milestone` | Project health assessment — scope drift, complexity, timeline |
| `/retrospective` | Sprint retrospective with metrics and adaptive sizing |

Skill definitions live in `skills/<name>/SKILL.md`.

---

## Rules (copied to project by `/setup`)

Always active:

| Rule | Purpose |
|------|---------|
| `git-workflow.md` | Commit discipline, branch naming, PR workflow |
| `scope-guardian.md` | Scope governance against the roadmap |

Optional:

| Rule | Purpose |
|------|---------|
| `code-quality.md` | TDD, review-before-commit, build-before-commit |
| `sprint-workflow.md` | Sprint governance over native Tasks |
| `architecture-fitness.md` | Project-customizable structural constraints |

# AIAgentMinder Plugin

> **Status:** v3.3.0 — Governance framework with npm/npx installer, codebase fingerprinting, architecture fitness defaults, and plugin marketplace distribution.

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
  "version": "3.3.0",
  "description": "Opinionated governance framework for Claude Code — autonomous sprint execution, enforced engineering practices, and structured planning for solo developers.",
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
| `/aam-revise` | Mid-stream plan revision — add, change, drop, or reprioritize features in the roadmap |
| `/aam-handoff` | Session checkpoint — log decisions, write priorities to memory |
| `/aam-checkup` | Installation health check — files, hooks, Node.js, version stamp |
| `/aam-scope-check` | Active scope governance — compare proposed work against roadmap |
| `/aam-quality-gate` | Full pre-PR quality checklist (build, tests, coverage, lint, security) |
| `/aam-self-review` | Subagent-based code review (security, performance, API design) — runs for every item |
| `/aam-pr-pipeline` | Autonomous PR review-fix-test-merge pipeline. Escalates to human on blockers |
| `/aam-milestone` | Project health assessment — scope drift, complexity, timeline, known debt |
| `/aam-retrospective` | Sprint retrospective with metrics and adaptive sizing |
| `/aam-tdd` | Guided TDD workflow — plan, tracer bullet, RED-GREEN loop, refactor |
| `/aam-triage` | Structured bug triage — reproduce, diagnose, design fix plan, create issue |
| `/aam-grill` | Plan interrogation — walk every decision branch before implementation |
| `/aam-sync-issues` | Sync current sprint issues to GitHub Issues (optional) |

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
| `tool-first.md` | Use CLI/API tools instead of asking the user to act manually |

Default on (installed by setup, optional during update):

| Rule | Purpose |
|------|---------|
| `code-quality.md` | TDD, review-before-commit, build-before-commit |
| `sprint-workflow.md` | State machine sprint execution with mandatory quality |
| `correction-capture.md` | Self-monitors for repeated wrong-first-approach patterns |
| `architecture-fitness.md` | Project-customizable structural constraints |

# AIAgentMinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-5.1.1-blue)

A Claude Code plugin that turns a multi-day feature into a single command. AIAgentMinder drives an autonomous sprint loop — plan, spec, approve, build with TDD, quality-gate, cross-model self-review, open the PR, watch CI, merge — and it mechanically enforces the parts solo Claude tends to skip when you stop watching.

Built for solo developers and small teams who want governance without the ceremony.

---

## The 30-second case

- **Run a sprint, walk away.** `Start a sprint for Phase 2.` AAM plans, takes your approval at the spec gate, then executes item-by-item in isolated git worktrees until the PRs are merged.
- **A different model reviews your code before you do.** `/aiagentminder:self-review` runs the change through five specialist lenses (security, performance, API design, cost, UX friction) plus a cross-model judge pass.
- **PRs that fix themselves.** `/aiagentminder:pr-pipeline` reviews with full repo context, applies the fixes, waits on CI, and either merges or escalates with a reason.
- **Clean cross-session resume.** `/aiagentminder:handoff` writes the resume state into Claude Code's native Auto Memory; in the next session, "resume work" picks up exactly where you stopped.
- **Plan and decision discipline by default.** `scope-check` keeps work aligned with the roadmap, `DECISIONS.md` logging keeps the record honest, `BACKLOG.md` captures everything you can't do right now.

These aren't instructions — they're mechanically enforced via Claude Code hooks (PreToolUse, Stop, SessionStart). See [DECISIONS.md](DECISIONS.md) for the architectural rationale.

---

## Quick Start

In Claude Code:

```
/plugin marketplace add lwalden/AIAgentMinder
/plugin install aiagentminder@lwalden-aiagentminder
```

Then in your target project:

```
/aiagentminder:setup
```

`/aiagentminder:setup` runs interactively — it fingerprints your codebase, asks for project identity, writes a starter `CLAUDE.md`, `DECISIONS.md`, `BACKLOG.md`, and `docs/strategy-roadmap.md`, and seeds `.claude/rules/` and `.gitignore`.

### First moves

1. `/aiagentminder:brief` to draft a product brief and strategy roadmap interactively.
2. Start building. With sprint planning: `Start a sprint for Phase 1.`

### Minimum Claude Code version

v5.0 needs Claude Code **2.1.139+** for worktree-isolated agent execution (`isolation: "worktree"`), the `/goal` command, and `${CLAUDE_PLUGIN_ROOT}` hook variable substitution.

---

## Where this works

| Environment | Plugin works? | Notes |
|---|---|---|
| Claude Code CLI (macOS / Linux / Windows) | ✅ Full | Primary target. |
| VS Code with the Claude Code extension | ✅ Full | Extension hosts a local Claude Code; same surface as CLI. |
| JetBrains IDE extension | ✅ Full | Same as VS Code. |
| **claude.ai/code (browser web sessions)** | ❌ No | Web sessions don't load plugins. No `/aiagentminder:*` commands, no sub-agents, no hooks, no `bin/` scripts on PATH. Only the artifacts that `/aiagentminder:setup` previously copied into the repo (`CLAUDE.md`, `.claude/rules/*.md`, `SPRINT.md`, `BACKLOG.md`, `DECISIONS.md`, `docs/strategy-roadmap.md`) remain available, since they live in the repo itself. |

A project bootstrapped from a local session is still readable from web — Claude will load `CLAUDE.md` and rules natively — but plugin-only workflows are CLI / IDE only. Mobile and Claude desktop app parity is not a goal.

---

## What you actually use

Five features carry most of the value. Each is one slash command or one Task dispatch.

### 1. Autonomous sprint execution

**Trigger:** `Start a sprint for Phase 2.`
**What you get:** `sprint-master` orchestrates a state machine — `PLAN → SPEC → APPROVE → [per item: EXECUTE → TEST → REVIEW → MERGE → VALIDATE] → COMPLETE`. Each item runs in its own git worktree, isolated from other in-flight work. TDD is mandatory. Quality gate runs before every PR. You approve once at the spec gate; the rest is autonomous.

### 2. Cross-model self-review

**Trigger:** `/aiagentminder:self-review` (also runs automatically in the REVIEW phase of every sprint item)
**What you get:** Five specialist sub-agents — `security-reviewer`, `performance-reviewer`, `api-reviewer`, `cost-reviewer`, `ux-reviewer` — each give a focused-lens read. A judge pass picks real findings from noise. Configurable to use a different model than the one that wrote the code, so the second opinion actually catches things the original author missed.

### 3. Autonomous PR pipeline

**Trigger:** `/aiagentminder:pr-pipeline <PR#>` (also invoked in-sprint after PR creation)
**What you get:** `pr-pipeliner` reviews the PR with full repo context (not just the diff), applies the fixes itself, waits on external CI, and merges when green. Escalates with a reason on cycle limit, high-risk files, or unresolvable blockers. Configurable per repo via `.pr-pipeline.json`.

### 4. Clean session handoff

**Trigger:** `/aiagentminder:handoff`
**What you get:** Writes a "Next Session" block into Claude Code's native Auto Memory — decisions made this session, the next concrete step, any blockers. In the next session, "resume work" picks up exactly where you stopped. Pairs with the context-warning hook, which advises you (no enforcement) when you approach the token threshold.

### 5. Plan and decision discipline

**Triggers:** `/aiagentminder:scope-check`, `/aiagentminder:revise`, `/aiagentminder:backlog`
**What you get:** Before AAM lets new work into a sprint, `scope-check` compares it against `docs/strategy-roadmap.md`. If out of scope, you either revise the roadmap (logged in `DECISIONS.md`) or capture to `BACKLOG.md`. The plan, the record, and the work stay in sync.

The full feature inventory (15 skills, 16 sub-agents, 9 hooks) is in the [Reference](#reference) section.

---

## See it in action

[examples/demo-transcript.md](examples/demo-transcript.md) walks through three sessions on a sample REST API: planning with `/aiagentminder:brief`, handing off mid-build with `/aiagentminder:handoff`, and resuming. Sample state files (`examples/CLAUDE.md`, `examples/DECISIONS.md`, `examples/strategy-roadmap.md`) show what a mid-project repo looks like.

---

## When NOT to use this

- **Single-session projects.** If your work fits in one Claude session and you don't need sprint governance or decision logging, plain `CLAUDE.md` is enough.
- **Ad-hoc exploration.** AAM expects a roadmap. If you're poking around to figure out what to build, finish that first, then `/aiagentminder:setup`.
- **Multi-agent concurrency on overlapping work.** `sprint-master` coordinates items sequentially in isolated worktrees. It does not orchestrate concurrent agents working on the same files.
- **Browser-only workflow.** See [Where this works](#where-this-works) — plugin features aren't loaded in `claude.ai/code` web sessions.

AAM adds structure. Only use it if the structure pays for itself.

---

## Requirements

- **Claude Code 2.1.139+** — VS Code / JetBrains extension or CLI.
- **Bash** — Windows users need Git Bash or WSL; macOS/Linux built-in.
- **jq** — for context monitoring (`winget install jqlang.jq` / `brew install jq` / `apt install jq`). Hooks degrade gracefully without it.
- **Git** — required.
- **GitHub CLI (`gh`)** — optional, for PR pipeline and issue sync.

Works on Windows, macOS, and Linux. Node.js is no longer required (the v4.x npm CLI was retired in v5.0).

---

## Reference

<details>
<summary><strong>Skills (slash commands)</strong></summary>

| Command | Purpose |
|---------|---------|
| `/aiagentminder:setup` | Bootstrap a project (one-shot install / re-sync) |
| `/aiagentminder:brief` | Interview-driven product brief and strategy roadmap |
| `/aiagentminder:revise` | Mid-stream roadmap revision with `DECISIONS.md` logging |
| `/aiagentminder:scope-check` | Compare proposed work against the roadmap; promote to backlog if out of scope |
| `/aiagentminder:milestone` | Phase health assessment — progress, timeline, scope drift |
| `/aiagentminder:tdd` | Guided TDD — plan, tracer bullet, RED-GREEN loop, refactor |
| `/aiagentminder:grill` | Plan interrogation — walk every decision branch before implementing |
| `/aiagentminder:triage` | Structured bug triage — reproduce, diagnose, fix plan, GitHub issue |
| `/aiagentminder:quality-gate` | Pre-PR quality checklist (build, tests, coverage, lint, security) |
| `/aiagentminder:self-review` | Pre-PR review via 5 specialist sub-agents + cross-model judge pass |
| `/aiagentminder:pr-pipeline` | Autonomous PR review-fix-test-merge pipeline |
| `/aiagentminder:handoff` | Session checkpoint — writes "Next Session" into Auto Memory |
| `/aiagentminder:retrospective` | Sprint metrics and adaptive sizing guidance |
| `/aiagentminder:backlog` | Capture, list, promote `BACKLOG.md` items |
| `/aiagentminder:sync-issues` | Optional GitHub Issues bridge |

</details>

<details>
<summary><strong>Sub-agents (Task tool dispatch)</strong></summary>

| Agent | Phase / role |
|-------|--------------|
| `sprint-master` | Orchestrator — drives the sprint state machine |
| `sprint-planner` | PLAN phase — decomposes roadmap items into a sprint |
| `sprint-speccer` | SPEC phase — per-item implementation spec |
| `item-executor` | EXECUTE phase — TDD-driven implementation in a worktree |
| `quality-reviewer` | REVIEW phase — runs the quality gate |
| `pr-pipeliner` | Drives the autonomous PR pipeline post-create |
| `sprint-retro` | Sprint retrospective and adaptive sizing |
| `api-reviewer`, `cost-reviewer`, `performance-reviewer`, `security-reviewer`, `ux-reviewer` | Five specialist review lenses |
| `dev`, `qa`, `debug`, `hotfix` | Optional session profile agents (different permissions / risk tolerances) |

</details>

<details>
<summary><strong>Hooks and scripts</strong></summary>

All scripts ship in `bin/` and are on PATH while the plugin is enabled. Hooks register via `hooks/hooks.json`.

| Hook | Event | Purpose |
|------|-------|---------|
| `context-monitor.sh` | statusLine | Writes `.context-usage` with token thresholds |
| `context-warning-hook.sh` | Stop | Advisory warning when over threshold (v5.1+) |
| `sprint-phase-guard.sh` | PreToolUse (`matcher: "Agent"`) | Blocks sub-agent dispatches that don't match SPRINT.md phase |
| `sprint-phase-reminder.sh` | Stop | One-line per-turn phase reminder during an active sprint |
| `sprint-stop-guard.sh` | Stop | Blocks premature turn endings during sprint execution |
| `session-start-cycle-reset.sh` | SessionStart | Wipes stale `.context-usage` |
| `session-start-hook.sh` | SessionStart | Detects active sprints; surfaces a one-line reminder |
| `stop-failure-hook.sh` | StopFailure | Logs API errors |
| `hlpm-ping.sh` | SessionStart/End | Optional HLPM executive layer integration |

| Bash script | Purpose |
|-------------|---------|
| `sprint-update.sh` | Zero-token `SPRINT.md` status/phase updates |
| `decisions-log.sh` | Zero-token `DECISIONS.md` append |
| `backlog-capture.sh` | Zero-token `BACKLOG.md` add/list/promote/detail/count |
| `sprint-metrics.sh` | Sprint metrics collection |
| `version-bump.sh` | Multi-file version bump |
| `sprint-runner.sh` / `.ps1` | Optional wrapper that auto-restarts Claude on `/exit` (unattended runs) |
| `aam-bootstrap.sh` | Internal — `/aiagentminder:setup` helper |

Zero-token-cost scripts replace LLM file I/O with deterministic bash. Significant token savings during long sprints.

</details>

<details>
<summary><strong>Files installed in your project</strong></summary>

| File | Auto-loaded? | Purpose |
|------|--------------|---------|
| `CLAUDE.md` | Yes | Project identity and behavioral rules |
| `.claude/rules/git-workflow.md` | Yes | Branch naming, commit discipline, PR-only workflow |
| `.claude/rules/tool-first.md` | Yes | Use tools, don't ask the user |
| `.claude/rules/context-warnings.md` | Yes | How to respond to the context-warning hook |
| `DECISIONS.md` | On-demand (`@DECISIONS.md`) | Architectural decision log |
| `docs/strategy-roadmap.md` | On-demand | Product brief and phase plan |
| `SPRINT.md` | On-demand | Active sprint header (when in a sprint) |
| `BACKLOG.md` | On-demand | Unscheduled work inbox |
| `.pr-pipeline.json` | n/a (config) | PR pipeline config |

Total always-loaded baseline: ~1,000 tokens per session.

</details>

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Skills not showing (VS Code) | `/reload-plugins`, then close and reopen the Claude Code panel |
| Hooks not firing | `/plugin` → check Errors tab. Verify the plugin is enabled, not just installed |
| `/aiagentminder:setup` not found | Plugin not installed or not enabled. Run `/plugin install aiagentminder@lwalden-aiagentminder` |
| Claude re-debates a past decision | Add it to `DECISIONS.md`; add `@DECISIONS.md` to `CLAUDE.md` to auto-load |
| Claude builds something out of scope | Run `/aiagentminder:scope-check` |
| Claude asks you to do things manually | Verify `.claude/rules/tool-first.md` exists in your project |
| Quality degrades late in session | Verify `jq` is installed; otherwise context monitoring falls back to heuristics |
| Upgrading | `/plugin marketplace update lwalden-aiagentminder` → `/reload-plugins` → optionally `/aiagentminder:setup` to refresh `.claude/rules/` |

---

## Documentation

- [How It Works](docs/how-it-works.md) — context system, session lifecycle, hook details
- [Customization Guide](docs/customization-guide.md) — optional features, native Claude Code tie-ins, upgrade paths
- [Product Brief Guide](docs/strategy-creation-guide.md) — using `/aiagentminder:brief` or writing the roadmap manually
- [Roadmap](docs/strategy-roadmap.md) — version history and direction
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## License

MIT — see [LICENSE](LICENSE).

*Works with Claude Code. Independent open-source project, not affiliated with Anthropic.*

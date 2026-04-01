# SPRINT.md - Sprint Header

> Sprint scope and status. Loaded via @import each session when an active sprint exists.
> Individual issues are tracked as native Claude Code Tasks (persistent across sessions).
> Archived to git history when a sprint completes.
>
> **Post-Merge column:** `n/a` = no post-merge tests needed, `pending: {desc}` = awaiting validation,
> `pass` = validated, `fail` = failed (rework task created).

## Archive

S1 archived (2026-03-29): 7 planned, 5 completed, 2 deferred (S1-005 npm publish pending, S1-006 GH Actions blocked on PR #84 human review), 0 rework. 0 scope changes, 0 blocked (at completion). Shipped automated correction capture, stop hook enforcement, zero-token-cost scripts, cross-model review gate, README rewrite, v3.3.0 GitHub Release. Deferred release automation items to post-v4.0.
<!-- sizing: 5-7 -->

S2 archived (2026-03-30): 9 planned, 9 completed, 0 rework. 0 scope changes, 0 blocked. Shipped skills migration, 1M context cycling, negative test enforcement, UX friction lens, judge agent pass, setup auto-detection, SessionStart/StopFailure hooks, hooks schema fix. Closes v4.0 Tier 1; Tier 2 partial (custom subagents and rule compression deferred — subsumed by session profiles approach).
<!-- sizing: 5-7 -->

S3 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Shipped session profiles (5 agents, rule reorganization, sprint-runner --agent flag), backlog capture system (backlog-capture.sh, BACKLOG.md, /aam-backlog skill, integration touchpoints). 81 new tests (175→256). PRs #96-101.
<!-- sizing: 5-7 -->

S4 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.1.0 version bump + GitHub Release, migration integration tests, custom review subagents (5 agents), self-review agent architecture refactor, roadmap/README update. PRs #102-106.
<!-- sizing: 5-7 -->

S5 archived (2026-03-30): 7 planned, 7 completed, 0 rework. 0 scope changes, 0 blocked. Shipped deterministic sync CLI (lib/sync.js, lib/migrations.js, lib/settings-merge.js), CLI sync command, /aam-update rewrite (404→112 lines), plugin skill removal (13 packages), manifest consistency tests. 60 new tests (285→345). PRs #107-113.
<!-- sizing: 5-7 -->

S6 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.2.0 release, /aam-setup CLI delegation (183→139 lines), roadmap/README update, v4.2 migration entry, e2e sync test (v3.3→v4.2 full upgrade path). 12 new tests (345→357). PRs #115-119.
<!-- sizing: 5-7 -->

S7 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Fixed init --force data-loss bug (settings.json merge), stale debug-checkpoint/PROGRESS.md references, added jq dependency check to sync/init, pruned 82 remote + 51 local stale branches, updated README rules table for v4.1 session profiles. 63 new tests (357→420). PRs #122, #124–127.
<!-- sizing: 5-7 -->

---

**Sprint:** S8 — v5.0: Orchestrator + Instrumentation
**Status:** in-progress
**Phase:** v5.0
**Issues:** 10 (oversized — approved by user to ship complete v5.0; expected multi-session)
**Deferred to S9:** v5.0 version bump + GitHub Release, community marketplace listings

| ID | Title | Type | Risk | Status | Post-Merge |
|---|---|---|---|---|---|
| S8-001 | Spike: validate orchestrator prerequisites | spike | ⚠ | done | n/a |
| S8-002 | Update specs based on spike findings | chore | | done | n/a |
| S8-003 | Sprint-master orchestrator agent | feature | ⚠ | done | n/a |
| S8-004 | Phase agents: sprint-planner + sprint-speccer | feature | | done | n/a |
| S8-005 | Phase agent: item-executor | feature | | done | n/a |
| S8-006 | Phase agent: quality-reviewer [risk] | feature | ⚠ | done | n/a |
| S8-007 | Phase agents: pr-pipeliner + sprint-retro | feature | | done | n/a |
| S8-008 | Sprint metrics collection | feature | | done | n/a |
| S8-009 | Orchestrator integration testing [risk] | test | ⚠ | done | n/a |
| S8-010 | Sync/init + v4.2→v5.0 migration | feature | | done | n/a |

---

## Specs

### S8-001: Spike — validate orchestrator prerequisites
**Approach:** Write a small test harness (in `tests/spike/`) that exercises the Agent tool patterns the orchestrator will use. No production code — purely investigative. Update `docs/spike-session-architecture.md` with findings.
**Questions to answer:**
1. Do `.claude/rules/` auto-load for sub-agents spawned via the Agent tool? (Test by spawning an agent and asking it what rules it sees)
2. What is sub-agent spawning latency? (Time 5+ Agent tool calls, report avg/p95)
3. Can sub-agents read files from the project directory? (Spawn agent, have it read a known file, verify content)
4. How does the orchestrator receive sub-agent results? (Test return format, size limits, structured data passing)
5. What happens when a sub-agent hits context limits? (Does it return partial results or crash?)
6. Can the orchestrator pass structured prompts (multi-line, with file references) to sub-agents reliably?
**Test Plan (TDD RED):** N/A — spike, not feature code. Validation is the test.
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `tests/spike/orchestrator-prerequisites.md` (findings) | Modify: `docs/spike-session-architecture.md` (update Open Questions section), `DECISIONS.md`
**Dependencies:** None — this is the first item
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-002: Update specs based on spike findings
**Approach:** Read S8-001 findings. For each remaining item (S8-003 through S8-010), revise the spec if spike results require changes. Key areas: if rules don't auto-load, add "read these files" directives to every agent spec. If latency is high, consider merging small agents. If sub-agents can't spawn sub-sub-agents (confirmed), lock in the quality-reviewer design decision. Update this spec section in SPRINT.md directly.
**Test Plan (TDD RED):** N/A — documentation/spec chore
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Modify: `SPRINT.md` (spec section)
**Dependencies:** S8-001
**Upgrade Impact:** N/A
**Custom Instructions:** Pre-approved — no human checkpoint needed for spec changes

### S8-003: Sprint-master orchestrator agent
**Approach:** Create `project/.claude/agents/sprint-master.md` as a lightweight state machine router. The agent's instructions are ~40-60 lines — a routing table, not implementation logic. Each state maps to a specialist agent with defined input/output contracts. The sprint-master reads SPRINT.md for current state, spawns the correct phase agent, passes results forward, and updates status via `sprint-update.sh`. Human checkpoints at PLAN, APPROVE, BLOCKED, REWORK. Error handling: retry agent once on failure, then escalate. **Spike-updated:** Sprint-master also dispatches review lens agents directly during TEST state (sub-sub-agents are not possible — quality-reviewer cannot spawn lenses). Rules auto-load for all sub-agents, so no "read these files" directives needed.
**Test Plan (TDD RED):**
1. Test agent file has valid YAML frontmatter (name, description)
2. Test routing table covers all 10 states (PLAN through COMPLETE + BLOCKED + REWORK + CONTEXT_CYCLE)
3. Test agent file is under 100 lines (enforces "lightweight router" constraint)
4. Test agent references only agents that exist in `project/.claude/agents/`
5. Test agent includes review lens dispatch instructions for TEST state
**Integration/E2E:** None (integration testing in S8-009)
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/agents/sprint-master.md` | Modify: none
**Dependencies:** S8-002 (specs may adjust based on spike)
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-004: Phase agents — sprint-planner + sprint-speccer
**Approach:** Create two agents that handle the PLAN and SPEC states respectively. `sprint-planner.md` reads `docs/strategy-roadmap.md`, `DECISIONS.md`, `BACKLOG.md` (via backlog-capture.sh), and SPRINT.md archive sizing hints. Outputs a proposed issue table with title, type, risk tags, and AC per issue. `sprint-speccer.md` reads approved issue list + relevant source files, outputs structured specs per item (approach, test plan, files, dependencies, upgrade impact). Both agents follow the existing agent frontmatter pattern (name, description).
**Test Plan (TDD RED):**
1. Test sprint-planner.md has valid YAML frontmatter
2. Test sprint-planner.md references roadmap, DECISIONS.md, BACKLOG.md, sizing hints
3. Test sprint-speccer.md has valid YAML frontmatter
4. Test sprint-speccer.md defines the spec template format matching sprint-workflow SPEC phase
5. Test both agents are under 80 lines each
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/agents/sprint-planner.md`, `project/.claude/agents/sprint-speccer.md`
**Dependencies:** S8-002
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-005: Phase agent — item-executor
**Approach:** Create `project/.claude/agents/item-executor.md` handling the EXECUTE state. This is the heaviest agent — it does TDD, branch creation, implementation, and refactoring. **Spike-updated:** Rules auto-load, so code-quality.md, architecture-fitness.md, and debug-checkpoint.md are already in context. The agent file reinforces key behaviors (TDD cycle, done/blocked contract, context-limit degradation) without duplicating rule content. The agent receives a spec + branch naming convention from the orchestrator and reports "done" (with commit hash) or "blocked: {reason}". If context pressure builds (PreToolUse hook fires), the agent returns partial progress for the orchestrator to hand off to a fresh instance.
**Test Plan (TDD RED):**
1. Test agent file has valid YAML frontmatter
2. Test agent includes TDD cycle instructions
3. Test agent includes architecture fitness constraints
4. Test agent includes debug checkpoint protocol
5. Test agent defines done/blocked output contract
6. Test agent defines context-limit graceful degradation behavior
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/agents/item-executor.md`
**Dependencies:** S8-002
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-006: Phase agent — quality-reviewer [risk]
**Approach:** Create `project/.claude/agents/quality-reviewer.md` handling the TEST state. **Spike-resolved design (Option 1):** Quality-reviewer runs inline quality gate checks (build, tests, lint, security) and the judge pass. Sprint-master dispatches the 5 review lens agents directly as first-level sub-agents (in parallel where possible), then passes combined findings to quality-reviewer for the judge pass. This keeps quality-reviewer simple (no Agent tool needed) while leveraging parallel lens execution. The quality-reviewer agent file contains: quality gate checklist, judge pass criteria, severity classification, and instructions for processing lens findings passed to it by the orchestrator.
**Test Plan (TDD RED):**
1. Test agent file has valid YAML frontmatter
2. Test agent covers quality gate checklist (build, tests, lint, security)
3. Test agent covers judge pass criteria and severity classification
4. Test agent does NOT reference the Agent tool (it's a sub-agent — can't spawn)
5. Test agent defines input contract for receiving lens findings from orchestrator
6. Test chosen design is recorded in DECISIONS.md
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/agents/quality-reviewer.md` | Modify: `DECISIONS.md`
**Dependencies:** S8-001 (spike confirms sub-agent constraints), S8-002
**Upgrade Impact:** Changes how `/aam-self-review` and `/aam-quality-gate` are invoked during sprints. Existing skills remain for standalone use; orchestrated sprints use the agent.
**Custom Instructions:** None

### S8-007: Phase agents — pr-pipeliner + sprint-retro
**Approach:** Create `project/.claude/agents/pr-pipeliner.md` handling the REVIEW/MERGE states and `project/.claude/agents/sprint-retro.md` handling the COMPLETE state. `pr-pipeliner` encapsulates the review-fix-test-merge loop currently in `/aam-pr-pipeline` skill — reads `.pr-pipeline.json`, handles high-risk gates, cycle limits, test execution, auto-merge, and escalation. `sprint-retro` reads SPRINT.md + git log + `.sprint-metrics.json` (from S8-008), computes metrics, and produces the retrospective report with adaptive sizing. Both agents follow the skill logic but are structured as agent definitions.
**Test Plan (TDD RED):**
1. Test pr-pipeliner.md has valid YAML frontmatter
2. Test pr-pipeliner.md references .pr-pipeline.json config
3. Test pr-pipeliner.md defines escalation conditions (high-risk, cycle-limit, CI failure)
4. Test sprint-retro.md has valid YAML frontmatter
5. Test sprint-retro.md references .sprint-metrics.json
6. Test sprint-retro.md includes adaptive sizing logic
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/agents/pr-pipeliner.md`, `project/.claude/agents/sprint-retro.md`
**Dependencies:** S8-002
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-008: Sprint metrics collection
**Approach:** Define `.sprint-metrics.json` schema and add a `metrics` subcommand to `sprint-update.sh`. The script writes metrics incrementally during the sprint (item completion timestamps, cycle counts) and finalizes at COMPLETE. Schema: `{ sprintId, startedAt, completedAt, items: [{ id, startedAt, completedAt, contextCycles, reviewFindings, reworkCount }], totals: { planned, completed, rework, blocked, scopeChanges, contextCycles } }`. `/aam-retrospective` skill updated to read `.sprint-metrics.json` when present, falling back to git log parsing when absent (backward compatible). File is gitignored (ephemeral per-sprint), summarized in retrospective output.
**Test Plan (TDD RED):**
1. Test `sprint-update.sh metrics init S8` creates valid .sprint-metrics.json
2. Test `sprint-update.sh metrics item-start S8-001` records timestamp
3. Test `sprint-update.sh metrics item-complete S8-001` records timestamp
4. Test `sprint-update.sh metrics cycle S8-003` increments context cycle count
5. Test `sprint-update.sh metrics finalize` writes totals
6. Test .sprint-metrics.json matches defined schema
7. Test /aam-retrospective reads metrics file when present
8. Test /aam-retrospective falls back gracefully when metrics file absent
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `project/.claude/scripts/sprint-metrics.sh` (or extend `sprint-update.sh`) | Modify: `project/.claude/skills/aam-retrospective.md`, `.gitignore` (add `.sprint-metrics.json`)
**Dependencies:** None (independent of orchestrator agents)
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-009: Orchestrator integration testing [risk]
**Approach:** Write integration tests in `tests/` that validate the sprint-master's routing logic end-to-end. Tests verify: (a) each state in the routing table maps to the correct agent file, (b) agent files referenced by sprint-master all exist, (c) input/output contracts are consistent across agent boundaries, (d) SPRINT.md state transitions are valid (no skipped states), (e) error handling paths (retry, escalate) are defined for each state. These are structural/contract tests — they validate the agent definitions are consistent, not that Claude follows them (that's behavioral and can't be unit-tested).
**Test Plan (TDD RED):**
1. Test sprint-master routing table entries all reference existing agent files
2. Test all 10 states in the state machine have a routing entry
3. Test agent input/output contracts are defined for each phase transition
4. Test sprint-master defines human checkpoints for PLAN, APPROVE, BLOCKED, REWORK
5. Test sprint-master defines error handling (retry + escalate) for each agent state
6. Test no circular dependencies in agent routing
7. Test sprint-master + all phase agents are included in sync manifest (getCoreFiles or filesystem walk)
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Create: `tests/orchestrator.test.js` | Modify: none
**Dependencies:** S8-003 through S8-007 (needs all agents to exist)
**Upgrade Impact:** N/A
**Custom Instructions:** None

### S8-010: Sync/init + v4.2→v5.0 migration
**Approach:** New agent files in `project/.claude/agents/` are automatically picked up by `lib/sync.js` (it walks the filesystem). Verify this works. Add a v4.2→v5.0 migration entry in `lib/migrations.js` that: (a) marks `sprint-executor.md` as kept (it remains valid for standalone use without the orchestrator), (b) documents the new agents as additions, (c) handles any settings.json changes if needed. Test with `npx aiagentminder sync --dry-run` against a mock v4.2 target.
**Test Plan (TDD RED):**
1. Test sync.js includes new agent files in diff output
2. Test v4.2→v5.0 migration is registered in migrations.js
3. Test migration does NOT delete sprint-executor.md (it's still a valid standalone agent)
4. Test `sync --dry-run` on a v4.2 target shows correct add plan for all new agents
5. Test `sync --apply` copies new agent files to target
6. Test init includes new agents in fresh installation
**Integration/E2E:** None
**Post-Merge Validation:** None
**Files:** Modify: `lib/migrations.js`, possibly `lib/init.js` | Create: none (sync.js auto-discovers)
**Dependencies:** S8-003 through S8-008 (all new files must exist)
**Upgrade Impact:** v4.2→v5.0 migration path. Existing sprint-executor users get new agents added alongside.
**Custom Instructions:** None

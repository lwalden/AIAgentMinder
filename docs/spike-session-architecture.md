# Spike: Session Architecture — Agent-Based Context Optimization

**Date:** 2026-03-30
**Status:** Research complete, pending decision
**Triggered by:** Sprint workflow (150 lines / ~3k tokens) loads every session even when not sprinting. Context cleanup audit in accessi-shield revealed broader pattern: most governance content loads regardless of task type.

---

## Problem Statement

AIAgentMinder loads all rules into every session. A developer doing quick research pays the same context cost as one running a multi-item sprint. As the framework grows (more hooks, more review lenses, more governance), this tax increases per session while the percentage relevant to any given task decreases.

**Current context cost per session (rules only):**

| Rule file | Lines | Tokens (~) | Relevant to |
|---|---|---|---|
| `git-workflow.md` | 15 | ~300 | Everything |
| `tool-first.md` | 25 | ~500 | Everything |
| `correction-capture.md` | 45 | ~900 | Everything |
| `scope-guardian.md` | 20 | ~400 | Feature work, sprints |
| `approach-first.md` | 25 | ~500 | Architecture changes |
| `debug-checkpoint.md` | 25 | ~500 | Debugging |
| `code-quality.md` | 15 | ~300 | Dev work |
| `architecture-fitness.md` | 40 | ~800 | Dev work |
| `sprint-workflow.md` | 150 | ~3000 | Sprints only |
| **Total** | **360** | **~7200** | |

A research session needs ~1700 tokens of rules. A sprint session needs ~7200. Today both pay ~7200.

---

## Use Cases

Every AIAgentMinder interaction falls into one of these modes:

| Mode | Description | Duration | Context pressure | Frequency |
|---|---|---|---|---|
| **Sprint execution** | Full state machine: plan → spec → approve → execute → test → review → merge | Hours, multi-cycle | Very high | Weekly |
| **Sprint item dev** | Working on a single sprint item (branch, TDD, implement) | 30-90 min | High | Daily during sprints |
| **Sprint item QA** | Quality gate, self-review, PR pipeline for a sprint item | 15-30 min | Medium | Per item |
| **One-off feature/fix** | Single change outside sprint governance | 15-60 min | Medium | Ad hoc |
| **Hotfix** | Urgent fix, minimal ceremony, fast path to PR | 5-15 min | Low | Rare |
| **Debugging/triage** | Reproduce, diagnose, plan fix for a specific issue | 15-60 min | Medium-high | Ad hoc |
| **Research** | Exploring code, reading docs, web searches, evaluating options | 10-30 min | Low | Frequent |
| **Backlog/roadmap** | Adding features, reprioritizing, updating strategy docs | 10-20 min | Low | Weekly |
| **Documentation** | Writing/updating docs, README, guides | 15-45 min | Low | Ad hoc |
| **Project setup** | Initial `aam-setup` or `aam-update` | 5-10 min | Low | Rare |

### What each mode actually needs

| Mode | Universal rules | Scope guardian | Approach-first | Debug checkpoint | Code quality | Arch fitness | Sprint workflow | Context cycling |
|---|---|---|---|---|---|---|---|---|
| Sprint execution | Yes | Yes | Yes | Yes | Yes | Yes | **Yes (3k tokens)** | Yes (multi-cycle) |
| Sprint item dev | Yes | Yes | Yes | Yes | Yes | Yes | Partial (execute state only) | Maybe |
| Sprint item QA | Yes | No | No | No | No | Yes | Partial (test/review states) | No |
| One-off feature | Yes | Maybe | Yes | Yes | Yes | Yes | No | Maybe |
| Hotfix | Yes | No | No | Yes | Yes | No | No | No |
| Debugging | Yes | No | No | **Yes** | No | No | No | Maybe |
| Research | Yes | No | No | No | No | No | No | No |
| Backlog/roadmap | Yes | Yes | No | No | No | No | No | No |
| Documentation | Yes | No | No | No | No | No | No | No |
| Project setup | Yes | No | No | No | No | No | No | No |

**Key insight:** Sprint workflow (the heaviest single file) is only needed for 1-2 out of 10 use cases. Code quality and architecture fitness are needed for about half. Universal rules are always needed.

---

## Approach B: Agent-Based Session Profiles

### Concept

AIAgentMinder provides a set of **session profiles** as Claude Code agent definitions. Each profile loads exactly the instructions needed for that mode. The user picks their mode when starting Claude (or uses the default).

CLAUDE.md + universal rules always load (Claude Code's native behavior). The agent adds mode-specific instructions on top.

### Architecture

```
.claude/
  agents/
    sprint-executor.md      — Full sprint state machine + quality checklist
    dev.md                  — TDD cycle, code quality, architecture fitness, approach-first
    qa.md                   — Quality gate, self-review lenses, PR pipeline
    hotfix.md               — Fast path: branch, fix, test, PR (minimal ceremony)
    debug.md                — Debug checkpoint, triage methodology, reproduction steps
    research.md             — (optional) Lightweight — just reminds about decision logging
  rules/
    git-workflow.md          — KEPT: universal (15 lines)
    tool-first.md            — KEPT: universal (25 lines)
    correction-capture.md    — KEPT: universal (45 lines)
    context-cycling.md       — NEW: generic cycling procedure (~15 lines, decoupled from sprint)
    scope-guardian.md         — MOVED to sprint-executor + dev agents
    approach-first.md         — MOVED to sprint-executor + dev agents
    debug-checkpoint.md       — MOVED to debug + dev + sprint-executor agents
    code-quality.md           — MOVED to dev + sprint-executor agents
    architecture-fitness.md   — MOVED to dev + qa + sprint-executor agents
    sprint-workflow.md        — MOVED entirely to sprint-executor agent
```

### How it works

```powershell
# Research, backlog, docs, quick questions
claude

# Feature development (single item or outside sprint)
claude --agent dev

# Sprint execution (full state machine)
claude --agent sprint-executor
# OR via sprint-runner for auto-restart:
.\sprint-runner.ps1 -Agent sprint-executor

# Debugging a specific issue
claude --agent debug

# Hotfix
claude --agent hotfix

# Quality review on existing PR
claude --agent qa
```

### Context cost per mode

| Mode | Base rules | Agent additions | Total tokens (~) | Savings vs today |
|---|---|---|---|---|
| Research/docs/backlog | ~1700 | 0 | ~1700 | -75% |
| Hotfix | ~1700 | ~300 | ~2000 | -72% |
| Debugging | ~1700 | ~800 | ~2500 | -65% |
| Dev (one-off or sprint item) | ~1700 | ~2100 | ~3800 | -47% |
| QA | ~1700 | ~1500 | ~3200 | -56% |
| Sprint execution | ~1700 | ~4500 | ~6200 | -14% |

### Context cycling (decoupled)

A new lightweight `context-cycling.md` rule (~15 lines) stays in `rules/` for all sessions:

```markdown
# Context Cycling
# When the PreToolUse hook blocks tools with "CONTEXT CYCLE REQUIRED":
1. Commit all uncommitted work
2. Write .sprint-continuation.md with: what you were doing, what's next,
   any context that would be lost
3. Write empty .sprint-continue-signal file
4. Run: bash .claude/scripts/context-cycle.sh
```

The sprint-executor agent adds sprint-specific content to its cycling instructions:
"Include sprint ID, current item, spec references, and SPRINT.md state in the continuation file."

Non-sprint sessions get generic cycling: "Include what you were working on and what's next."

### Sprint-runner integration

```powershell
# sprint-runner.ps1 enhanced with --agent flag:
param(
    [string]$Agent = "sprint-executor",
    [string]$Prompt = "",
    [string]$PermissionMode = ""
)

# In the restart loop:
& claude --agent $Agent @claudeArgs $resumePrompt
```

### What users need to know

Users don't need to memorize agent names. The pattern is:
- Just `claude` for most things (cheap, universal rules only)
- `claude --agent sprint-executor` (or sprint-runner) for sprints
- Other agents are available but optional — `dev`, `debug`, `hotfix`, `qa`

Users who don't want to think about modes at all can set a default:
```json
// .claude/settings.json
{ "agent": "dev" }
```
Then `claude` always loads the dev profile, and they override with `--agent` when needed.

### Strengths

- **Simple.** One CLI flag changes the mode. No orchestration complexity.
- **Reliable.** Agent instructions load at system prompt level — same guarantee as today's rules.
- **Incremental.** Can ship sprint-executor first, add other agents later.
- **Backward compatible.** Plain `claude` still works, just lighter.
- **Composable.** sprint-runner already exists, just needs `--agent` parameter.
- **Discoverable.** `claude agents list` shows available modes.

### Weaknesses

- **Mode selection is manual.** User must remember to use the right agent. If they run a sprint with plain `claude`, no sprint governance.
- **Agent instructions are static.** Can't conditionally load within an agent based on task state. The sprint-executor loads the full state machine even if you're on the last item.
- **Duplication.** Rules moved to agents need to be duplicated across agents that share them (e.g., `code-quality` in both `dev` and `sprint-executor`). Changes must be synced manually.
- **Context cycling on resume.** `--agent` doesn't survive `--continue`. sprint-runner handles this for sprints, but ad-hoc `--agent dev` sessions that cycle would need manual restart with the flag.

### Risk: "forgot to use the agent"

If a user starts `claude` and says "start a sprint", there's no sprint-workflow loaded. Mitigation options:
1. SessionStart hook detects "sprint" in SPRINT.md status and warns: "Active sprint detected. Restart with `claude --agent sprint-executor` for full governance."
2. A stub rule (~5 lines) that says: "Sprint governance requires the sprint-executor agent. If user requests sprint work, tell them to restart with `--agent sprint-executor`."
3. Accept the risk — the user chose their mode. This is analogous to opening vim vs. an IDE.

---

## Approach C: Orchestrator + Specialist Sub-Agents

### Concept

Instead of the user running a long-lived sprint session, a lightweight **sprint master** orchestrator agent coordinates specialist sub-agents for each phase. Each sub-agent gets fresh context, focused instructions, and operates within a bounded scope. The orchestrator manages state transitions and human checkpoints.

This extends beyond sprints: a **task router** pattern where any complex workflow is decomposed into agent-per-concern.

### Architecture

```
.claude/
  agents/
    # === Orchestrators (launched by user via --agent) ===
    sprint-master.md         — Sprint state machine, routes to phase agents

    # === Phase specialists (spawned by orchestrators) ===
    sprint-planner.md        — Decomposes roadmap into sprint issues
    sprint-speccer.md        — Writes implementation specs per item
    item-executor.md         — TDD cycle: branch, tests, implement, refactor
    quality-reviewer.md      — Quality gate + self-review lenses + judge pass
    pr-pipeliner.md          — Review-fix-test-merge loop
    sprint-retro.md          — Retrospective metrics and sizing

    # === Standalone agents (launched by user via --agent) ===
    dev.md                   — General development (same as Approach B)
    debug.md                 — Debugging and triage
    hotfix.md                — Minimal-ceremony fast path
    qa.md                    — Standalone quality review
    research.md              — Lightweight exploration

  rules/
    git-workflow.md           — Universal (kept in rules/)
    tool-first.md             — Universal (kept in rules/)
    correction-capture.md     — Universal (kept in rules/)
    context-cycling.md        — Generic cycling procedure (kept in rules/)
```

### How the sprint master works

The sprint master's instructions are ~30-40 lines — a state machine router:

```markdown
# Sprint Master

You are a sprint orchestrator. You manage state transitions and coordinate
specialist agents. You do NOT contain detailed instructions for any phase —
each specialist agent owns its domain.

## State Machine
PLAN → SPEC → APPROVE → EXECUTE → TEST → REVIEW → MERGE → VALIDATE → NEXT → COMPLETE

## Routing Table
| State | Agent | Input | Output |
|---|---|---|---|
| PLAN | sprint-planner | roadmap path, DECISIONS.md path, sizing hint | Proposed issue table |
| SPEC | sprint-speccer | Approved issue list, relevant source paths | Specs per item |
| APPROVE | (human checkpoint) | Present specs, wait for approval | Approved specs |
| EXECUTE | item-executor | Spec for this item, branch naming convention | "Tests passing" or "blocked: {reason}" |
| TEST | quality-reviewer | Diff (git diff main), .pr-pipeline.json config | "Gate passed" or "failures: {list}" |
| REVIEW | pr-pipeliner | PR number, .pr-pipeline.json config | "Merged" or "escalated: {reason}" |
| VALIDATE | item-executor | Post-merge validation from spec | "Pass" or "fail: {details}" |
| COMPLETE | sprint-retro | SPRINT.md, git log | Retrospective report |

## Your responsibilities
1. Read SPRINT.md to determine current state
2. Spawn the correct agent for the current state
3. Pass results from one agent to the next
4. Update SPRINT.md status after each transition (via sprint-update.sh)
5. Handle human checkpoints (PLAN approval, SPEC approval, BLOCKED, REWORK)
6. Handle agent failures (retry once, then escalate to human)

## What you do NOT do
- Write code
- Run tests
- Review PRs
- Make architectural decisions
- Contain any phase's detailed instructions
```

### How sub-agents receive context

Each sub-agent is spawned via the Agent tool with a prompt that includes:

1. **The task** — what to do right now
2. **File references** — paths to read (not content — the agent reads them in its own context)
3. **Prior output** — results from the previous phase agent

Example orchestrator spawning an item-executor:

```
Spawn item-executor agent with:
  "Execute sprint item S2-003: Negative test enforcement in quality gate.

   Read the spec from SPRINT-SPECS.md section S2-003.
   Read CLAUDE.md for project context.
   Read .claude/rules/git-workflow.md for branch naming.

   Your branch should be: feature/S2-003-negative-test-enforcement
   Run the full test suite before reporting done.

   Report back: 'done' with commit hash, or 'blocked: {reason}'."
```

The item-executor agent's own instructions cover TDD methodology, code quality standards, and architecture fitness — it doesn't need the orchestrator to contain these.

### Base instructions problem

Every sub-agent needs certain universal behaviors (git workflow, tool-first, etc.). Three options:

**Option 1: Include in each agent file (duplication)**
Each agent file includes the universal rules inline. Simple but duplicated. Changes to git-workflow need updating in every agent file.

**Option 2: "Read these files" directive in each agent**
Each agent's instructions start with: "Before starting work, read: `.claude/rules/git-workflow.md`, `.claude/rules/tool-first.md`". Costs tokens per agent but stays DRY. Reliable because the agent reads files in its own context (not a "maybe read" — it's the first instruction).

**Option 3: Rules auto-load for sub-agents too**
If Claude Code loads `.claude/rules/` for sub-agents the same way it does for the main session, this is free. **Needs verification.**

Best path: verify Option 3 first. If rules auto-load for sub-agents, the problem is solved with zero effort. If not, use Option 2.

### Context cycling in Approach C

**Natural cycling:** The primary context pressure problem is largely solved by the architecture itself. Each sub-agent gets fresh context for its bounded task:

| Agent | Expected context usage | Cycling needed? |
|---|---|---|
| sprint-master | Low (~30 lines instructions + state tracking) | Unlikely |
| sprint-planner | Low (reads roadmap, produces table) | No |
| sprint-speccer | Medium (reads source files per item) | Unlikely |
| item-executor | **High** (reads spec, writes code, runs tests) | **Possible for large items** |
| quality-reviewer | Medium (reads diff, runs checks) | Unlikely |
| pr-pipeliner | Medium (review-fix cycles) | Unlikely |

The item-executor is the only agent likely to hit context limits, and only for very large items.

**If a sub-agent hits context limits:**

1. The PreToolUse hook fires inside the sub-agent (hooks are process-wide)
2. The sub-agent is blocked from further tool use
3. The sub-agent returns to the orchestrator with: "Context limit reached. Completed: {what's done}. Remaining: {what's left}."
4. The orchestrator spawns a fresh item-executor with: "Continue item S2-003. Already completed: {summary}. Branch: {branch name}. Pick up from: {where agent left off}."

This is **better** than today's context cycling because:
- Only the item-executor restarts, not the entire session
- The orchestrator retains full state awareness
- No continuation files, no process killing, no profile hooks
- The handoff is structured (orchestrator → agent → orchestrator → new agent), not a crash-and-restart

**Edge case:** If the orchestrator itself hits context limits (unlikely given ~30 lines of instructions, but possible after many items), it would need traditional context cycling. The generic `context-cycling.md` rule handles this.

### Handling non-sprint use cases

Approach C's orchestrator pattern extends beyond sprints:

| Use case | Approach |
|---|---|
| Sprint execution | `claude --agent sprint-master` → spawns phase agents |
| One-off feature | `claude --agent dev` (no orchestrator needed — single agent) |
| Hotfix | `claude --agent hotfix` (single agent) |
| Debugging | `claude --agent debug` (single agent, might spawn `item-executor` for the fix) |
| Research | Plain `claude` (no agent needed) |
| Complex refactor | Could have a `refactor-master` orchestrator that plans → executes → tests per file group |

The orchestrator pattern is powerful for **multi-phase workflows**. Single-phase work (hotfix, debug, research) doesn't need orchestration — standalone agents from Approach B work fine.

**This means C is not a replacement for B — it's a layer on top of B.** B provides session profiles. C provides within-session orchestration for complex workflows.

### Sprint-runner integration

sprint-runner.ps1 would start the sprint-master agent:

```powershell
# Sprint-runner becomes simpler — orchestrator handles most complexity
& claude --agent sprint-master @claudeArgs $Prompt
```

Context cycling restart is mostly unnecessary because sub-agents get fresh context. The sprint-master orchestrator is lightweight enough to run for an entire sprint without cycling. If it does cycle, sprint-runner catches it as before.

### Strengths

- **Best context efficiency.** Each agent loads only its own instructions in a fresh context window. An item-executor doesn't carry planning context. A reviewer doesn't carry implementation context.
- **Natural context cycling.** Fresh agent per phase means context pressure is bounded per task, not cumulative across the sprint.
- **Focused instructions.** Each agent can be highly specific. The item-executor knows TDD deeply. The reviewer knows security patterns deeply. No instruction competes for attention with unrelated instructions.
- **Parallel potential.** In theory, multiple item-executors could run in parallel on independent items (if Claude Code supports parallel sub-agents).
- **Graceful degradation.** If one agent fails, the orchestrator can retry or escalate without losing the entire sprint's context.
- **Testable in isolation.** Each agent can be tested independently — spawn the quality-reviewer with a known diff and verify its output.

### Weaknesses

- **Complexity.** 6-8 agent definitions to maintain. Orchestrator routing logic. Error handling for agent failures. More moving parts.
- **Agent spawning overhead.** Each Agent tool call has latency. A sprint with 5 items spawns ~25+ agents. If agent startup is slow, this adds up.
- **Context re-reading.** Each sub-agent starts fresh and must read project files. An item-executor reads CLAUDE.md, the spec, source files — every time. This trades context window tokens for I/O tokens (reading files is cheaper than carrying stale context, but not free).
- **Communication bandwidth.** The orchestrator passes results between agents via text. Complex intermediate state (partial implementation, test results, review findings) must be serialized into the agent prompt. Information loss is possible.
- **Debugging is harder.** When something goes wrong in a sub-agent, the orchestrator sees only the final output. The sub-agent's reasoning is lost (different context window).
- **Unproven pattern.** No existing AIAgentMinder users have tested this. The viability tests confirm mechanics work, but sprint-scale execution hasn't been validated.
- **Base instructions overhead.** Each sub-agent re-reads universal rules. With 25+ agents per sprint, that's 25x the file I/O for git-workflow, tool-first, etc. (If rules auto-load for sub-agents, this is mitigated.)

### Risk: orchestrator becomes a bottleneck

If the orchestrator's routing logic grows complex (error handling, retry logic, branching on agent results, handling human checkpoints mid-phase), it may start approaching the complexity of today's sprint-workflow.md. The whole point was to keep the orchestrator light.

Mitigation: Strict discipline that the orchestrator is ONLY a state machine + router. Any logic about HOW to do something belongs in the specialist agent.

### Risk: agent prompt quality determines execution quality

Today, sprint-workflow.md is a detailed spec that Claude follows. In Approach C, the orchestrator crafts prompts for each sub-agent. If those prompts are imprecise, the sub-agent may do the wrong thing. The quality of sprint execution depends on the quality of inter-agent communication.

Mitigation: Agent prompts are mostly templated (the orchestrator fills in item-specific details into a fixed template). The template quality can be tested and refined.

---

## Comparative Analysis

### Context efficiency across use cases

| Use case | Today | Approach B | Approach C |
|---|---|---|---|
| Research | 7200 tokens | 1700 tokens | 1700 tokens |
| Hotfix | 7200 tokens | 2000 tokens | 2000 tokens |
| Debugging | 7200 tokens | 2500 tokens | 2500 tokens |
| Dev (one-off) | 7200 tokens | 3800 tokens | 3800 tokens |
| Sprint item dev | 7200 tokens | 6200 tokens | ~2500 tokens per agent |
| Sprint execution (full) | 7200 tokens | 6200 tokens | ~1500 tokens (orchestrator) + ~2500 per phase agent |
| QA review | 7200 tokens | 3200 tokens | ~2000 tokens per agent |

### Separation of concerns

| Concern | Today | Approach B | Approach C |
|---|---|---|---|
| Sprint state machine | Mixed into rules | Isolated in sprint-executor agent | Orchestrator only |
| TDD methodology | Mixed into rules | In dev/sprint-executor agents | In item-executor agent |
| Quality checks | Mixed into rules | In qa/sprint-executor agents | In quality-reviewer agent |
| Review methodology | Mixed into skills | In qa agent + skills | In quality-reviewer agent |
| Context cycling | Coupled to sprint | Decoupled, generic rule | Mostly unnecessary (fresh agents) |
| PR pipeline | In skills | In skills (unchanged) | In pr-pipeliner agent |

### Reliability

| Dimension | Today | Approach B | Approach C |
|---|---|---|---|
| Instructions load correctly | Guaranteed (rules/) | Guaranteed (--agent system prompt) | Guaranteed per-agent, but orchestrator prompt quality matters |
| Quality steps not skipped | Rules + hooks enforce | Agent instructions + hooks enforce | Per-agent enforcement, orchestrator can verify |
| Context cycling works | Hook + sprint-runner | Hook + generic rule + sprint-runner | Mostly unnecessary; hook as fallback |
| User starts correct mode | N/A (always loaded) | User must pick agent (risk of forgetting) | User must pick agent (same risk) |
| Recovery from failures | Manual | sprint-runner for sprints | Orchestrator retries/escalates automatically |

### Implementation effort

| Work item | Approach B | Approach C |
|---|---|---|
| sprint-executor / sprint-master agent | Medium (move + reorganize 150 lines) | Medium (30 lines orchestrator + routing) |
| Phase specialist agents | N/A | High (6-8 agents, each 30-80 lines) |
| Other session agents (dev, debug, hotfix) | Low (30-50 lines each) | Same as B |
| Generic context cycling rule | Low (15 lines, extract from sprint-workflow) | Same as B |
| Move rules to agents | Medium (reorganize, handle duplication) | Same as B for standalone agents |
| sprint-runner changes | Low (add --agent flag) | Low (same) |
| SessionStart hook updates | Low (warn about missing agent) | Low (same) |
| Testing | Low (behavioral — agent loads, rules work) | High (orchestrator routing, agent communication, error handling) |
| Documentation | Medium | High |
| **Total** | **2-3 sprint items** | **6-10 sprint items** |

### Future extensibility

| Future feature | Approach B | Approach C |
|---|---|---|
| New review lens | Add to qa agent | Add to quality-reviewer agent |
| New sprint phase | Add to sprint-executor | New specialist agent + orchestrator route |
| Parallel item execution | Not possible (single session) | Possible (parallel sub-agents) |
| Per-phase model selection | Not possible | Yes — orchestrator picks model per agent |
| Per-phase tool restrictions | Not possible | Yes — `disallowedTools` per agent |
| Custom user workflows | Add new agent file | Add new orchestrator + agents |
| Plugin ecosystem (other people's agents) | Add agent files | Add agent files + orchestrator hooks |

---

## The Hybrid Path: B Now, C Later

The two approaches are **not mutually exclusive**. They solve different layers:

- **B solves session-level context selection** — what mode am I in?
- **C solves within-session task decomposition** — how is complex work divided?

The natural evolution:

1. **Ship B** — Create session profiles, move sprint-workflow to sprint-executor agent, decouple context cycling. Immediate savings for all non-sprint sessions.

2. **Ship C inside B** — The sprint-executor agent (from B) becomes the sprint-master orchestrator (from C). It spawns specialist agents instead of doing everything itself. B's infrastructure (agents directory, sprint-runner --agent flag, generic cycling rule) is the foundation C builds on.

3. **Extend C** — Add orchestrators for other complex workflows (multi-file refactors, migration projects, release processes).

Nothing shipped in B needs to be thrown away for C. B is the prerequisite, not an alternative.

---

## Open Questions — Resolved (S8-001 Spike, 2026-03-30)

See `tests/spike/orchestrator-prerequisites.md` for full findings.

1. **Do `.claude/rules/` auto-load for sub-agents?** **YES.** All project rules, user-global rules, CLAUDE.md, and memory files auto-load. Base instructions problem is solved — no "read these files" directives needed.

2. **What is sub-agent spawning latency?** **~21s average total round-trip** (includes agent work, not just spawning). Acceptable. Parallel spawning works — 3 agents in ~25s wall-clock.

3. **Can sub-agents be spawned in parallel?** **YES.** Verified with 3 parallel Agent tool calls completing concurrently.

4. **How does the orchestrator handle partial sub-agent failures?** Sub-agent returns its final message as plain text. Structured output contracts work. If context limit is hit, the PreToolUse hook fires inside the sub-agent; agent should return partial progress.

5. **Can sub-agents spawn sub-sub-agents?** **NO.** The Agent tool is not available to sub-agents. Nesting is exactly one level deep. This constrains quality-reviewer design (S8-006).

6. **`--agent` and `--continue` interaction**: Not retested. Sprint-runner handles restart regardless.

---

## Recommendation

**Implement Approach B as the next sprint's primary deliverable.** It provides immediate context savings (75% for research/docs, 47-72% for most dev work) with low complexity and low risk. The infrastructure it creates (agents directory, decoupled cycling, sprint-runner --agent flag) is the foundation for Approach C.

**Design Approach C as a v5.0 spike.** Validate open questions (sub-agent rules loading, spawning latency, parallel execution). Build one phase agent (item-executor) as a proof of concept within the B infrastructure. If it works well, expand to full orchestration.

**Do not attempt C without B in place first.** B's session profiles are useful regardless of whether C ships. C without B still has the "everything loads every session" problem for non-orchestrated use cases.

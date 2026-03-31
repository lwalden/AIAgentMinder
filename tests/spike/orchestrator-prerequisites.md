# Spike: Orchestrator Prerequisites — Findings

**Date:** 2026-03-30
**Sprint:** S8-001
**Status:** Complete

---

## Question 1: Do .claude/rules/ auto-load for sub-agents?

**Answer: YES**

All `.claude/rules/` files auto-load for sub-agents spawned via the Agent tool, identical to top-level sessions. Verified:

- All 10 project rules files loaded (git-workflow, sprint-workflow, scope-guardian, approach-first, debug-checkpoint, tool-first, correction-capture, architecture-fitness, code-quality, README)
- User-global rules loaded (gitignore-safety, mcp-config, tone)
- Project CLAUDE.md loaded
- User-global CLAUDE.md loaded
- User auto-memory (MEMORY.md) loaded

**Impact on design:** This is the best-case outcome. Sub-agents inherit the full governance context automatically. No need for "read these files first" directives in agent definitions. Universal rules (git-workflow, tool-first, correction-capture) do NOT need duplication in agent files.

---

## Question 2: What is sub-agent spawning latency?

**Answer: ~16-25 seconds total round-trip per agent call**

| Agent | Duration | Tool uses | Tokens |
|---|---|---|---|
| Rules test | 21,032ms | 1 | 26,672 |
| File reading | 16,163ms | 4 | 31,972 |
| Structured prompt | 25,030ms | 4 | 27,645 |
| Sub-sub-agent test | 21,696ms | 3 | 29,290 |

- **Average:** ~21,000ms total round-trip
- **Note:** This includes the agent's own work (reading files, reasoning, responding), not just spawning overhead
- **Projection for a 5-item sprint:** ~25 agent calls x ~20s = ~8 minutes of agent orchestration overhead. Acceptable — agents are doing real work during this time.
- **Parallel agent calls reduce wall-clock time:** The first 3 experiments ran in parallel and completed in ~25s wall-clock (not 62s sequential).

**Impact on design:** Latency is acceptable. No need to merge agents for performance reasons. Parallel spawning is effective for independent tasks.

---

## Question 3: Can sub-agents read project files?

**Answer: YES — reliably**

Verified:
- `package.json`: Read successfully, correct values returned (name: "aiagentminder", version: "4.2.0")
- `CLAUDE.md`: Read successfully, correct content returned
- `SPRINT.md`: Read successfully (212 lines, no truncation)
- Nonexistent file: Clean error ("File does not exist"), no crash

Sub-agents have full Read tool access. Parallel file reads work. Large files return complete content.

**Impact on design:** Agents can read specs, source files, and project state without limitations. The orchestrator passes file paths (not content) to sub-agents, and they read independently.

---

## Question 4: How does the orchestrator receive sub-agent results?

**Answer: Plain text in Agent tool output**

The orchestrator receives the sub-agent's final message as a text string in the tool result. Structured output contracts (e.g., `RESULT: key: value` format) work — the sub-agent follows the requested format and the orchestrator can parse it.

Additional metadata returned:
- `agentId` — can be used with `SendMessage` to continue the agent
- `usage` — total_tokens, tool_uses, duration_ms

**Impact on design:** The orchestrator can define input/output contracts per phase agent. Structured formats (markdown tables, key-value blocks, status codes) all survive the agent boundary. Agent continuation via `SendMessage` is available if needed.

---

## Question 5: What happens when a sub-agent hits context limits?

**Answer: Not directly testable, but behavior is predictable**

The PreToolUse hook (`context-cycle-hook.sh`) reads `.context-usage` on every tool call. When `should_cycle` is true, it blocks all tool calls except Bash, Write, and Read.

For sub-agents hitting context limits:
- The hook fires inside the sub-agent (hooks are process-wide)
- The sub-agent is blocked from further tool use
- The sub-agent should return to the orchestrator with partial progress
- The orchestrator can spawn a fresh agent to continue

**Design requirement:** Each agent definition should include a "context limit graceful degradation" instruction: "If you cannot use tools, return what you've completed so far and what remains."

**Impact on design:** The item-executor (heaviest agent) needs explicit instructions for partial-progress reporting. The orchestrator needs logic to detect partial results and spawn a continuation agent.

---

## Question 6: Can the orchestrator pass structured prompts to sub-agents?

**Answer: YES — fully reliable**

Verified:
- Multi-line markdown with headings, numbered lists, code fences: Received intact
- File path references: Resolved correctly by the sub-agent
- Structured task context (sprint, item, branch, type): All values preserved
- Output contract template: Followed exactly by the sub-agent

**Impact on design:** The orchestrator can use rich, templated prompts for each phase agent. No need to simplify or flatten prompts.

---

## Question 7: Can sub-agents spawn sub-sub-agents?

**Answer: NO — confirmed**

The Agent tool is NOT available to sub-agents. Sub-agents have access to Bash, Read, Write, Edit, Glob, Grep, Skill, ToolSearch, and Task management tools, but NOT the Agent tool.

Agent nesting is limited to exactly one level: parent session -> sub-agent.

**Impact on design:** This is the critical constraint for S8-006 (quality-reviewer). The quality-reviewer, spawned by sprint-master, cannot spawn the 5 review lens agents. Design options:
1. **Sprint-master dispatches review lenses directly** — orchestrator grows but each lens runs as a first-level sub-agent
2. **Quality-reviewer runs lenses sequentially inline** — simpler but slower, no parallelism
3. **Quality-reviewer uses Skill tool** — skills run inline (not as sub-agents), so /aam-self-review could work if it doesn't rely on Agent tool internally

Recommended: Option 1 — sprint-master handles quality review orchestration directly, spawning review lenses as parallel first-level sub-agents. This leverages parallel spawning (proven fast) and keeps each lens focused.

---

## Summary

| Question | Answer | Surprise? |
|---|---|---|
| Rules auto-load for sub-agents | YES | Good surprise — simplifies everything |
| Spawning latency | ~21s avg (acceptable) | Expected |
| File reading | YES, reliable | Expected |
| Result format | Plain text, structured contracts work | Expected |
| Context limits | Hook fires, agent should degrade gracefully | Needs explicit agent instructions |
| Structured prompts | YES, fully reliable | Expected |
| Sub-sub-agent spawning | NO | Confirmed known constraint |

**Overall assessment:** The Agent tool is well-suited for the orchestrator architecture. The best-case finding (rules auto-load) eliminates the main complexity concern. The sub-sub-agent constraint is the only design issue, and it has a clean solution (sprint-master dispatches review lenses directly).

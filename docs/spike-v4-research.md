# Spike: v4.0 Research — Platform Evolution & Governance Gaps

**Date:** 2026-03-29
**Sprint:** S1 (spike conducted during sprint pause)
**Trigger:** Conversation analysis of production experience with Claude Code + AIAgentMinder governance across multiple projects (AccessiShield, OptiTrade, etc.)

---

## Problems Identified

Three systemic problems surfaced from real-world usage:

### 1. LLM Amnesia
Claude acknowledges markdown instructions but ignores them during execution loops. When interrogated, responds with "sorry I see that was in the instructions I just didn't pay attention." This is an inherent limitation of attention mechanisms, not a bug — transformer attention is probabilistic, not deterministic. The engineering response is to move enforcement from prose → hooks wherever possible.

### 2. Smoke Test Illusion
AI tests the success path (200 OK, DB record exists) and declares victory. But actual user-facing flows have friction: clipped UI elements, invisible validation errors, redirect loops, broken signup flows. Playwright is good at "can the machine do it?" but poor at "should a human have to do it?" Tests pass, but the product is broken for real users.

### 3. Happy-Path Bias
AI tests what works, not what breaks. No negative test coverage — no malformed input tests, no auth failure paths, no race conditions. When the AI reports "all tests pass," it means "all success-case tests pass." Failure modes go entirely untested.

---

## Platform Changes (Jan-Mar 2026)

### Hooks: 3 → 26 Events, 4 Handler Types

AAM currently uses 3 hooks (PreToolUse, PostToolUse, Stop). Claude Code now offers 26 hook events across 4 handler types (command, HTTP, prompt, agent).

**High-impact new events for AAM:**

| Event | Use Case |
|---|---|
| PermissionRequest | Auto-allow sprint operations, address recurring edit permission prompts |
| StopFailure | React to rate_limit, max_output_tokens — trigger context cycling on failure |
| FileChanged | Watch SPRINT.md, .context-usage without polling |
| SubagentStart/SubagentStop | Track self-review and quality gate subagent lifecycle |
| SessionStart | Auto-detect sprint state, inject resume context |
| PreCompact/PostCompact | Detect compaction events — belt+suspenders with status line |
| HTTP hooks | POST to external dashboards without shell overhead |
| Agent hooks | LLM-evaluated gates with tool access |
| Prompt hooks | Single-turn LLM yes/no decisions (lighter than agent hooks) |

### Skills Supersede Commands

`.claude/skills/` is now the recommended location over `.claude/commands/`. Skills add:
- `context: fork` — isolated context (keeps main conversation clean)
- `agent` field — specify which custom subagent executes
- `allowed-tools` — restrict tool access per skill
- `model` / `effort` — per-skill overrides
- Hooks in frontmatter scoped to skill lifecycle
- Dynamic context injection via `` !`command` `` syntax

Commands still work but are second-class. Migration recommended.

### Custom Subagents

Defined as markdown files in `.claude/agents/` with YAML frontmatter. Full configuration: tools, disallowedTools, model, permissionMode, maxTurns, memory, mcpServers, hooks. Key constraint: subagents cannot spawn other subagents.

### 1M Context Window (GA)

Opus 4.6: ~830K usable before compaction. AAM's current thresholds (250k Sonnet, 350k Opus) were calibrated for 200k windows and need recalibration.

Status line now exposes: `exceeds_200k_tokens`, rate limit data, worktree state, agent name.

### Native Worktree Isolation

`isolation: "worktree"` gives subagents their own git worktree + branch. Auto-cleanup if no changes.

### Auto Mode (Research Preview, Mar 24 2026)

Classifier model evaluates every tool call against rules. Falls back to manual after 3 consecutive blocks. Changes the permission landscape.

### Agent Teams (Experimental)

2-16 agents on shared codebase. Not ready for governance — monitor only.

---

## Research Findings

### Context Rot Is Real and Universal (Chroma Research)

Every frontier model degrades as input length increases, even with perfect retrieval. 13.9-85% performance degradation.

Three compounding mechanisms:
1. **Lost-in-the-middle** — poor attention to content in positions 5-15 vs position 1 or 20
2. **Attention dilution** — quadratic scaling of pairwise relationships
3. **Distractor interference** — structured content paradoxically creates more plausible distractors than random shuffling

**Implication:** Well-organized rule files may paradoxically make them harder to follow. Shorter, more distinct files may outperform comprehensive ones. This validates context cycling but also suggests rule file compression.

### Industry Convergence on Hook Architecture

AWS Strands, Amazon Bedrock, NeMo Guardrails — all moving toward deterministic enforcement at tool boundaries. AAM's architecture is ahead of most competitors.

Amazon Kiro (spec-driven IDE) suffered a production incident from insufficient runtime guardrails — deleted an entire AWS environment. AAM's three-layer approach (prose + hooks + quality gates) is the correct architecture.

### Negative Testing Remains an Industry Gap

No major tool enforces negative test coverage. LLMs are biased toward happy paths. This is an open differentiator.

### Judge Agent Pattern (HubSpot)

After multi-lens review, a secondary "judge" evaluates findings for Succinctness, Accuracy, and Actionability. Only passing findings are posted. Reduced noise dramatically — 90% faster feedback, 80% engineer approval.

### Vision-Based UX Review

Multimodal models can analyze screenshots for UX friction. UW research shows 49% accuracy improvement with annotated screenshots. Directly addresses the signup-flow problem.

### Competitor Landscape

| Tool | Strength | Governance Gap |
|---|---|---|
| Amazon Kiro | Spec-driven development | Insufficient runtime guardrails (production incident) |
| OpenClaw | 247k stars, multi-channel | Security nightmare, prompt injection risks |
| OpenAI Codex | Strong sandboxing | No workflow governance |
| Tessl | Skill quality evaluation | No sprint/workflow management |
| AAM | Workflow + hooks + quality gates | No UX validation, no negative test enforcement, commands not skills |

AAM's unique moat: the governance *workflow* (sprint state machine + quality gates + context cycling) combined with deterministic enforcement (hooks). No competitor has all three.

---

## Recommended Changes

### Tier 1 — High Impact (directly addresses identified problems)

| # | Change | Problem Addressed |
|---|---|---|
| 1 | **Negative test enforcement** — quality-gate check for error-path assertions | Happy-path bias |
| 2 | **UX friction review lens** — 5th self-review lens using Playwright screenshots + vision model | Smoke test illusion |
| 3 | **Commands → skills migration** — move 14 aam-* commands to .claude/skills/ | Platform evolution |
| 4 | **Judge agent pass** — filter self-review findings for actionability | Review noise |
| 5 | **Context cycling recalibration** — update thresholds for 1M context | 1M context GA |
| 6 | **Setup auto-detection** — read existing repo to pre-populate project identity questions | User friction in onboarding |

### Tier 2 — Strategic (strengthens the framework)

| # | Change | Benefit |
|---|---|---|
| 7 | **New hooks integration** — PermissionRequest, StopFailure, SessionStart, PreCompact | Deterministic enforcement expansion |
| 8 | **Custom subagents for review lenses** — define each lens as .claude/agents/ file | Configurability, tool restrictions |
| 9 | **Rule file compression** — move enforcement to hooks, shorten prose | Context rot mitigation |
| 10 | **Ephemeral task context injection** — phase-specific rule loading via hooks | Context saturation reduction |

### Tier 3 — Future (monitor)

| # | Change | Status |
|---|---|---|
| 11 | Agent teams governance | Experimental — monitor |
| 12 | Worktree-native sprint items | Future parallel execution |
| 13 | Auto mode compatibility | Research preview — test interaction |

---

## Sources

- Chroma Context Rot Research: https://research.trychroma.com/context-rot
- Anthropic Effective Context Engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Claude Code Hooks Reference: https://code.claude.com/docs/en/hooks
- Claude Code Skills Reference: https://code.claude.com/docs/en/skills
- Claude Code Subagents Reference: https://code.claude.com/docs/en/sub-agents
- 1M Context GA Announcement: https://claude.com/blog/1m-context-ga
- Auto Mode Announcement: https://claude.com/blog/auto-mode
- HubSpot Multi-Model Code Review: https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution
- Amazon Kiro Incident: https://www.aicerts.ai/news/amazon-kiro-controversy-highlights-ai-software-quality/
- AGENTS.md Standard: https://github.com/agentsmd/agents.md
- Manus Context Engineering: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
- UW Vision LLM UI Testing: https://courses.cs.washington.edu/courses/cse503/25wi/final-reports/Using%20Vision%20LLMs%20For%20UI%20Testing.pdf

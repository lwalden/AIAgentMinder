# /aam-brief - Product Brief & Roadmap Creation

You are helping the user create or update `docs/strategy-roadmap.md` for this project.
This document is the "north star" for development -- it tells Claude the "why" behind decisions.

---

## Before Starting

Read `CLAUDE.md` to understand the project identity (name, type, stack).
If Project Identity is still placeholder brackets, run `/aam-setup` first.

> **Note:** Claude Code has a built-in `/plan` command that toggles Plan Mode (read-only exploration). This command (`/aam-brief`) is different — it produces a product brief and strategy roadmap.

---

## Step 0: Assess Starting Point

Ask the user where they are:

**A) Rough concept** -- "I have a vague idea but need help figuring everything out"
**B) Clear idea, no details** -- "I know what I want but haven't worked out specifics"
**C) Partial plan or spec** -- "I have some docs/notes -- help me fill in gaps"
**D) Detailed plan or spec** -- "I have a writeup -- translate it into a roadmap"
**E) Existing project** -- "The project already has code -- I'm adding AIAgentMinder for governance"

| Starting Point | Approach |
|---------------|----------|
| A) Rough concept | Full interview (all rounds) plus exploratory questions |
| B) Clear idea | Full interview as written below |
| C) Partial plan | Read shared docs, ask only about gaps |
| D) Detailed plan | Generate roadmap directly, clarify ambiguities only |
| E) Existing project | Codebase audit + current-state interview; skip product brief, generate filled state files |

---

## Starting Point E: Existing Project

Skip the product planning interview. The goal is to capture current state, not design a product.

### Step E1: Audit the Codebase

Read key files to understand what exists:
- `CLAUDE.md` (if present) -- existing project identity or instructions
- `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or equivalent -- stack and dependencies
- `README.md` -- project description
- Directory structure -- infer architecture

Summarize what you found: language, framework, rough architecture, apparent project stage.

### Step E2: Interview (one round)

Ask in a single grouped message:
- What phase is this project in? (early prototype / active development / maintenance)
- What's working and stable?
- What's currently in progress or incomplete?
- What are the immediate next priorities?
- What significant decisions have already been made? (stack choices, auth approach, DB, APIs, key libraries) -- these become DECISIONS.md entries
- Any known blockers or open questions?
- Any governance features you want to disable? (TDD, sprint planning, architecture fitness rules are all enabled by default)

### Step E3: Generate State Files

Do NOT generate `docs/strategy-roadmap.md` unless the user asks. Instead:

1. **Write a filled-in `PROGRESS.md`** reflecting actual current state:
   - Phase based on what you learned
   - Active Tasks = what's in progress right now
   - Current State = what's working / partial / broken
   - Next Priorities = the immediate next steps the user described

2. **Seed `DECISIONS.md`** with retroactive ADR entries for each significant decision identified in Step E2. Use the project's format (Lightweight or Formal -- ask if unknown). Each entry needs alternatives considered and tradeoffs, even if reconstructed from context.

3. **Populate `CLAUDE.md` Project Identity** with actual values from the audit.

4. **Install all governance features** (all enabled by default — same as new projects):
   - Copy `code-quality.md` from the AIAgentMinder template to `[target]/.claude/rules/code-quality.md` (create the directory if needed). Also copy `project/.claude/rules/README.md`.
   - Copy `sprint-workflow.md` from template to `[target]/.claude/rules/sprint-workflow.md`. Create `SPRINT.md` from template. Add `@SPRINT.md` to CLAUDE.md (after the Context Budget table — this is Claude Code's native import syntax, loads SPRINT.md every session). Add SPRINT.md row to CLAUDE.md Context Budget table: `| SPRINT.md | ~35 lines active | Archived when sprint completes |`. Add reminder to Human Actions: "Review and approve sprint specs before Claude begins coding — every sprint starts with your approval."
   - Copy `architecture-fitness.md` from template to `[target]/.claude/rules/architecture-fitness.md`. Tell the user to customize it.

5. **Ask:** "Do you want a `docs/strategy-roadmap.md` too? It's optional for existing projects -- useful if you want a north-star doc for future phases."

6. Tell the user: "AIAgentMinder is set up. Run `/aam-handoff` at the end of each session to checkpoint decisions and key context."

---

## Question Flow

Ask questions in grouped rounds, not one at a time. Adapt based on project type.

### Pre-Round (Starting Point A only): Explore the Idea
- Are there existing tools or products that solve a similar problem? What's wrong with them?
- What would make someone choose your tool over doing nothing?
- Is this a "scratching your own itch" project or aimed at others?

### Round 1: Core Understanding
- What does this project do? (elevator pitch)
- Who will use it?
- What's the core problem it solves?
- What makes it different from alternatives?

### Round 2: Scope & Technical
- 3-5 must-have features for v1?
- Features that can wait?
- What is explicitly OUT of scope? (things this project will never do)
- Constraints? (budget, hosting, compliance, timeline)
- External services or APIs needed?
- MCP servers? (database tools, browser automation, etc. -- or "none")
- Target launch date?

### Round 3: Governance Setup

**All governance features are enabled by default.** Do not ask the user to choose a tier or opt into individual features. Install everything:

- **Code quality guidance:** TDD, review-before-commit, build-before-commit
- **Sprint planning:** structured issue decomposition with spec phase, per-issue PRs, autonomous execution
- **Architecture fitness rules:** structural constraints — user customizes after setup

Tell the user in one line:
> "All governance features enabled — TDD, sprint planning, self-review, and architecture fitness rules. Edit `.claude/rules/` to disable any you don't want."

**Install all governance files:**

1. Copy `code-quality.md` from the AIAgentMinder template (`project/.claude/rules/code-quality.md`) to `[target]/.claude/rules/code-quality.md` (create the directory if needed). Also copy `project/.claude/rules/README.md`.
2. Copy `sprint-workflow.md` from template to `[target]/.claude/rules/sprint-workflow.md`.
3. Create `SPRINT.md` from template (`project/SPRINT.md`) if it doesn't exist.
4. Add `@SPRINT.md` to CLAUDE.md after the Context Budget table (Claude Code's native import syntax — loads SPRINT.md every session when the file exists).
5. Add to CLAUDE.md Context Budget table: `| SPRINT.md | ~35 lines active | Archived when sprint completes |`.
6. Add to `docs/strategy-roadmap.md` Human Actions Needed: "Review and approve sprint specs before Claude begins coding — every sprint starts with your approval."
7. Copy `architecture-fitness.md` from template to `[target]/.claude/rules/architecture-fitness.md`.
8. Tell the user: "Architecture fitness rules copied. Open `.claude/rules/architecture-fitness.md` and replace the placeholder constraints with rules for your project's architecture."

### Decision Forcing: Surface Hard-to-Reverse Choices

After Round 2 (or after gathering technical stack information in any starting point), identify decisions that are **hard to reverse** and surface them proactively. Do not wait for the user to raise them — the value is catching them before they're locked in.

For each significant technical choice, check whether it carries downstream consequences the user may not have considered. Raise it in a single grouped message:

**Patterns that trigger a decision point:**

| Choice | Consequence to surface |
|--------|----------------------|
| Relational DB (Postgres, MySQL) | Search strategy — full-text search needs GIN index or external search service |
| JWT / stateless auth | No server-side revocation — stolen tokens valid until expiry |
| NoSQL (MongoDB, DynamoDB) | Joins are expensive — how will you handle relational data? |
| Monorepo | CI complexity, shared dependency management overhead |
| Microservices | Network latency, distributed tracing, eventual consistency |
| External auth provider (Auth0, Clerk) | Vendor lock-in and per-user pricing at scale |
| ORM vs raw SQL | ORM hides query cost; raw SQL is harder to maintain |
| Server-side rendering | SEO benefit, but state management becomes more complex |
| Third-party API as core dependency | Outage = your outage; rate limits = your limits |

For each decision point identified, say:

> "You've chosen [X]. This means [consequence]. [Optional: alternative and its tradeoff.] Do you want to decide [downstream question] now, or defer it?"

If the user decides now: log it. If they defer: add a `<!-- TODO: -->` marker to the roadmap.

**Reversal cost language:** When a decision is hard to reverse, say so explicitly. "This choice is hard to change after you have data in it" or "Swapping this later would require a database migration" makes the stakes concrete.

### Round 4: Unknowns (only if gaps exist)
- What decisions are you unsure about?
- What needs research first?

After gathering answers, summarize and confirm: "Does this capture it? Anything to add?"

---

## Document Generation

Fill in `docs/strategy-roadmap.md` using the lean template. Keep it brief — a product brief, not an enterprise strategy doc. The user can always expand sections later.

### For Each MVP Feature, Include Acceptance Criteria
```markdown
1. [Feature] -- Acceptance: [testable criterion]
```

### For Non-Goals, Be Explicit
The "Out of Scope" section in the roadmap should list concrete things the project will NOT do,
not vague disclaimers. "Won't support offline mode" is good. "Won't do everything" is useless.

### For Unknowns, Use TODO Markers
```markdown
<!-- TODO: [What needs deciding] | WHEN: [deadline] | BLOCKS: [what] -->
```

---

## After Generation

1. Write the completed `docs/strategy-roadmap.md`
2. Ask: "Do you prefer **lightweight one-liner ADRs** or **formal ADRs** (Context / Decision / Consequences)?" Record the answer in `DECISIONS.md` as `Format: Lightweight` or `Format: Formal`
3. **Log decision points to `DECISIONS.md`** — For each decision surfaced during the Decision Forcing step that the user resolved:
   - Record the decision with: what was chosen, alternatives considered, reversal cost, and why this choice was made.
   - Use this format (lightweight):
     ```
     [TOPIC]: [Choice made]. Alternatives: [what else was considered]. Reversal cost: [high/medium/low — and why]. Rationale: [reason].
     ```
   - For deferred decisions: add a `<!-- TODO: [decision question] | WHEN: [trigger] | BLOCKS: [what] -->` marker in the roadmap's Open Questions section.
4. Populate `## MVP Goals` in `CLAUDE.md` with Phase 1 deliverables (3-5 testable bullet points)
5. If MCP servers were mentioned, add `**MCP Servers:**` line to Project Identity in `CLAUDE.md`
6. Summarize what was installed: "All governance features enabled — TDD, sprint planning, self-review, and architecture fitness rules. Governance rules live in `.claude/rules/` and are loaded automatically each session. SPRINT.md is loaded via `@import` in CLAUDE.md."
7. Tell the user: "Your roadmap is ready. When you're ready, say 'start a sprint' or 'begin Phase 1' and I'll propose issues with detailed specs for your review."

# /plan - Product Brief & Roadmap Creation

You are helping the user create or update `docs/strategy-roadmap.md` for this project.
This document is the "north star" for development -- it tells Claude the "why" behind decisions.

---

## Before Starting

Read `CLAUDE.md` to understand the project identity (name, type, stack).
If Project Identity is still placeholder brackets, run `/setup` first.

---

## Step 0: Assess Starting Point

Ask the user where they are:

**A) Rough concept** -- "I have a vague idea but need help figuring everything out"
**B) Clear idea, no details** -- "I know what I want but haven't worked out specifics"
**C) Partial plan or spec** -- "I have some docs/notes -- help me fill in gaps"
**D) Detailed plan or spec** -- "I have a writeup -- translate it into a roadmap"
**E) Existing project** -- "The project already has code -- I'm adding AIAgentMinder for session continuity and governance"

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

### Step E3: Generate State Files

Do NOT generate `docs/strategy-roadmap.md` unless the user asks. Instead:

1. **Write a filled-in `PROGRESS.md`** reflecting actual current state:
   - Phase based on what you learned
   - Active Tasks = what's in progress right now
   - Current State = what's working / partial / broken
   - Next Priorities = the immediate next steps the user described

2. **Seed `DECISIONS.md`** with retroactive ADR entries for each significant decision identified in Step E2. Use the project's format (Lightweight or Formal -- ask if unknown). Each entry needs alternatives considered and tradeoffs, even if reconstructed from context.

3. **Populate `CLAUDE.md` Project Identity** with actual values from the audit.

4. **Ask:** "Do you want a `docs/strategy-roadmap.md` too? It's optional for existing projects -- useful if you want a north-star doc for future phases, not needed just for session continuity."

5. Tell the user: "AIAgentMinder is set up. Run `/handoff` at the end of each session to keep state current."

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

### Round 3: Quality & Testing

**For personal tools or simple CLI/library projects:** Skip this round. Default to Lightweight tier. Tell the user: "Based on the project scope, I'm defaulting to Lightweight testing (smoke tests for critical paths). Let me know if you want more thorough testing."

**For all other projects**, ask:
- How important is reliability?
- Users beyond yourself?
- Testing preference? (or should I recommend?)

Then determine quality tier:

| Signal | Tier | Testing |
|--------|------|---------|
| Personal, simple, solo | **Lightweight** | Smoke tests only |
| Small team, moderate complexity | **Standard** | Unit + integration tests, CI |
| Public-facing, user data, payments | **Rigorous** | Unit + integration + E2E + security scanning |
| Safety-critical, compliance | **Comprehensive** | All above + load testing + audit logging |

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
3. Populate `## MVP Goals` in `CLAUDE.md` with Phase 1 deliverables (3-5 testable bullet points)
4. Update `PROGRESS.md` to note that roadmap was created
5. If MCP servers were mentioned, add `**MCP Servers:**` line to Project Identity in `CLAUDE.md`
6. Tell the user: "Your roadmap is ready. Tell me to start Phase 1 when you're ready."

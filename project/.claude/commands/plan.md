# /plan - Strategy Roadmap Creation

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

| Starting Point | Approach |
|---------------|----------|
| A) Rough concept | Full interview (all rounds) plus exploratory questions |
| B) Clear idea | Full interview as written below |
| C) Partial plan | Read shared docs, ask only about gaps |
| D) Detailed plan | Generate roadmap directly, clarify ambiguities only |

---

## Question Flow

Ask questions in grouped rounds, not one at a time. Adapt based on project type.

### Round 1: Core Understanding
- What does this project do? (elevator pitch)
- Who will use it?
- What's the core problem it solves?
- What makes it different from alternatives?

### Round 2: Scope & Technical
- 3-5 must-have features for v1?
- Features that can wait?
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

Fill in `docs/strategy-roadmap.md` based on the user's answers. Expand sections as needed -- the template provides section headers; you generate the content.

### For Each MVP Feature, Include Acceptance Criteria
```markdown
1. [Feature] -- Acceptance: [testable criterion]
```

### For Unknowns, Use TODO Markers
```markdown
<!-- TODO: [What needs deciding] | WHEN: [deadline] | BLOCKS: [what] -->
```

---

## After Generation

1. Write the completed `docs/strategy-roadmap.md`
2. Ask: "Do you prefer **lightweight one-liner ADRs** or **formal ADRs** (Context / Decision / Consequences)?" Record the answer in `DECISIONS.md` as `Format: Lightweight` or `Format: Formal`
3. Populate `## MVP Goals` in `CLAUDE.md` with Phase 1 deliverables (3-5 testable bullet points)
4. Update `PROGRESS.md` to note that strategy roadmap was created
5. If MCP servers were mentioned, add `**MCP Servers:**` line to Project Identity in `CLAUDE.md`
6. Tell the user: "Your roadmap is ready. Tell me to start Phase 1 when you're ready."

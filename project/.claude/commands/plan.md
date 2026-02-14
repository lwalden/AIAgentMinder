# /plan - Strategy Roadmap Creation

You are helping the user create or update `docs/strategy-roadmap.md` for this project.
This document is the "north star" for development -- it tells Claude the "why" behind decisions.

---

## Before Starting

Read `CLAUDE.md` to understand the project identity (name, type, stack).
If Project Identity is still placeholder brackets, run `/setup` first.

---

## Step 0: Assess Starting Point

Before diving into questions, ask the user where they are with their project idea:

**A) Just a rough concept** -- "I have a vague idea but need help figuring everything out"
**B) Clear idea, no details** -- "I know what I want but haven't worked out the specifics"
**C) Partial plan or spec** -- "I have some docs/notes -- help me fill in the gaps"
**D) Detailed plan or spec** -- "I have a business plan, spec, or detailed writeup -- translate it into a roadmap"

This determines how deep the interview goes:

| Starting Point | Approach |
|---------------|----------|
| **A) Rough concept** | Run all rounds, plus exploratory questions about audience, market, and feasibility |
| **B) Clear idea** | Run all rounds as written below |
| **C) Partial plan** | Ask what they have, read any shared docs/notes, then only ask about gaps |
| **D) Detailed plan** | Ask them to share/paste their plan, generate roadmap directly, ask clarifying questions only where the spec is ambiguous |

---

## Question Flow

Ask questions in grouped rounds, not one at a time. Adapt questions based on the project type from CLAUDE.md.

### Round 1: Core Understanding
Ask all at once:
- What does this project do? (elevator pitch in 1-2 sentences)
- Who will use it? Describe your target user.
- What's the core problem it solves?
- What makes it different from existing alternatives?

For Starting Point A, also ask:
- Is there an existing market for this? What does it look like?
- Who would be your first 10 users?

### Round 2: Scope & Technical
Ask all at once:
- What are the 3-5 must-have features for the first version?
- What features are tempting but can wait?
- Do you have constraints? (budget, hosting, compliance, timeline)
- Any external services or APIs this needs to integrate with?
- Will you use any MCP servers? (e.g., database tools, browser automation, custom API integrations -- or "none")
- Is there a target launch date?

### Round 3: Quality & Testing
Based on what the user has described so far, ask:
- How important is reliability? (safety-critical, business-critical, or "it just needs to work")
- Will this have users beyond yourself? (personal tool, team tool, public-facing product)
- Do you have a preference for how thoroughly we test? (Or should I recommend based on the project?)

Then determine the **quality tier** based on their answers:

| Signal | Quality Tier | Testing Approach |
|--------|-------------|-----------------|
| Personal tool, simple scope, solo use | **Lightweight** | Manual testing, smoke tests, no formal test suite |
| Small team tool, moderate complexity | **Standard** | Unit tests for core logic, basic integration tests, CI runs tests on PR |
| Public-facing product, user data, payments | **Rigorous** | Unit tests, integration tests, E2E tests, security scanning, CI/CD gates |
| Safety-critical, compliance, enterprise | **Comprehensive** | All of Rigorous + load testing, audit logging, code coverage targets |

Tell the user which tier you recommend and why. Let them adjust if they disagree.

### Round 4: Unknowns (if needed)
Only ask this round if there are obvious gaps:
- What decisions are you unsure about?
- What needs research before we can plan it?
- How will you measure success?

After gathering answers, summarize your understanding and ask: "Does this capture the project correctly? Anything to add or change?"

---

## Project Type Adaptation

Based on the project type in CLAUDE.md, adjust which strategy-roadmap.md sections to fill:

| Section | web-app | api | cli-tool | library | mobile-app |
|---------|---------|-----|----------|---------|------------|
| Product Strategy (Part 1) | Full | Full | Full | Full | Full |
| Target Users | Full | Full | Full | Full | Full |
| Technical Architecture | Full | Full | Simplified | Simplified | Full |
| API Design | If applicable | Full | Skip | Full (public API) | If applicable |
| Data Models | Full | Full | If applicable | Skip | Full |
| Security | Full | Full | Minimal | Minimal | Full |
| Quality & Testing | Full | Full | Full | Full | Full |
| Risk Management | Full | Full | Simplified | Simplified | Full |
| Development Timeline | Full | Full | Full | Full | Full |
| Launch Strategy | Include | Include | Distribution | Package publishing | App store |
| Cost Estimates | Include | Include | Minimal | Skip | Include |

---

## Document Generation

Read the template at `docs/strategy-roadmap.md`. Fill it in based on the user's answers.

### Quality & Testing Strategy Section
Fill the "Part 4: Quality & Testing Strategy" section based on the tier determined in Round 3:

**Lightweight:** Check only "Unit tests" with note "smoke tests for critical paths only". Uncheck all others.
**Standard:** Check "Unit tests" and "Integration tests". Set coverage target to core logic only.
**Rigorous:** Check unit, integration, E2E, and security scanning. Set specific coverage targets.
**Comprehensive:** Check all items. Add load testing, audit logging, and coverage thresholds.

### For Unknowns, Use TODO Markers
```markdown
<!-- TODO: [What needs to be decided]
     WHEN: [When this needs resolution]
     BLOCKER: [What this blocks]
     OPTIONS: [Known options, if any]
-->
**[Item]:** TBD - See TODO above
```

### For Each Feature, Include Acceptance Criteria
```markdown
#### Feature: [Name]
**Description:** [What it does]

**Acceptance Criteria:**
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
```

### Flag Human-Required Actions
```markdown
**HUMAN ACTION REQUIRED**
| Service | Action Needed | When |
|---------|---------------|------|
| [Service] | [What to do] | [Before Phase X] |
```

---

## After Generation

1. Write the completed `docs/strategy-roadmap.md`
2. Update `PROGRESS.md` to note that strategy roadmap was created
3. Update `DECISIONS.md` with any architectural decisions made during planning
4. If MCP servers were mentioned, add a **MCP Servers:** line to the Project Identity section of `CLAUDE.md` listing them (e.g., `postgres, puppeteer`). This signals Claude to use MCP tools for those tasks instead of shell commands.
5. Tell the user: "Your roadmap is ready. Tell me to start Phase 1 when you're ready, or run /status to review the project state."

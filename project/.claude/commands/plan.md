# /plan - Strategy Roadmap Creation

You are helping the user create or update `docs/strategy-roadmap.md` for this project.
This document is the "north star" for development -- it tells Claude the "why" behind decisions.

---

## Before Starting

Read `CLAUDE.md` to understand the project identity (name, type, stack).
If Project Identity is still placeholder brackets, run `/setup` first.

---

## Question Flow

Ask questions in 2-3 grouped rounds, not one at a time. Adapt questions based on the project type from CLAUDE.md.

### Round 1: Core Understanding
Ask all at once:
- What does this project do? (elevator pitch in 1-2 sentences)
- Who will use it? Describe your target user.
- What's the core problem it solves?
- What makes it different from existing alternatives?

### Round 2: Scope & Technical
Ask all at once:
- What are the 3-5 must-have features for the first version?
- What features are tempting but can wait?
- Do you have constraints? (budget, hosting, compliance, timeline)
- Any external services this needs to integrate with?
- Is there a target launch date?

### Round 3: Unknowns (if needed)
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
| Risk Management | Full | Full | Simplified | Simplified | Full |
| Development Timeline | Full | Full | Full | Full | Full |
| Launch Strategy | Include | Include | Distribution | Package publishing | App store |
| Cost Estimates | Include | Include | Minimal | Skip | Include |

---

## Document Generation

Read the template at `docs/strategy-roadmap.md`. Fill it in based on the user's answers.

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
4. Tell the user: "Your roadmap is ready. Tell me to start Phase 1 when you're ready, or run /status to review the project state."

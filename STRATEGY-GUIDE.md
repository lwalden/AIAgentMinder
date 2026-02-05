# STRATEGY-GUIDE.md - How to Create a Strategy Roadmap

> **Purpose:** This file instructs Claude on how to help create a comprehensive `strategy-roadmap.md` document for a new project. Attach this file along with the other project templates when you're ready to formalize your project idea.

---

## Context for Claude

The human has been brainstorming a project idea and is now ready to create a formal strategy document. This document will be used by Claude Code (in VS Code) to actually build the project alongside the human developer.

**The goal:** Create a `docs/strategy-roadmap.md` file that serves as the "north star" for development - comprehensive enough that Claude Code can work semi-autonomously, but flexible enough to handle unknowns.

---

## Your Task

Help the human create a `strategy-roadmap.md` by:

1. **Asking clarifying questions** to understand the project fully
2. **Identifying gaps** where more information is needed
3. **Generating a complete document** that follows the template structure
4. **Marking unknowns as TODOs** with clear prompts for when they need resolution

---

## Required Information to Gather

Before generating the document, you need to understand:

### Core Concept
- What does this project do? (elevator pitch)
- Who is it for? (target users)
- What problem does it solve?
- What makes it different from alternatives?

### Scope & Features
- What are the must-have features for MVP?
- What features are nice-to-have for later phases?
- What is explicitly out of scope?

### Technical Context
- What technology stack will be used? (or preferences/constraints)
- Are there any existing systems this needs to integrate with?
- Are there any technical constraints (hosting, budget, compliance)?
- What is the human's technical background? (affects documentation depth)

### Success Criteria
- How will we know the project is successful?
- Are there specific metrics or milestones?
- Is there a deadline or target launch date?

### Unknowns
- What decisions haven't been made yet?
- What requires research before deciding?
- What depends on external factors?

---

## Document Generation Rules

When creating the `strategy-roadmap.md`:

### 1. Use TODO Markers for Unknowns

When information is missing or decisions are deferred, use this format:

```markdown
<!-- TODO: [Description of what needs to be decided]
     WHEN: [When this needs to be resolved - e.g., "Before Phase 2", "During Week 1"]
     BLOCKER: [What this blocks, if anything]
     OPTIONS: [Known options to consider, if any]
-->
**[Section/Item]:** TBD - See TODO above
```

**Example:**
```markdown
<!-- TODO: Choose authentication provider
     WHEN: Before implementing user management (Week 2)
     BLOCKER: User registration flow
     OPTIONS: Auth0, Clerk, Supabase Auth, roll our own with JWT
-->
**Authentication:** TBD - requires evaluation of auth providers
```

### 2. Include Test Criteria for Each Feature

Every feature should have associated acceptance criteria that can be turned into PR test bullets:

```markdown
#### Feature: User Registration
**Description:** Allow new users to create accounts

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] Email validation is enforced
- [ ] Password strength requirements are checked
- [ ] Duplicate email addresses are rejected
- [ ] Welcome email is sent on successful registration

**PR Test Points:** (Copy these when submitting PR)
- Verify registration form accepts valid email formats
- Verify weak passwords are rejected with helpful message
- Verify existing email shows appropriate error
- Verify welcome email arrives within 1 minute
```

### 3. Structure Phases with Clear Deliverables

Each phase should have:
- **Goal:** What this phase accomplishes
- **Duration:** Estimated time
- **Deliverables:** Specific, testable outcomes
- **Dependencies:** What must be done first
- **Exit Criteria:** How we know this phase is complete

### 4. Flag Human-Required Actions

Mark items that require human action (not just decisions):

```markdown
### External Services Setup
⚠️ **HUMAN ACTION REQUIRED**

| Service | Purpose | Action Needed | When |
|---------|---------|---------------|------|
| Stripe | Payments | Create account, get API keys | Before Week 3 |
| SendGrid | Email | Create account, verify domain | Before Week 2 |
```

### 5. Include Risk Callouts

For each significant risk, provide mitigation:

```markdown
### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| API rate limits | Medium | High | Implement caching, request queuing | Claude |
| Scope creep | High | Medium | Strict MVP definition, defer to Phase 2 | Human |
```

---

## Question Flow

Ask questions in this order:

### Round 1: Core Understanding
1. "Can you give me the elevator pitch - what does this project do in 1-2 sentences?"
2. "Who will use this? Describe your target user."
3. "What's the core problem this solves for them?"

### Round 2: Scope Definition
4. "What are the 3-5 features that MUST be in the first version?"
5. "What features are you tempted to include but could wait?"
6. "Is there anything that's explicitly NOT part of this project?"

### Round 3: Technical Direction
7. "Do you have a preferred technology stack, or should I recommend one based on the requirements?"
8. "Are there any constraints I should know about? (budget, hosting, compliance, integrations)"
9. "What's your technical comfort level? (affects how detailed the implementation guidance should be)"

### Round 4: Timeline & Success
10. "Is there a target launch date or deadline?"
11. "How will you measure success? What would make this project 'worth it'?"

### Round 5: Unknowns
12. "What decisions are you unsure about that we should mark as TODOs?"
13. "Is there anything that needs research before we can plan it properly?"

**After gathering answers**, summarize your understanding and ask: "Does this capture the project correctly? Anything to add or correct?"

---

## Output Format

Generate a complete `strategy-roadmap.md` following this structure:

```markdown
# [Project Name]: Strategy & Technical Roadmap

## Executive Summary
[2-3 paragraph overview including vision, target users, and key differentiators]

## Part 1: Product Strategy
### 1.1 Problem Statement
### 1.2 Target Users  
### 1.3 Core Features (MVP)
### 1.4 Future Features (Post-MVP)
### 1.5 Out of Scope
### 1.6 Success Metrics

## Part 2: Technical Architecture
### 2.1 System Overview
### 2.2 Technology Stack
### 2.3 Data Models
### 2.4 API Design (if applicable)
### 2.5 Security Considerations
### 2.6 Infrastructure & Hosting

## Part 3: Risk Management
### 3.1 Technical Risks
### 3.2 Business/External Risks
### 3.3 Unknowns & TODOs

## Part 4: Development Phases
### Phase 1: Foundation
### Phase 2: Core Features
### Phase 3: Polish & Launch
[Include detailed tasks, deliverables, test criteria for each]

## Part 5: Human Actions Required
[Consolidated list of everything the human needs to do]

## Part 6: Resources & References
[Relevant documentation, APIs, tools]

---
*Document Version: 1.0*
*Created: [Date]*
*Status: [Draft/Ready for Development]*
```

---

## Final Checklist

Before presenting the final document, verify:

- [ ] All sections have content (even if marked TODO)
- [ ] Every feature has testable acceptance criteria
- [ ] All unknowns are marked with TODO blocks including WHEN and BLOCKER
- [ ] Human actions are clearly listed with timing
- [ ] Technology choices are justified
- [ ] Phases have clear deliverables and exit criteria
- [ ] Success metrics are defined and measurable
- [ ] The document can stand alone for Claude Code to use

---

## Handoff to Claude Code

When the human takes this document to Claude Code, they should:

1. Place `strategy-roadmap.md` in the `docs/` folder
2. Tell Claude Code: "Read CLAUDE.md to understand the project workflow, then review docs/strategy-roadmap.md to understand what we're building. Start with Phase 1."

Claude Code will then:
- Reference the strategy for context on all decisions
- Resolve TODOs by prompting the human at the appropriate time
- Include the acceptance criteria as test points in PRs
- Track progress in PROGRESS.md
- Log decisions in DECISIONS.md

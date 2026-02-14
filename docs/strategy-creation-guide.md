# Strategy Roadmap Creation Guide

## The Quick Way: Use `/plan`

Open Claude Code in your project and run `/plan`. Claude will interview you about your project and generate `docs/strategy-roadmap.md` interactively. This is the recommended approach.

### What `/plan` Looks Like

Here's a typical interaction:

```
You:  /plan
Claude: Before we start, where are you with your project idea?
        A) Just a rough concept
        B) Clear idea, no details
        C) Partial plan or spec
        D) Detailed plan or spec

You:  B -- I want to build a recipe sharing app

Claude: Great! Let me ask a few questions to understand the full picture.

        Round 1 -- Core Understanding:
        1. What does this app do? (elevator pitch)
        2. Who will use it?
        3. What problem does it solve?
        4. What makes it different from existing recipe sites?

You:  [answers]

Claude: Round 2 -- Scope & Technical:
        1. What are the 3-5 must-have features for v1?
        2. Any features that can wait?
        ...

You:  [answers]

Claude: Round 3 -- Quality & Testing:
        Based on what you've described (public-facing, user accounts, image uploads),
        I'd recommend the **Rigorous** quality tier:
        - Unit tests for core logic
        - Integration tests for API endpoints
        - E2E tests for key user flows
        - Security scanning in CI
        Does that sound right?

You:  Yes, that works.

Claude: Here's my understanding of the project: [summary]
        Does this capture everything? Anything to add or change?

You:  Looks good!

Claude: Writing docs/strategy-roadmap.md...
        Your roadmap is ready. Tell me to start Phase 1 when you're ready.
```

## The Manual Way

If you prefer to fill out `docs/strategy-roadmap.md` yourself, here's guidance on each section.

### Executive Summary
Write 2-3 sentences about what the project does, who it's for, and what makes it different. Include 2-3 measurable success criteria.

### Part 1: Product Strategy
- **Problem Statement:** What specific problem does this solve? Who has it? What do they currently do about it?
- **Target Users:** Describe 1-2 user personas. Who are they, what do they need?
- **Features:** List MVP features with testable acceptance criteria. Be explicit about what's in scope and out of scope.

### Part 2: Technical Architecture
- **Technology Choices:** List each component (backend, database, frontend, hosting) with the rationale for the choice.
- **Data Models:** Sketch out your core entities and relationships.
- **API Design:** If applicable, outline key endpoints.
- **Security:** Note authentication method, authorization model, and data protection approach.
- **MCP Servers:** If applicable, list any MCP servers and what they're used for.

### Part 3: Risk Management
Identify 3-5 risks with likelihood, impact, and mitigation strategy.

### Part 4: Quality & Testing Strategy
Choose a quality tier that matches your project's needs:

| Quality Tier | When to Use | What It Means |
|-------------|-------------|---------------|
| **Lightweight** | Personal tools, prototypes, solo use | Manual testing, smoke tests, no formal test suite |
| **Standard** | Team tools, moderate complexity | Unit tests for core logic, basic integration tests, CI runs tests on PR |
| **Rigorous** | Public products, user data, payments | Unit + integration + E2E tests, security scanning, CI/CD gates |
| **Comprehensive** | Safety-critical, compliance, enterprise | All of Rigorous + load testing, audit logging, code coverage targets |

The `/plan` command will recommend a tier based on your answers. You can always adjust it -- the goal is that lightweight projects stay lightweight and rigorous projects get the support they need.

### Part 5: Development Timeline
Break work into phases with weekly deliverables. Phase 1 should be the minimum viable product. Do NOT schedule CI/CD setup in Phase 1 -- generate it on-demand when the project has real code.

### Part 6: Human Actions Required
List everything the human needs to do (service signups, API keys, decisions) with timing.

---

## Handling Unknowns

It's fine to not have all the answers. Mark unknowns with TODO blocks:

```markdown
<!-- TODO: Choose authentication provider
     WHEN: Before implementing user management (Week 2)
     BLOCKER: User registration flow
     OPTIONS: Auth0, Clerk, Supabase Auth, custom JWT
-->
**Authentication:** TBD - requires evaluation of auth providers
```

Claude Code will prompt you to resolve TODOs at the appropriate time during development.

---

## Tips for Good Strategy Documents

1. **Include testable acceptance criteria** for every feature -- Claude uses these as PR test points
2. **Flag human-required actions** with timing -- so you know what you need to do and when
3. **Be explicit about out-of-scope items** -- prevents scope creep
4. **Justify technology choices** -- helps Claude make consistent architectural decisions
5. **Start with what you know** -- you can always update the document as you learn more

---

## After Creating Your Roadmap

Place the completed `strategy-roadmap.md` in `docs/` and open your project in Claude Code. Tell Claude:
"Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."

Claude will reference the strategy for context on all decisions, resolve TODOs by prompting you at the right time, and track progress in PROGRESS.md.

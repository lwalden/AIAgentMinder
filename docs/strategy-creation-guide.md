# Strategy Roadmap Creation Guide

## The Quick Way: Use `/plan`

Open Claude Code in your project and run `/plan`. Claude interviews you and generates `docs/strategy-roadmap.md`. This is the recommended approach.

### What It Looks Like

```
You:  /plan
Claude: Where are you with your project idea?
        A) Rough concept  B) Clear idea  C) Partial plan  D) Detailed plan

You:  B -- I want to build a recipe sharing app

Claude: Round 1 -- Core Understanding:
        1. What does this app do?
        2. Who will use it?
        3. What problem does it solve?
        4. What makes it different?

You:  [answers]

Claude: Round 2 -- Scope & Technical: ...

Claude: Based on project scope (public-facing, user accounts), I recommend
        Rigorous testing tier. Does that sound right?

You:  Yes

Claude: Writing docs/strategy-roadmap.md...
        Your roadmap is ready. Tell me to start Phase 1 when you're ready.
```

## The Manual Way

If you prefer to fill out `docs/strategy-roadmap.md` yourself:

- **Executive Summary:** 2-3 sentences: what, who, why. Measurable success criteria.
- **Product Strategy:** Problem, target users, MVP features with acceptance criteria, out of scope.
- **Technical Architecture:** Technology choices with rationale, security approach.
- **Quality & Testing:** Choose a tier (Lightweight / Standard / Rigorous / Comprehensive).
- **Timeline:** Phases with deliverables. Phase 1 = MVP.
- **Human Actions:** Service signups, API keys, decisions with timing.

## Quality Tiers

| Tier | When to Use | What It Means |
|------|-------------|---------------|
| **Lightweight** | Personal tools, prototypes | Smoke tests only |
| **Standard** | Team tools, moderate complexity | Unit + integration tests, CI |
| **Rigorous** | Public products, user data | Unit + integration + E2E + security scanning |
| **Comprehensive** | Safety-critical, compliance | All above + load testing + audit logging |

## Handling Unknowns

Mark unknowns with TODO blocks:
```markdown
<!-- TODO: Choose auth provider | WHEN: Before Week 2 | BLOCKS: User registration -->
```
Claude will prompt you to resolve these during development.

## After Creating Your Roadmap

Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."

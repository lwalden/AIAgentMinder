# Product Brief Creation Guide

## The Quick Way: Use `/plan`

Open Claude Code in your project and run `/plan`. Claude interviews you and generates `docs/strategy-roadmap.md`. This is the recommended approach. See [examples/demo-transcript.md](../examples/demo-transcript.md) for a full walkthrough.

## The Manual Way

If you prefer to fill out `docs/strategy-roadmap.md` yourself:

- **What & Why:** Problem, vision, target users.
- **MVP Features:** 3-5 features with testable acceptance criteria.
- **Technical Stack:** Choices with rationale.
- **Quality Tier:** Lightweight / Standard / Rigorous / Comprehensive.
- **Phases:** Phase 1 = MVP. Future phases as focus areas.
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

## After Creating Your Brief

Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."

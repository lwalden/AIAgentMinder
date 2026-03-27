# Product Brief Creation Guide

## The Quick Way: Use `/aam-brief`

Open Claude Code in your project and run `/aam-brief`. Claude interviews you and generates `docs/strategy-roadmap.md`. This is the recommended approach. See [examples/demo-transcript.md](../examples/demo-transcript.md) for a walkthrough.

## The Manual Way

If you prefer to fill out `docs/strategy-roadmap.md` yourself:

- **What & Why:** Problem, vision, target users.
- **MVP Features:** 3-5 features with testable acceptance criteria.
- **Technical Stack:** Choices with rationale.
- **Phases:** Phase 1 = MVP. Future phases as focus areas.
- **Human Actions:** Service signups, API keys, decisions with timing.

## Handling Unknowns

Mark unknowns with TODO blocks:
```markdown
<!-- TODO: Choose auth provider | WHEN: Before Week 2 | BLOCKS: User registration -->
```
Claude will prompt you to resolve these during development.

## After Creating Your Brief

Tell Claude: "Read CLAUDE.md and docs/strategy-roadmap.md, then start Phase 1."

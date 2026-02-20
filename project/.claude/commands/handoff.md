# /handoff - Session Handoff Brief

Generate a concise handoff briefing so the next Claude session can pick up exactly where this one left off. This is the most important thing you do before ending a session.

---

## Steps

### 1. Assess Current State

Review what happened this session:
- What files were created or modified?
- What was the goal and how far did we get?
- What's working? What's broken?
- Any decisions made that should be in DECISIONS.md?

### 2. Update PROGRESS.md

Rewrite PROGRESS.md (don't append — replace the active content) with:

```markdown
**Phase:** [current phase]
**Last Updated:** [now]

## Active Tasks
- [what's currently in progress, with enough detail that a fresh session understands]

## Current State
- [what's working, what's partially done, what's broken — e.g., "API compiles but auth isn't hooked up"]

## Blockers
- [anything blocking progress — missing API keys, design decisions, bugs]

## Next Priorities
1. [most important next step — be specific, not vague]
2. [second priority]
3. [third priority]

---
<!-- Session notes: keep last 3. Older ones are in git history. -->
- [DATE] Phase [N]: [what was accomplished]. Key files: [files touched]. → [what's next]
```

**Be specific.** "Continue API work" is useless. "Implement the /users/:id endpoint — GET handler is done, need POST and validation" is useful.

### 2b. Self-Check: Is This Handoff Useful?

Re-read the PROGRESS.md you just wrote. For each item in Active Tasks and Next Priorities, ask:
- Could a fresh Claude session understand this without any other context?
- Is there a specific file, function, or endpoint named?
- Is the current state of that work described (what's done, what's not)?

If any item is vague (e.g., "continue API work", "fix bugs", "finish frontend"), rewrite it with specifics before proceeding.

**Bad:** "Continue work on authentication"
**Good:** "Implement JWT refresh token rotation in src/auth/tokens.ts — access token generation works, refresh endpoint returns 401, need to add token rotation logic and update the middleware in src/middleware/auth.ts"

### 3. Update DECISIONS.md (if applicable)

If any of these happened this session, add an ADR entry:
- Chose a library, framework, or tool
- Designed an API or data contract
- Selected an auth approach
- Changed a data model
- Made a build/deploy decision

Use the format recorded in DECISIONS.md. Always include alternatives considered and the tradeoff accepted — a decision without alternatives is an assertion, not a record.

**Rule of thumb:** If a decision is important enough to survive the 3-note session-note rolling window, it belongs in DECISIONS.md — not just in session notes.

### 4. Commit

```bash
git add PROGRESS.md DECISIONS.md
git commit -m "handoff: session checkpoint [today's date]"
```

### 5. Print the Briefing

Print a summary the user can glance at:

```
Session handoff complete.

This session:
- [what was accomplished]

State of things:
- [what's working, what's not]

Next session should:
1. [specific first action]
2. [specific second action]

Blockers for human:
- [anything the human needs to do before next session, or "None"]
```

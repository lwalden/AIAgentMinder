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

## Blockers
- [anything blocking progress — missing API keys, design decisions, bugs]

## Next Priorities
1. [most important next step — be specific, not vague]
2. [second priority]
3. [third priority]

---
<!-- Session notes: keep last 3. Older ones are in git history. -->
- [DATE] [concise summary of this session] → [what's next]
```

**Be specific.** "Continue API work" is useless. "Implement the /users/:id endpoint — GET handler is done, need POST and validation" is useful.

### 3. Update DECISIONS.md (if applicable)

If any of these happened this session, add an ADR entry:
- Chose a library, framework, or tool
- Designed an API or data contract
- Selected an auth approach
- Changed a data model
- Made a build/deploy decision

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

# /aam-handoff - Session Checkpoint

Capture current state so work can be resumed cleanly. Run this before ending a session.

---

## Steps

### 1. Assess Current State

Review what happened this session:

- What files were created or modified?
- What was the goal and how far did we get?
- Any decisions made that should be in DECISIONS.md?
- Is there an active sprint? Check if SPRINT.md contains `**Status:** in-progress`. If so, note which issue was active and the done/in-progress/todo/blocked counts.

### 2. Update DECISIONS.md (if applicable)

If any of these happened this session, add an ADR entry:

- Chose a library, framework, or tool
- Designed an API or data contract
- Selected an auth approach
- Changed a data model
- Made a build/deploy decision
- Implemented a known workaround (also add a row to the `## Known Debt` section)

Use the format already established in DECISIONS.md. Always include alternatives considered and the tradeoff accepted — a decision without alternatives is an assertion, not a record.

### 3. Write 2-3 Priority Items to Auto-Memory

Locate the project's auto-memory file at:
`~/.claude/projects/[project-path-hash]/memory/MEMORY.md`

Append or update a "Next Session" section:

```markdown
## Next Session
- [Most important thing to know picking up next — be specific, not vague]
- [Second priority or open question]
- [Third item only if genuinely needed]
```

Keep each bullet to one sentence. Do not exceed 3 items. Specificity matters: "Continue API work" is not useful; "Implement POST /users/:id — GET is done, need POST with request validation" is.

### 4. Commit

```bash
git add DECISIONS.md
git commit -m "handoff: session checkpoint [today's date]"
```

Only stage files that were modified. Do NOT modify SPRINT.md during handoff — sprint state is updated during sprint execution.

### 5. Print the Briefing

```
Session handoff complete.

This session:
- [what was accomplished — specific files/features/fixes]

State of things:
- [what's working, what's not, what's in progress]
[if sprint active:]
Sprint [n]: [done]/[total] issues done[, [blocked] blocked]
Currently on: S[n]-[seq] — [issue title]

Next session should:
1. [specific first action]
2. [specific second action]

Blockers for human:
- [anything requiring human action, or "None"]
```

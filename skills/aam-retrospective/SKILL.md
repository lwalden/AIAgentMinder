---
name: aam-retrospective
description: Generate a sprint retrospective with metrics — planned vs completed issues, scope changes, blocked issues, decisions logged, and adaptive sprint sizing guidance. Called automatically at sprint completion; also invocable manually.
user-invocable: true
allowed-tools: Read, Bash, Glob
---

# /aam-retrospective - Sprint Retrospective

Generate a brief retrospective for the completed sprint. Called automatically at sprint completion, or invoke manually with `/aam-retrospective`.

---

## Step 1: Gather Sprint Data

Read the following:

1. `SPRINT.md` — sprint goal, issue list, final statuses
2. Use TaskList to get final task states and any notes
3. `DECISIONS.md` — identify entries added during this sprint (by date or sprint reference)
4. Recent git log for this sprint's branches:
   ```bash
   git log --oneline --merges --since="sprint start date"
   ```
5. Check for any issues that were added or removed after approval (scope changes)

---

## Step 2: Compute Metrics

From the data gathered, calculate:

| Metric | Value |
|--------|-------|
| **Planned issues** | How many issues were in the approved sprint |
| **Completed issues** | How many reached `done` |
| **Blocked issues** | How many are still `blocked` at sprint end |
| **Scope additions** | Issues added after sprint approval |
| **Scope removals** | Issues removed after sprint approval |
| **Decisions logged** | DECISIONS.md entries added this sprint |

---

## Step 3: Present the Retrospective

```
Sprint S{n} Retrospective
Goal: {sprint goal}
Date: {today}

Delivery:
  Planned:   {n} issues
  Completed: {n} issues  ({%} completion rate)
  Blocked:   {n} issues  [list IDs and blocker reason if any]

Scope:
  {No scope changes} OR {Added: [issue titles] / Removed: [issue titles]}

Decisions:
  {n} decisions logged this sprint
  {list decision topics, one line each — e.g., "Auth approach: JWT over sessions"}

Patterns:
  [One honest observation about what went well — e.g., "All issues completed with no blockers"]
  [One honest observation about what was harder than expected — e.g., "S2-003 took longer due to unexpected API rate limits"]
```

---

## Step 4: Adaptive Sprint Sizing (after 2+ sprints)

If this is Sprint 3 or later, check prior sprint completion rates from git history or SPRINT.md archives.

If there's a pattern (e.g., consistently completing 4–5 of 7 planned issues), note it:

> "Your last {N} sprints completed {avg} issues on average. For the next sprint, consider planning {recommended range} issues rather than the current {planned count}."

Only offer this observation if there is a clear pattern (2+ consecutive sprints with the same completion band). Do not speculate on a single data point.

---

## Integration

This command is called automatically by `sprint-workflow.md` at sprint completion, before the user reviews and archives the sprint. It can also be run manually at any time.

# /aam-retrospective - Sprint Retrospective

Generate a brief retrospective for the completed sprint. Called automatically at sprint completion, or invoke manually with `/aam-retrospective`.

---

## Step 1: Gather Sprint Data

Read the following:

1. `SPRINT.md` — sprint goal, issue list, final statuses (including any risk-tagged issues)
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
| --- | --- |
| **Planned issues** | How many issues were in the approved sprint |
| **Completed issues** | How many reached `done` |
| **Blocked issues** | How many are still `blocked` at sprint end |
| **Risk-tagged issues** | How many had `[risk]` tag; how many triggered `/aam-self-review` |
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
  Planned:    {n} issues
  Completed:  {n} issues  ({%} completion rate)
  Blocked:    {n} issues  [list IDs and blocker reason if any]
  Risk-tagged: {n} issues  [list which ones, note if self-review found issues]

Scope:
  {No scope changes} OR {Added: [issue titles] / Removed: [issue titles]}

Decisions:
  {n} decisions logged this sprint
  {list decision topics, one line each — e.g., "Auth approach: JWT over sessions"}

Patterns:
  [One honest observation about what went well]
  [One honest observation about what was harder than expected]
```

---

## Step 4: Adaptive Sprint Sizing

Read prior archived sprint lines from `SPRINT.md` (lines starting with `S{n} archived`).

From each archived line, extract the velocity percentage (the `{velocity}%` value in the archive format).

**Recommendation logic:**

- **Sprint 1 or 2 (insufficient data):** "Not enough sprint history for sizing recommendations yet."
- **Sprint 3+:** Compute the median completion rate across available archived sprints.
  - Median ≥ 90%: "You're completing nearly everything planned. Consider planning {planned + 1} to {planned + 2} issues next sprint."
  - Median 70–89%: "Completion rate is healthy. Current sprint size of ~{planned} issues looks right."
  - Median 50–69%: "Consistently completing about {median%} of planned work. Consider planning {recommended range} issues rather than {planned}."
  - Median < 50%: "Sprint scope is regularly exceeding capacity. Recommend planning {recommended_max} issues or fewer next sprint."

Write the recommendation as the `<!-- sizing: {min}-{max} -->` comment in the SPRINT.md archive line (see sprint-workflow.md Sprint Completion). This comment persists for the next sprint planning step to read.

Only surface this when there is a pattern (2+ sprints in the same completion band). Do not speculate on a single data point.

---

## Integration

This command is called automatically by `sprint-workflow.md` at sprint completion, before the user reviews and archives the sprint. It can also be run manually at any time.

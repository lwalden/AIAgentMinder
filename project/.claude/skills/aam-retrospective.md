---
description: Sprint retrospective with metrics and adaptive sizing
user-invocable: true
effort: medium
---

# /aam-retrospective - Sprint Retrospective

Generate a brief retrospective for the completed sprint. Called automatically at sprint completion, or invoke manually with `/aam-retrospective`.

---

## Step 1: Gather Sprint Data

Read the following:

1. `.sprint-metrics.json` — if present, use as primary metrics source (timestamps, cycle counts, rework). Fall back to git log parsing when the metrics file is absent (backward compatible with sprints that ran before metrics collection was added).
2. `SPRINT.md` — sprint goal, issue list, final statuses (including Post-Merge column)
3. Use TaskList to get final task states and any notes
4. `DECISIONS.md` — identify entries added during this sprint (by date or sprint reference)
5. Recent git log for this sprint's branches:
   ```bash
   git log --oneline --merges --since="sprint start date"
   ```
6. Check for any issues that were added or removed after approval (scope changes)

---

## Step 2: Compute Metrics

From the data gathered, calculate:

| Metric | Value |
| --- | --- |
| **Planned issues** | How many issues were in the approved sprint |
| **Completed issues** | How many reached `done` |
| **Rework items** | How many items required rework (post-merge validation failures or test failures after initial "done") |
| **Blocked issues** | How many are still `blocked` at sprint end |
| **Post-merge validations** | How many items had post-merge validation tasks; how many passed vs. failed |
| **Risk-tagged issues** | How many had `[risk]` tag |
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
  Rework:     {n} items   [list IDs and failure description if any]
  Blocked:    {n} issues  [list IDs and blocker reason if any]

Quality:
  Post-merge validations: {n} defined, {n} passed, {n} failed
  {If rework items exist: "Rework was needed for: [list items and root cause]"}

Scope:
  {No scope changes} OR {Added: [issue titles] / Removed: [issue titles]}

Decisions:
  {n} decisions logged this sprint
  {list decision topics, one line each — e.g., "Auth approach: JWT over sessions"}

Patterns:
  [One honest observation about what went well]
  [One honest observation about what was harder than expected — e.g., "S2-003 required rework due to staging env mismatch"]
```

---

## Step 4: Adaptive Sprint Sizing

Read prior archived sprint lines from `SPRINT.md` (lines starting with `S{n} archived`).

From each archived line and from the current sprint's metrics (Step 2), identify **stress indicators**:
- **Scope churn**: any scope additions or removals occurred during the sprint
- **Blocked issues**: any issues ended the sprint in `blocked` status
- **Rework items**: any items required rework (post-merge validation failures). Each rework item counts as a stress indicator.
- **Context pressure**: the sprint had 7+ planned issues

**Recommendation logic:**

- **Sprint 1 (no history):** "First sprint — recommend 4–5 issues next sprint to establish a baseline. Fit whole features; avoid splitting a feature across sprints when it can fit in one."
- **Sprint 2+:** Start from the previous sprint's planned issue count (or 5 if unavailable). Apply adjustments:
  - No stress indicators in the most recent sprint: hold steady. Do not increase.
  - 1 stress indicator in the most recent sprint: reduce max by 1.
  - 2+ stress indicators in the most recent sprint: reduce both min and max by 1.
  - Stress indicators present in 2+ of the last 3 sprints: reduce both min and max by 1 (cumulative with above).
  - Rework items in the most recent sprint: each rework item counts as a stress indicator.

**Hard boundaries:** The recommendation must fall within 3–7 issues. Clamp to this range after all adjustments. Never recommend more than 7 regardless of history.

**Feature coherence:** Always append: "Prefer fitting whole features over hitting an issue count. If a feature needs more issues than the range, plan the feature — but confirm with the user that context will stay manageable."

Write the recommendation as the `<!-- sizing: {min}-{max} -->` comment in the SPRINT.md archive line (see sprint-workflow.md Sprint Completion). This comment persists for the next sprint planning step to read.

---

## Integration

This command is called automatically by `sprint-workflow.md` at sprint completion, before the user reviews and archives the sprint. It can also be run manually at any time.

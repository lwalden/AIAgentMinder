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
| **Rework items** | How many items required rework (post-merge validation failures or test failures after initial "done") |
| **Blocked issues** | How many are still `blocked` at sprint end |
| **Post-merge validations** | How many items had post-merge validation tasks; how many passed vs. failed |
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
  Rework:    {n} items   [list IDs and failure description if any]
  Blocked:   {n} issues  [list IDs and blocker reason if any]

Quality:
  Post-merge validations: {n} defined, {n} passed, {n} failed
  {If rework items exist: "Rework was needed for: [list items and root cause]"}

Scope:
  {No scope changes} OR {Added: [issue titles] / Removed: [issue titles]}

Decisions:
  {n} decisions logged this sprint
  {list decision topics, one line each — e.g., "Auth approach: JWT over sessions"}

Patterns:
  [One honest observation about what went well — e.g., "All issues completed with no blockers"]
  [One honest observation about what was harder than expected — e.g., "S2-003 required rework due to staging env mismatch"]
```

---

## Step 4: Adaptive Sprint Sizing

Check prior archived sprint lines from `SPRINT.md` and the current sprint's metrics (Step 2).

Identify **stress indicators** from each sprint: scope churn (additions or removals), blocked issues, rework items (post-merge failures), or context pressure (7+ planned issues).

**Sizing logic:**
- **Sprint 1:** Recommend 4–5 issues to establish a baseline.
- **Sprint 2+:** Start from the previous sprint's planned count (or 5). Hold steady if no stress indicators. Reduce by 1 for each: stress in the most recent sprint, repeated stress across 2+ of the last 3 sprints, and rework items in the most recent sprint (each rework item counts as a stress indicator).
- **Hard boundaries:** Always 3–7. Never recommend more than 7. Never fewer than 3.

If stress indicators are present, explain which ones drove the recommendation:

> "Last sprint had scope changes mid-sprint and 1 blocked issue. Recommend {min}–{max} issues next sprint (reduced from {previous planned count})."

Always note: prefer fitting whole features over hitting an exact count. If a feature needs more issues than the range suggests, plan the feature — but confirm context will stay manageable.

---

## Integration

This command is called automatically by `sprint-workflow.md` at sprint completion, before the user reviews and archives the sprint. It can also be run manually at any time.

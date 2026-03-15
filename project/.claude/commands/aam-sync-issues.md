# /aam-sync-issues - Sync Sprint Issues to GitHub

Push the current sprint's issues to GitHub Issues for visibility outside Claude Code.

Run this after sprint planning is approved, or at any point to bring GitHub Issues in sync with the current sprint state.

---

## Prerequisites

- A GitHub remote must be configured (`git remote -v` shows an `origin` pointing to a GitHub repo)
- `gh` CLI must be installed and authenticated (`gh auth status`)
- An active sprint must exist in `SPRINT.md` (`**Status:** in-progress` or `proposed`)

---

## Step 1: Validate Prerequisites

```bash
git remote -v
gh auth status
```

- If no GitHub remote: stop. "No GitHub remote found. Add one with `git remote add origin <url>` first."
- If `gh` not authenticated: stop. "GitHub CLI not authenticated. Run `gh auth login` first."
- If no SPRINT.md or no active sprint: stop. "No active sprint found. Run a sprint first, then sync."

---

## Step 2: Read Current Sprint

Read `SPRINT.md`. Extract:
- Sprint number (e.g., `S1`)
- Sprint goal
- Each issue: ID, title, type, risk flag, status

---

## Step 3: Check Existing GitHub Issues

```bash
gh issue list --label "aiagentminder" --json number,title,state,labels --limit 100
```

Build a map of existing issues by their sprint ID label (e.g., label `S1-001`).

---

## Step 4: Create or Update Issues

For each sprint issue:

**If no matching GitHub issue exists** (no issue with label matching the sprint issue ID):

```bash
gh issue create \
  --title "[S{n}-{seq}] {title}" \
  --body "{body}" \
  --label "aiagentminder,sprint-S{n},{type}" \
  [--label "risk" if risk-tagged]
```

Body format:
```
**Sprint:** S{n} — {sprint goal}
**Type:** {feature | fix | chore | spike}
**Status:** {todo | in-progress | done | blocked}

{acceptance criteria if available from sprint planning}
```

**If a matching GitHub issue exists:**
- If sprint status is `done` and GitHub issue is open: close it.
  ```bash
  gh issue close {number} --comment "Completed in sprint S{n}."
  ```
- If sprint status is `blocked` and GitHub issue is open: add a comment.
  ```bash
  gh issue comment {number} --body "⚠ Blocked: {blocked reason if known}"
  ```
- If sprint status changed but issue is already in the right state: skip.

**Labels used:**
- `aiagentminder` — marks all AIAgentMinder-managed issues
- `sprint-S{n}` — identifies the sprint (e.g., `sprint-S1`)
- `{type}` — `feature`, `fix`, `chore`, or `spike`
- `risk` — for risk-tagged issues

Create labels that don't exist yet:
```bash
gh label create "aiagentminder" --color "0075ca" --description "AIAgentMinder sprint issue" 2>/dev/null || true
gh label create "sprint-S{n}" --color "e4e669" --description "Sprint S{n}" 2>/dev/null || true
```

---

## Step 5: Print Summary

```
GitHub Issues synced — Sprint S{n}

Created:
- #{number}: [S{n}-{seq}] {title}
- [repeat]

Updated:
- #{number}: [S{n}-{seq}] {title} — closed (done)
- #{number}: [S{n}-{seq}] {title} — commented (blocked)

Skipped (no change):
- {count} issue(s) already in sync

View sprint issues: gh issue list --label "sprint-S{n}"
```

If nothing changed: "All {count} sprint issues are already in sync with GitHub."

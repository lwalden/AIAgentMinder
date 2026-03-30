---
description: Capture, review, and promote backlog items
user-invocable: true
effort: low
---

# /aam-backlog - Backlog Management

Capture future work items quickly, review the backlog, or promote items to the roadmap.
All file I/O goes through `backlog-capture.sh` — never read or edit BACKLOG.md directly.

---

## Determine the Mode

The user's input will indicate one of three modes:

### A) Capture (default)

The user wants to record a future work item. Parse their intent into:
- **type**: `defect`, `feature`, `spike`, or `chore`
- **title**: one-line summary
- **source**: where the idea came from (default: `session`)

Then run:
```bash
bash .claude/scripts/backlog-capture.sh add <type> "<title>" "<source>"
```

If the type is ambiguous, pick the best match — don't ask. Use these heuristics:
- Bug, broken, error, regression → `defect`
- Investigate, evaluate, research, explore → `spike`
- Add, build, support, enable → `feature`
- Clean up, update, migrate, rename → `chore`

If the user provides multiple items at once, run `add` for each one.

Optionally, if the user provided context beyond a title, also run:
```bash
bash .claude/scripts/backlog-capture.sh detail <id> "<context>"
```

Report the assigned ID(s) back to the user.

### B) Review

The user wants to see and assess the current backlog. Run:
```bash
bash .claude/scripts/backlog-capture.sh list
bash .claude/scripts/backlog-capture.sh count
```

Present the items grouped by type. For each item older than 30 days (compare the Added date to today), flag it as stale.

Suggest promotions: items that align with the current roadmap phase or upcoming sprint work are good candidates. Items that have been stale for 60+ days should be considered for dropping.

### C) Promote

The user wants to move a backlog item to the roadmap or into a sprint. Run:
```bash
bash .claude/scripts/backlog-capture.sh promote <id>
```

The script outputs the removed row. Use the row data to:
1. If promoting to roadmap: apply `/aam-revise` mechanics to add the item to the appropriate phase in `docs/strategy-roadmap.md`.
2. If pulling into the active sprint: add a row to SPRINT.md (with user confirmation, per scope-guardian rules).

---

## Examples

> "Add to the backlog: investigate whether hooks can replace the debug-checkpoint rule"

→ Mode A. Run: `bash .claude/scripts/backlog-capture.sh add spike "Investigate whether hooks can replace debug-checkpoint rule" "session"`

> "Review the backlog"

→ Mode B. List all items, group by type, flag stale items.

> "Promote B-003 to the roadmap for v5.0"

→ Mode C. Run promote, then apply `/aam-revise` to add to the v5.0 section.

> "I noticed the error message when config is missing is unclear, and also we should add monorepo detection"

→ Mode A, two items. Run add twice:
```bash
bash .claude/scripts/backlog-capture.sh add defect "Unclear error message when config is missing" "session"
bash .claude/scripts/backlog-capture.sh add feature "Add monorepo detection" "session"
```

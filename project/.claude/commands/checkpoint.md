# /checkpoint - Session End Protocol

Perform end-of-session housekeeping. Run this before ending a work session.

---

## Steps

### 1. Update PROGRESS.md

- Move any newly completed tasks from "Active Tasks" to a session summary entry
- Add any new blockers to "Blocked / Awaiting Human"
- Write "Next Session Should" priorities based on what makes sense after this session's work
- Add a session summary entry:
  ```markdown
  ### Session: [today's date]
  **Focus:** [what was worked on]
  **Outcome:** [brief result]
  - [key action taken]
  - [key action taken]
  ```

### 2. Update DECISIONS.md (if applicable)

If any architectural or design decisions were made this session, add ADR entries.
Only log significant decisions -- not every small implementation choice.

### 3. Check PROGRESS.md Size

If PROGRESS.md now exceeds 100 lines, suggest running `/archive` before committing.

### 4. Commit Tracking Changes

```bash
git add PROGRESS.md DECISIONS.md
git commit -m "chore: session checkpoint [today's date]"
```

### 5. Print Summary

```
Session checkpoint complete.

Completed this session:
- [task 1]
- [task 2]

Next session should:
1. [priority 1]
2. [priority 2]

[If applicable: "Note: PROGRESS.md is [X] lines. Consider running /archive."]
```

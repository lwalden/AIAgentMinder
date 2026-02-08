# /checkpoint - Session End Protocol

Perform end-of-session housekeeping. Run this before ending a work session.

---

## Steps

### 1. Update PROGRESS.md

- Update "Active Tasks" with completed work (move to done status or remove)
- Update "Blockers" if any issues arose
- Update "Next Priorities" based on what comes next
- Add a brief session note at the bottom (keep last 3 sessions only):
  ```markdown
  - [DATE] [what was accomplished] → [what's next]
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

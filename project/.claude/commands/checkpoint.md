# /checkpoint - Session End Protocol

Perform end-of-session housekeeping. Run this before ending a work session.

---

## Steps

### 1. Update PROGRESS.md

- Update "Active Tasks" with completed work (move to done or remove)
- Update "Blockers" if any issues arose
- Update "Next Priorities" based on what comes next
- Add a brief session note at the bottom (keep last 3 sessions only):
  ```markdown
  - [DATE] [what was accomplished] → [what's next]
  ```

### 2. Update DECISIONS.md (if applicable)

Did this session include any of these?
- Choosing a library or framework
- Designing an API or data contract
- Selecting an auth approach
- Changing a data model
- Making a build/deploy decision

If yes, add an ADR entry using the format recorded in DECISIONS.md.

### 3. Commit Tracking Changes

```bash
git add PROGRESS.md DECISIONS.md
git commit -m "chore: session checkpoint [today's date]"
```

### 4. Print Summary

```
Session checkpoint complete.

Completed this session:
- [task 1]
- [task 2]

Next session should:
1. [priority 1]
2. [priority 2]
```

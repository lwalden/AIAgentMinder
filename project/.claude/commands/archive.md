# /archive - Archive Old Progress Entries

Clean up PROGRESS.md by moving old session summaries and completed work to an archive file.
This keeps the active file under the ~80 line target for context efficiency.

---

## Steps

### 1. Create Archive Directory
```bash
mkdir -p docs/archive
```

### 2. Archive Old Session Summaries

Read PROGRESS.md. Keep only the **3 most recent** session summaries in the file.
Move all older session summaries to `docs/archive/progress-archive.md`:

- If the archive file exists, prepend the old entries at the top (newest archived first)
- If it doesn't exist, create it with a header:
  ```markdown
  # Progress Archive

  > Archived session summaries from PROGRESS.md.
  > Newest entries at top.

  ---
  ```
- Then append the old session entries

### 3. Archive Completed Tasks

If there are completed tasks in the active section that are from a previous phase, move them to the archive as well.

### 4. Archive Superseded Decisions (if requested)

Check DECISIONS.md for any ADRs with status "Superseded." If found:
- Move them to `docs/archive/decisions-archive.md`
- Leave a reference in DECISIONS.md: `Moved to docs/archive/decisions-archive.md`

### 5. Verify Size

After archiving, PROGRESS.md should be under 80 lines.
If it's still over 80, identify what else can be trimmed or archived.

### 6. Commit

```bash
git add PROGRESS.md DECISIONS.md docs/archive/
git commit -m "chore: archive old progress and decision entries"
```

### 7. Report

```
Archive complete.
- Moved [N] session summaries to docs/archive/progress-archive.md
- [If applicable: Moved [N] superseded decisions to docs/archive/decisions-archive.md]
- PROGRESS.md is now [X] lines
```

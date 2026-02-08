# /archive - Archive Old Progress Entries

Clean up PROGRESS.md by moving old session summaries and completed work to an archive file.
This keeps the active file under the ~80 line target for context efficiency.

---

## Steps

### 1. Create Archive Directory
```bash
mkdir -p docs/archive
```

### 2. Archive Old Session Notes

Read PROGRESS.md. Keep only the **3 most recent session notes** at the bottom.
Move all older notes to `docs/archive/progress-archive.md`:

- If the archive file exists, prepend new entries at the top (newest first)
- If it doesn't exist, create it:
  ```markdown
  # Progress Archive

  > Archived session notes from PROGRESS.md (keep last 3 active).
  > Newest entries at top.

  ---
  ```
- Then append the old session notes

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

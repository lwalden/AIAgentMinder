# /status - Project Status Summary

Provide a quick read-only summary of the project state. Do NOT update any files.

---

## Steps

1. Read `CLAUDE.md` and report:
   - MVP Goals (the `## MVP Goals` section) -- check if active tasks align with these goals; flag any drift
2. Read `PROGRESS.md` and report:
   - Current phase
   - Active tasks and their status
   - Any blocked items awaiting human action

3. Read `DECISIONS.md` and report:
   - Count of decided ADRs
   - Any pending decisions (PDRs)

4. Run `git status` and report:
   - Current branch
   - Any uncommitted changes
   - Any untracked files

5. Run `gh pr list` (if GitHub remote exists) and report:
   - Open PRs and their status

6. Check file sizes and report if any need attention:
   - PROGRESS.md over 100 lines? Suggest running `/archive`
   - Large number of pending decisions? Note them

---

## Output Format

Print a concise summary like:

```
Project Status: [Project Name]
Phase: [current phase]
Branch: [current branch]

MVP Goals:
- [goal 1] ✓/✗ (in scope / scope drift detected)
- [goal 2] ✓

Active Tasks:
- [task 1] -- [status]
- [task 2] -- [status]

Blocked:
- [item] -- needs [what]

Open PRs: [count]
- #[num]: [title] ([status])

Uncommitted Changes: [yes/no]
Pending Decisions: [count]

Suggestions:
- [any actions needed, e.g., "PROGRESS.md is 130 lines -- run /archive"]
- [e.g., "Task 'X' may be outside MVP scope -- confirm before proceeding"]
```

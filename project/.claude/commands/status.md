# /status - Project Status Summary

Provide a quick read-only summary of the project state. Do NOT update any files.

---

## Steps

1. Read `PROGRESS.md` and report:
   - Current phase
   - Active tasks and their status
   - Any blocked items awaiting human action

2. Read `DECISIONS.md` and report:
   - Count of decided ADRs
   - Any pending decisions (PDRs)

3. Run `git status` and report:
   - Current branch
   - Any uncommitted changes
   - Any untracked files

4. Run `gh pr list` (if GitHub remote exists) and report:
   - Open PRs and their status

5. Check file sizes and report if any need attention:
   - PROGRESS.md over 100 lines? Suggest running `/archive`
   - Large number of pending decisions? Note them

---

## Output Format

Print a concise summary like:

```
Project Status: [Project Name]
Phase: [current phase]
Branch: [current branch]

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
```

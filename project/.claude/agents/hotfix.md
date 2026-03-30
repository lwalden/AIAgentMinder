---
name: hotfix
description: Minimal-ceremony hotfix agent — branch, fix, test, PR with no sprint overhead. Use with `claude --agent hotfix` for urgent fixes.
---

# Hotfix Agent

You are in a hotfix session. Minimal ceremony — get the fix in fast, but safely.
Universal rules (git-workflow, tool-first, correction-capture) load from `.claude/rules/` automatically.

---

## Hotfix Workflow

1. **Branch** from main: `fix/{short-description}`
2. **Reproduce** the issue — confirm the bug exists before changing code
3. **Write a failing test** that captures the bug
4. **Fix** the code — minimal change, targeted to the root cause
5. **Run the full test suite** — zero failures
6. **Create a PR** with a clear description of what broke and why

---

## What to Skip

- Approach-first check-in (the fix is urgent)
- Sprint workflow (this is outside sprint governance)
- Architecture fitness audit (unless the fix touches structural boundaries)
- Self-review lenses (quality gate is sufficient for hotfixes)

## What NOT to Skip

- A failing test before the fix (proves the bug exists)
- Full test suite before commit (no regressions)
- Quality gate (`/aam-quality-gate`) before PR
- PR creation (all changes go through PRs)

---

## Debug Checkpoint

If the fix takes more than 2 attempts at the same error, stop and write:

```
Debug Checkpoint — {error summary}
What's been tried: ...
Current hypothesis: ...
What I need from you: ...
```

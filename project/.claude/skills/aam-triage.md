---
description: Structured bug triage — reproduce, diagnose, design fix
user-invocable: true
effort: high
---

# /aam-triage - Bug Triage

Systematically investigate a bug: reproduce it, diagnose the root cause, design a durable fix plan, and create a GitHub issue with the analysis. This is the structured start to debugging — complementing the debug checkpoint pattern (embedded in agent profiles) which handles the structured pause when a fix stalls.

---

## Step 1: Capture the Problem

Get a clear bug description from the user (or from the skill argument). Clarify:

- **Expected behavior** — what should happen?
- **Actual behavior** — what happens instead?
- **Steps to reproduce** — how to trigger the bug
- **Error output** — error message, stack trace, or unexpected output

If any of these are unclear, ask before proceeding.

---

## Step 2: Explore and Diagnose

Use the Agent tool to spawn an exploration subagent (`subagent_type: "Explore"`). The subagent's job:

1. Trace the code path from the entry point (the user action or API call that triggers the bug) to the failure point.
2. Read relevant source files, tests, and configuration — not the entire codebase.
3. Report back:
   - The code path involved
   - Where the failure occurs
   - A root cause hypothesis

**Durability principle:** Describe the root cause in terms of behaviors and contracts, not line numbers or internal variable names. The diagnosis should remain useful even if the code is refactored.

---

## Step 3: Validate Root Cause

Attempt to confirm the root cause hypothesis:

- Run relevant tests to see if the failure is captured
- Reproduce the bug if possible (run the failing path)
- Check whether the hypothesis explains all symptoms

If the hypothesis doesn't hold after 2 iterations, trigger the debug checkpoint pattern: stop and present a structured checkpoint to the user with what's been tried, the current hypothesis, and what information would unblock progress.

---

## Step 4: Design Fix Plan

Design the fix as a series of RED-GREEN test cycles:

1. **RED** — a failing test that captures the bug behavior ("When X happens, the system should Y but currently does Z")
2. **GREEN** — the minimal code change to make the test pass

Write durable descriptions that target behaviors and contracts:
- Good: "When an expired token is submitted, the system should return 401 and clear the session"
- Bad: "Change line 47 in auth.js to check token.exp"

If the fix involves multiple behaviors, plan multiple RED-GREEN cycles.

---

## Step 5: Create GitHub Issue

Use `gh issue create` to create an issue with the analysis:

```
Title: [Bug]: {concise description}

## Root Cause

{findings from Steps 2-3 — what causes the bug and why}

## Fix Plan

{RED-GREEN cycles from Step 4}

## Reproduction

{steps from Step 1}
```

Add labels: `bug`, `triage`.

If `SPRINT.md` has an active sprint, note the sprint ID in the issue body under a **Sprint Context** heading.

---

## Step 6: Log Findings

If the root cause reveals a significant architectural insight (e.g., "auth middleware doesn't validate expired tokens", "error handling is inconsistent across API endpoints"), ask the user: "This finding may be worth recording in DECISIONS.md. Log it? (y/n)"

If yes, append to DECISIONS.md in the project's existing format.

---

## When to Use This

- **Use `/aam-triage`** when a bug needs structured investigation — not a quick fix, but root cause analysis.
- **Use the debug checkpoint pattern** (triggers automatically via agent profile) when you're mid-fix and stuck after 3 attempts on the same error.
- Created issues can be pulled into the next sprint via `/aam-sync-issues`.
- Fix plans produce RED-GREEN cycles that `/aam-tdd` can execute.

---

*Adapted from [mattpocock/skills/triage-issue](https://github.com/mattpocock/skills) (MIT license).*

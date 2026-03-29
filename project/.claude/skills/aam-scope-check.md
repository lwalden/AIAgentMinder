---
description: Active scope governance — check work against roadmap
user-invocable: true
effort: low
---

# /aam-scope-check - Active Scope Governance

Evaluate a proposed feature, task, or change against the project roadmap before you commit to building it.

Use this when you're about to start something and want a clear answer on whether it belongs in the current phase.

---

## How to Use

Describe what you want to build — a sentence or a draft issue title is enough:

> `/aam-scope-check` — Add dark mode toggle to the settings page

> `/aam-scope-check` — Refactor the auth middleware to support OAuth providers

---

## What This Command Does

### Step 1: Read Context

Read:

1. `docs/strategy-roadmap.md` — phase goals, MVP features list, out-of-scope list, future phases
2. `SPRINT.md` — if an active sprint exists, check the approved issue list

### Step 2: Evaluate

Compare the proposed work against the roadmap and active sprint:

- Is it explicitly listed in the current phase's MVP features? → **In scope**
- Is it explicitly listed in "Out of Scope"? → **Out of scope**
- Is it listed in a future phase? → **Deferred**
- Is it absent from the roadmap entirely? → **Not in roadmap**
- Does it fall within the approved sprint issues? → **In sprint** (or **Outside sprint** if not)

### Step 3: Return a Verdict

Return one of these verdicts with a one-sentence recommendation:

**In scope:**
> This aligns with Phase {n} — it maps to "{MVP feature}". Proceed.

**Out of scope:**
> This is marked out of scope in the roadmap: "{quote}". Options: override and proceed, defer to a future phase, or leave it out.

**Deferred:**
> This is planned for Phase {n+1} but not the current phase. Building it now would expand Phase {n} scope. Options: move it up (update the roadmap), or defer until Phase {n+1}.

**Not in roadmap:**
> This isn't in the roadmap. Options:
> 1. Add it to the current phase MVP list (update docs/strategy-roadmap.md)
> 2. Add it to a future phase
> 3. Mark it explicitly out of scope
> Which do you prefer?

**Outside sprint:**
> This is in scope for the phase but not in the current sprint (S{n}). Options: add it to this sprint, queue it for the next sprint, or proceed outside the sprint workflow.

Always include a clear path to proceed — don't just block, give the user an actionable choice.

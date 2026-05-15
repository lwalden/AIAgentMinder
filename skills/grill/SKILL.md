---
description: Plan interrogation — walk every branch of the decision tree
user-invocable: true
effort: high
---

# /aam-grill - Plan Interrogation

Stress-test a plan or design by walking every branch of the decision tree. This is the intensive counterpart to `approach-first.md` — use it when a design is non-obvious, high-stakes, or involves multiple interdependent decisions.

---

## Step 1: Scope the Interrogation

Read the plan or design being questioned. Sources may include:

- An approach statement from `approach-first.md`
- A feature description from `docs/strategy-roadmap.md`
- A freeform plan the user describes
- An existing design doc or PR description

Also read:

- `DECISIONS.md` — for prior decisions that constrain the design space
- `docs/strategy-roadmap.md` — for scope context

---

## Step 2: Map the Decision Tree

Identify every decision branch in the plan — any point where two or more reasonable approaches exist. Present the branches as a numbered list, noting dependencies between them.

Example:

> Decision branches identified:
> 1. Auth storage: session vs JWT
> 2. Rate limiting: middleware vs API gateway (depends on #1)
> 3. Error format: structured vs freeform

---

## Step 3: Walk Each Branch

For each decision branch, one at a time:

1. **If the codebase can answer it** — explore the code first. Check existing patterns, conventions, and constraints. Do not ask the user questions that the code can answer.
2. **If the user needs to decide** — present:
   - The options available
   - Tradeoffs of each
   - Reversal cost: **High** (hard to undo), **Medium** (costly but possible), or **Low** (easy to change later)
   - Downstream dependencies: "If you choose X, then Y becomes constrained"

Resolve one branch before moving to the next. If branches have dependencies, resolve the upstream branch first.

**Continue until the user says they are satisfied or all branches are resolved.**

---

## Step 4: Decision Summary

After all branches are resolved, produce a structured summary:

```
Grill Summary — {plan name}

Decisions made:
1. {topic}: {choice}. Alternatives: {what was considered}. Reversal cost: {H/M/L}. Rationale: {why}.
2. ...

Open questions (deferred):
- {question} — deferred because {reason}

Constraints discovered:
- {constraint found during codebase exploration}
```

Ask the user: "Log these decisions to DECISIONS.md? (y/n)"

If yes, append each decision to DECISIONS.md in the project's existing format, including alternatives considered.

---

## When to Use This

- **Use `/aam-grill`** when a design is non-obvious, high-stakes, or has multiple interdependent decisions.
- **Use `approach-first.md`** for routine check-ins — state intent, confirm, proceed.
- Consider running `/aam-grill` before architecture changes touching more than 5 files.

---

*Adapted from [mattpocock/skills/grill-me](https://github.com/mattpocock/skills) (MIT license).*

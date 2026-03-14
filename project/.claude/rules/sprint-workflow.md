---
description: Sprint planning and execution workflow
---

# Sprint Workflow Guidance
# AIAgentMinder-managed. Delete this file to opt out of sprint-driven development.

## Overview

Sprint workflow has two layers:

- **Sprint governance** (AIAgentMinder): bounded scope, approval gates, review/archive cycle — tracked in `SPRINT.md`
- **Issue execution** (native Tasks): per-issue tracking, persistence, cross-session state — managed with Claude Code's native TaskCreate/TaskUpdate/TaskList tools

`SPRINT.md` is the sprint header: goal, approved scope, sprint number, and status. Individual issues live as native Tasks.

## Sprint Planning

When the user asks to start a sprint or begin a phase:

1. Read `docs/strategy-roadmap.md` for the phase's features and acceptance criteria.
2. Read `DECISIONS.md` for architectural context that affects implementation choices.
3. Check `SPRINT.md` for archived sprint lines. If present, read the `<!-- sizing: {min}-{max} -->` comment from the most recent archive — use that range as the recommended issue count for this sprint.
4. Determine sprint scope. A sprint covers a coherent subset of the phase's work — typically 4–7 issues. Prefer thematic coherence (e.g., "auth + session management") over arbitrary cutoffs. More than 8 issues is a signal to split; fewer than 3 is a signal to reconsider granularity.
5. Decompose into discrete issues. Each issue must be completable in a single focused effort. One PR per issue. Each issue must have: a title, a type (feature/fix/chore/spike), acceptance criteria, and references to relevant roadmap items.
6. **Risk tagging:** For each issue, check if it touches a high-risk area:
   - Auth or session handling
   - Payments or billing
   - Data migration or schema changes
   - Public API changes (breaking or additive)
   - Security-sensitive config or secrets handling

   If yes, add `[risk]` to the issue title. Risk-tagged issues trigger automatic `/self-review` before PR creation regardless of quality tier.

7. Write the sprint header to `SPRINT.md`:

   ```markdown
   **Sprint:** S{n} — {sprint goal}
   **Status:** proposed
   **Phase:** {phase name from roadmap}
   **Issues:** {count} issues proposed

   | ID | Title | Type | Risk | Status |
   |---|---|---|---|---|
   | S{n}-001 | {title} | feature |  | todo |
   | S{n}-002 | {title} [risk] | fix | ⚠ | todo |
   ```

8. Present the sprint to the user as a numbered list with acceptance criteria for each issue. Note any risk-tagged issues. If phase work was deferred, briefly note what was left out and why. **Wait for the user to review, edit, discuss, and approve before proceeding.**

Issue ID format: `S{sprint_number}-{sequence}` (e.g., S1-001, S1-002, S2-001).

## After User Approval

Once the user approves:

1. Update `SPRINT.md` status from `proposed` to `in-progress`.
2. Create a native Task for each approved issue using the TaskCreate tool:
   - Title: the issue title (including `[risk]` tag if applicable)
   - Description: acceptance criteria + issue ID (e.g., `[S1-001]`)
   - Use task dependencies where one issue must complete before another starts
3. Confirm to the user: "Sprint S{n} started. {count} tasks created. Working issues in order."

## Sprint Execution

- Work issues in the proposed order unless the user directs otherwise.
- For each issue: create a feature branch (`{type}/S{n}-{seq}-{short-desc}`), implement, commit referencing the issue ID (`feat(auth): implement login endpoint [S1-003]`).
- Before creating a PR: run `/quality-gate` to confirm the issue meets the project's quality tier. Fix any failures before proceeding.
- For **Rigorous** and **Comprehensive** quality tiers: also run `/self-review` after the quality gate passes. Address any High severity findings before proceeding.
- For **risk-tagged issues** (`[risk]`): run `/self-review` regardless of quality tier (even Lightweight/Standard). Address any High severity findings before creating the PR.
- After all checks pass, create the PR. Notify the user it's ready for review. **Wait for user input before merging — the user always approves PRs.**
- Update the native Task status as you work: pending → in_progress → completed (or leave pending if blocked).
- Update SPRINT.md issue status to match: `todo` → `in-progress` → `done` or `blocked`.
- If an issue cannot be completed: mark both the Task and SPRINT.md entry as `blocked` and notify the user with a clear description of what's needed.

## Sprint Completion

A sprint ends when all issues are `done` or `blocked`.

- If blocked issues exist: notify the user and wait for resolution. Once blocks are resolved, complete remaining issues, then proceed to review.
- Present a sprint review: completed issues with PR links, decisions logged to DECISIONS.md, any risk-tagged issues and their self-review outcomes, summary of what was accomplished, and what remains for the next sprint.
- Run `/retrospective` to generate metrics for the sprint. Present it alongside the review.
- If the user accepts the review: archive the sprint — replace SPRINT.md contents with:

  ```
  S{n} archived ({date}): {planned} planned, {completed} completed ({velocity}%). {brief summary}.
  <!-- sizing: {recommended_min}-{recommended_max} -->
  ```

  The velocity percentage is `completed/planned * 100`. The `sizing` comment is the recommended issue range for the next sprint, derived from `/retrospective` Step 4. Full sprint detail is preserved in git history and in native task history.

- The user can then ask to begin a new sprint. Increment the sprint number.

## Cross-Session Behavior

- `SPRINT.md` persists across sessions via git — it's the sprint header and authoritative scope record.
- Native Tasks persist across sessions automatically (stored at `~/.claude/tasks/`).
- When resuming a session with an active sprint: read `SPRINT.md` to get context, then use TaskList to see current task states. Resume from where you left off.
- `/handoff` works independently — it checkpoints decisions and key context. Do not modify SPRINT.md or tasks during handoff; sprint state is updated during sprint execution.

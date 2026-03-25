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
3. Check `SPRINT.md` for archived sprint lines. If present, read the `<!-- sizing: {min}-{max} -->` comment from the most recent archive — use that range as the recommended issue count. If no archive exists, default to 4–5 issues. Never plan more than 7 issues regardless of sizing comment.
4. Determine sprint scope. A sprint covers a coherent subset of the phase's work — typically 4–7 issues. Prefer fitting whole features over hitting an exact count: if a feature needs 6 issues and the sizing range says 4–5, plan 6 but confirm with the user. More than 7 issues signals context overload; fewer than 3 signals insufficient granularity.
5. Decompose into discrete issues. Each issue must be completable in a single focused effort. One PR per issue. Each issue must have: a title, a type (feature/fix/chore/spike), acceptance criteria, and references to relevant roadmap items.
6. **Risk tagging:** For each issue, check if it touches a high-risk area:
   - Auth or session handling
   - Payments or billing
   - Data migration or schema changes
   - Public API changes (breaking or additive)
   - Security-sensitive config or secrets handling

   If yes, add `[risk]` to the issue title. Risk-tagged issues trigger automatic `/aam-self-review` before PR creation regardless of quality tier.

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
- Before creating a PR: run `/aam-quality-gate` to confirm the issue meets the project's quality tier. Fix any failures before proceeding.
- For **Rigorous** and **Comprehensive** quality tiers: also run `/aam-self-review` after the quality gate passes. Address any High severity findings before proceeding.
- For **risk-tagged issues** (`[risk]`): run `/aam-self-review` regardless of quality tier (even Lightweight/Standard). Address any High severity findings before creating the PR.
- After all checks pass, create the PR. If `.claude/commands/aam-pr-pipeline.md` exists, run `/aam-pr-pipeline` in the current session to review, test, and merge the PR. If the pipeline succeeds (PR merged), update the issue's Task to `completed` and SPRINT.md row to `done`, then switch back to the base branch and pull (`git checkout main && git pull`) before starting the next sprint issue. If the pipeline escalates (`needs-human-review` or `ci-failure` label), stop and notify the user before continuing. If the pipeline command is not installed, wait for the user to confirm the PR is handled before beginning the next issue.
- Update the native Task status as you work: pending → in_progress → completed (or leave pending if blocked).
- Update SPRINT.md issue status to match: `todo` → `in-progress` → `done` or `blocked`.
- If an issue cannot be completed: mark both the Task and SPRINT.md entry as `blocked` and notify the user with a clear description of what's needed.

## Sprint Completion

A sprint ends when all issues are `done` or `blocked`.

- If blocked issues exist: notify the user and wait for resolution. Once blocks are resolved, complete remaining issues, then proceed to review.
- Present a sprint review: completed issues with PR links, decisions logged to DECISIONS.md, any risk-tagged issues and their self-review outcomes, summary of what was accomplished, and what remains for the next sprint.
- Run `/aam-retrospective` to generate metrics for the sprint. Present it alongside the review.
- If the user accepts the review: archive the sprint — replace SPRINT.md contents with:

  ```
  S{n} archived ({date}): {planned} planned, {completed} completed. {scope_changes} scope changes, {blocked} blocked. {brief summary}.
  <!-- sizing: {recommended_min}-{recommended_max} -->
  ```

  The `sizing` comment is the recommended issue range for the next sprint, derived from `/aam-retrospective` Step 4. Scope changes and blocked counts are recorded as stress indicators for future sizing adjustments. Full sprint detail is preserved in git history and in native task history.

- The user can then ask to begin a new sprint. Increment the sprint number.

## Cross-Session Behavior

- `SPRINT.md` persists across sessions via git — it's the sprint header and authoritative scope record.
- Native Tasks persist across sessions automatically (stored at `~/.claude/tasks/`).
- When resuming a session with an active sprint: read `SPRINT.md` to get context, then use TaskList to see current task states. Resume from where you left off.
- `/aam-handoff` works independently — it checkpoints decisions and key context. Do not modify SPRINT.md or tasks during handoff; sprint state is updated during sprint execution.

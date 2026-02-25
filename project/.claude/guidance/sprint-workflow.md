# Sprint Workflow Guidance
# AIAgentMinder-managed. Delete this file to opt out of sprint-driven development.

## Sprint Planning

When the user asks to start a sprint or begin a phase:

1. Read `docs/strategy-roadmap.md` for the phase's features and acceptance criteria.
2. Read `PROGRESS.md` for current state, what's done, and any blockers.
3. Read `DECISIONS.md` for architectural context that affects implementation choices.
4. Determine sprint scope. A sprint covers a coherent subset of the phase's work — typically 4–7 issues. If the phase has more work than fits comfortably in one sprint, group related features into this sprint and defer the rest to subsequent sprints. Prefer thematic coherence (e.g., "auth + session management") over arbitrary cutoffs. More than 8 issues is a signal to split; fewer than 3 is a signal to reconsider issue granularity or combine with adjacent work.
5. Decompose the sprint scope into discrete issues. Each issue must be completable in a single focused effort — small enough that you don't need the entire codebase in context. One PR per issue. Each issue must have: a title, a type (feature/fix/chore/spike), acceptance criteria, and references to relevant strategy-roadmap items or files.
6. Write the proposed sprint to `SPRINT.md` using the active sprint format.
7. Present the sprint to the user as a numbered list. If phase work was deferred to a future sprint, briefly note what was left out and why. **Wait for the user to review, edit, discuss, and approve before starting any implementation.**

Issue ID format: `S{sprint_number}-{sequence}` (e.g., S1-001, S1-002, S2-001).

## Sprint Execution

After user approval:

- Work issues in the proposed order unless the user directs otherwise.
- For each issue: create a feature branch (`{type}/S{n}-{seq}-{short-desc}`), implement, commit referencing the issue ID (`feat(auth): implement login endpoint [S1-003]`), create a PR. PR description includes sprint number and issue ID.
- After creating a PR, notify the user it's ready for review. **Wait for user input before merging — the user always approves PRs.**
- Update SPRINT.md issue status as you work: `todo` → `in-progress` → `done` or `blocked`.
- If an issue cannot be completed (missing info, unfinished dependency, needs human action): mark it `blocked` in SPRINT.md, add the blocker to PROGRESS.md Blockers, and notify the user with a clear description of what's needed.

## Sprint Completion

A sprint ends when all issues are `done` or `blocked`.

- If blocked issues exist: notify the user and wait for resolution. Once all blocks are resolved, complete remaining issues, then proceed to review.
- Present a sprint review: completed issues with PR links, decisions logged to DECISIONS.md, summary of what was accomplished, and what remains for the next sprint.
- If the user accepts the review: archive the sprint — replace SPRINT.md contents with a single summary line (see archived format). Update PROGRESS.md with sprint outcome. Full sprint detail is preserved in git history.
- The user can then ask to begin a new sprint. Increment the sprint number.

## Cross-Session Behavior

- SPRINT.md persists across sessions via git. When resuming a session with an active sprint, read SPRINT.md to understand which issues remain and continue from where you left off.
- `/handoff` works independently — it checkpoints current state including any active sprint. Do not modify SPRINT.md during handoff; sprint state is updated during sprint execution.

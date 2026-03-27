---
description: Sprint planning and execution workflow — state machine with mandatory quality steps
---

# Sprint Workflow
# AIAgentMinder-managed. Delete this file to opt out of sprint-driven development.

## Overview

Sprint workflow has two layers:

- **Sprint governance** (AIAgentMinder): bounded scope, approval gates, review/archive cycle — tracked in `SPRINT.md`
- **Issue execution** (native Tasks): per-issue tracking, persistence, cross-session state — managed with Claude Code's native TaskCreate/TaskUpdate/TaskList tools

`SPRINT.md` is the sprint header: goal, approved scope, sprint number, and status. Individual issues live as native Tasks.

---

## Sprint States

Every sprint follows this state machine. Each state has mandatory steps and defined transitions.

```
PLAN → SPEC → APPROVE → [for each item: EXECUTE → TEST → REVIEW → MERGE → VALIDATE] → COMPLETE
                                                     ↑
                                              CONTEXT_CYCLE (at NEXT transition — fresh session, resume from here)
```

**Human checkpoints** (ONLY these pause for input):
- **PLAN**: present sprint issues for approval
- **APPROVE**: present item specs for approval/revision
- **BLOCKED**: any state where Claude cannot proceed without human help
- **REWORK**: post-merge test failure requires human decision

**Autonomous transitions** (proceed WITHOUT asking):
- Approved spec → begin execution
- Execution complete → run tests
- Tests pass → quality gate → self-review → create PR
- PR pipeline passes → merge
- Merge complete → post-merge validation (or next item if none)
- Post-merge validation passes → next item
- All items complete → sprint review

---

## Mandatory Quality Checklist

**NEVER SKIP these steps. Not when the user says "go faster." Not when the user says "stop asking." Not when context is running low. These are non-negotiable.**

For every sprint item, in order:

1. Read the item spec and gather project context
2. Create a feature branch
3. Write failing test(s) for acceptance criteria (TDD RED)
4. Implement until tests pass (TDD GREEN)
5. Refactor if needed (tests must stay green)
6. Run the full test suite — zero failures required
7. Run `/aam-quality-gate`
8. Run `/aam-self-review` (always — not tier-dependent)
9. Create PR
10. Run `/aam-pr-pipeline` (review → fix → test → merge)
11. Execute post-merge validation tasks (if any)

If ANY step fails, fix it before proceeding to the next step. Do not skip a step to "come back to it later."

---

## Autonomous Execution Directive

After the human approves the sprint specs, execute all items in sequence without asking permission between items. The approved spec IS the permission.

**ASK FOR HUMAN INPUT ONLY WHEN:**
- Blocked (external dependency, missing credentials, ambiguous AC)
- Debug checkpoint triggered (3 failed attempts at same error)
- Test requires human action (physical device, hardware interaction, or visual judgment Claude cannot resolve via Playwright screenshots)
- Post-merge test fails (rework decision needed)
- Insufficient information to write a meaningful spec

**NEVER ASK:**
- "Shall I proceed to the next item?" — yes, always
- "Shall I create the PR?" — yes, always
- "Shall I run the quality gate?" — yes, always
- "Shall I run tests?" — yes, always
- "Shall I merge?" — yes, if pipeline passes

**NEVER SKIP (even if the user says "go faster" or "don't ask me"):**
- TDD (write failing test before implementation)
- Full test suite execution before PR
- Quality gate
- Self-review
- PR pipeline review step
- Post-merge validation (if defined for the item)

The user's instruction to reduce interruptions means "stop asking permission on approved work." It does NOT mean "skip quality steps." If you are unsure whether something is a permission prompt or a quality step, it is a quality step.

---

## State: PLAN

When the user asks to start a sprint or begin a phase:

1. Read `docs/strategy-roadmap.md` for the phase's features and acceptance criteria.
2. Read `DECISIONS.md` for architectural context that affects implementation choices.
3. Check `SPRINT.md` for archived sprint lines. If present, read the `<!-- sizing: {min}-{max} -->` comment from the most recent archive — use that range as the recommended issue count. If no archive exists, default to 4-5 issues. Never plan more than 7 issues regardless of sizing comment.
4. Determine sprint scope. A sprint covers a coherent subset of the phase's work — typically 4-7 issues. Prefer fitting whole features over hitting an exact count. More than 7 issues signals context overload; fewer than 3 signals insufficient granularity.
5. Decompose into discrete issues. Each issue must be completable in a single focused effort. One PR per issue. Each issue must have: a title, a type (feature/fix/chore/spike), acceptance criteria, and references to relevant roadmap items.
6. **Risk tagging:** For each issue, check if it touches a high-risk area:
   - Auth or session handling
   - Payments or billing
   - Data migration or schema changes
   - Public API changes (breaking or additive)
   - Security-sensitive config or secrets handling

   If yes, add `[risk]` to the issue title.

7. Write the sprint header to `SPRINT.md`:

   ```markdown
   **Sprint:** S{n} — {sprint goal}
   **Status:** proposed
   **Phase:** {phase name from roadmap}
   **Issues:** {count} issues proposed

   | ID | Title | Type | Risk | Status | Post-Merge |
   |---|---|---|---|---|---|
   | S{n}-001 | {title} | feature |  | todo | n/a |
   | S{n}-002 | {title} [risk] | fix | ⚠ | todo | n/a |
   ```

8. Present the sprint to the user as a numbered list with acceptance criteria for each issue. Note any risk-tagged issues. If phase work was deferred, briefly note what was left out and why. **Wait for the user to review, edit, discuss, and approve before proceeding.**

Issue ID format: `S{sprint_number}-{sequence}` (e.g., S1-001, S1-002, S2-001).

→ **Transition:** User approves → move to SPEC.

---

## State: SPEC

After the user approves the sprint issue list, write a detailed spec for each item before any coding begins.

### Per-Item Spec Format

For each sprint item, produce:

```markdown
### S{n}-{seq}: {title}

**Approach:**
{Which files to create or modify. What patterns to follow from existing code. Key implementation decisions.}

**Test Plan (TDD RED targets):**
1. {Failing test description — behavior-focused, not implementation-focused}
2. {Next failing test}
3. ...

**Integration / E2E Tests:**
{Playwright tests, API tests, or other integration tests to run before PR. "None" if unit tests cover it.}

**Post-Merge Validation:**
{Tests that require deployment or external services. "None" if all testing is pre-merge.}

**Files:**
- Create: {list}
- Modify: {list}

**Dependencies:**
{Other sprint items that must complete first. "None" if independent.}

**Custom Instructions:**
{Slot for human-provided per-item guidance. "None" unless human adds them.}
```

### Spec Presentation

Present all specs to the user in a single message. The user may:
- **Approve all** — proceed to execution
- **Revise specific items** — update those specs, re-present for approval
- **Add custom instructions** — per-item guidance that becomes part of the spec
- **Reorder items** — change execution sequence

If writing a spec requires information Claude doesn't have (unclear AC, unknown API contract, missing design), ask the human for that specific information before finalizing the spec. Do not guess.

→ **Transition:** User approves specs → move to APPROVE.

---

## State: APPROVE

Once the user approves all specs:

1. Update `SPRINT.md` status from `proposed` to `in-progress`.
2. Create a native Task for each approved issue using the TaskCreate tool:
   - Title: the issue title (including `[risk]` tag if applicable)
   - Description: acceptance criteria + spec summary + issue ID (e.g., `[S1-001]`)
   - Use task dependencies where the spec defines them
3. Confirm to the user: "Sprint S{n} started. {count} tasks created. Beginning execution."

→ **Transition:** Autonomous — immediately begin EXECUTE for the first item.

---

## State: EXECUTE

For each item, in order (or as directed by approved spec dependencies):

1. Update the native Task status to `in_progress`. Update SPRINT.md row to `in-progress`.
2. Read the item's spec (from the approved spec phase).
3. Read relevant source files to understand existing patterns and context.
4. Create a feature branch: `{type}/S{n}-{seq}-{short-desc}`.
5. **TDD RED:** Write failing test(s) matching the spec's Test Plan. Run them — confirm they fail for the right reason.
6. **TDD GREEN:** Implement the minimal code to make tests pass. Run tests after each meaningful change.
7. **Refactor:** Clean up while tests stay green. Extract duplication, improve naming, simplify.
8. **Integration/E2E tests:** If the spec defines integration or Playwright tests, write and run them.
9. Run the **full test suite**. Zero failures. If a test fails that is unrelated to this item, investigate — it may indicate a regression. Fix it or document it as a blocker.

→ **Transition:** All tests pass → move to TEST.

---

## State: TEST

Verification that the item meets its acceptance criteria:

1. Run the project's full test suite one final time (clean run, not incremental).
2. Run `/aam-quality-gate`. Fix any failures.
3. Run `/aam-self-review`. Address any High severity findings. For Medium/Low, fix them — do not ask whether to proceed.
4. If the spec includes Playwright or browser tests: execute them. Use screenshots to verify visual correctness. Only escalate to human if visual judgment cannot be resolved from screenshots.

→ **Transition:** All checks pass → move to REVIEW (PR creation + pipeline).

---

## State: REVIEW

1. Create the PR with a clear title referencing the sprint item ID and a body summarizing what was built, how it was tested, and any decisions made.
2. Run `/aam-pr-pipeline` in the current session.
   - Pipeline handles: code review → fix issues → re-test → merge.
   - If the pipeline finds issues and fixes them, that's normal — let it cycle.
   - If the pipeline escalates (`needs-human-review`, `ci-failure`, cycle limit), stop and notify the user. This is a BLOCKED state.

→ **Transition:** Pipeline succeeds (PR merged) → move to MERGE.
→ **Transition:** Pipeline escalates → move to BLOCKED. Wait for human.

---

## State: MERGE

PR has been merged. Housekeeping:

1. Switch back to the base branch and pull: `git checkout main && git pull`.
2. Update the native Task status to `completed`.
3. Update SPRINT.md row status to `done`.
4. Check the item's spec for post-merge validation tasks.

→ **Transition:** Post-merge tasks exist → move to VALIDATE.
→ **Transition:** No post-merge tasks → move to NEXT.

---

## State: VALIDATE

Execute post-merge validation defined in the item's spec:

1. If validation requires a deployed environment, check if it's available. If a wait is needed (deploy pipeline, build, etc.), poll at reasonable intervals. If the wait exceeds 15 minutes, notify the human and continue to the next item — but the Post-Merge column stays `pending` and **the sprint CANNOT close until this validation runs.** The NEXT and COMPLETE states will enforce this.
2. Run post-merge tests (API smoke tests against deployed environment, browser tests against staging, etc.).
3. Update SPRINT.md Post-Merge column:
   - Tests pass → `pass`
   - Tests fail → `fail`
   - Still waiting → leave as `pending` (validation will be retried from NEXT or before COMPLETE)

**A `pending` post-merge validation is a blocking obligation, not a note.** It must be executed before the sprint can close. Do not treat it as informational.

→ **Transition:** Pass → move to NEXT.
→ **Transition:** Fail → move to REWORK.
→ **Transition:** Deferred (wait timeout) → move to NEXT, but validation remains pending.

---

## State: REWORK

A post-merge validation test has failed.

1. Notify the human: describe what failed, the expected vs. actual behavior, and your diagnosis.
2. Create a rework task in SPRINT.md:

   ```
   | S{n}-{seq}r | Rework: {original title} — {failure description} | fix | ⚠ | todo | n/a |
   ```

3. Create a corresponding native Task.
4. Wait for human acknowledgment, then execute the rework item through the full cycle (EXECUTE → TEST → REVIEW → MERGE → VALIDATE).

The sprint cannot close while rework items are outstanding.

→ **Transition:** Human acknowledges → execute rework item from EXECUTE state.

---

## State: NEXT

Move to the next sprint item.

1. Check SPRINT.md for the next `todo` item.
2. Check for any deferred VALIDATE steps from earlier items (where deploy wait exceeded the timeout). If any are now ready, complete validation first — return to VALIDATE for those items before proceeding.
3. **Context pressure check** — evaluate whether to cycle before the next item (see CONTEXT_CYCLE state below). This check runs BEFORE starting the next EXECUTE.

→ **Transition:** Context cycle warranted → move to CONTEXT_CYCLE.
→ **Transition:** Next item exists (no cycle needed) → move to EXECUTE for that item.
→ **Transition:** All items `done` AND every Post-Merge column is `pass` or `n/a` → move to COMPLETE.
→ **Transition:** All items `done` BUT any Post-Merge column is `pending` → **do NOT move to COMPLETE.** Execute those pending validations now (return to VALIDATE for each). If validation cannot run yet (deploy not ready), notify the human and WAIT — do not present the sprint review.

---

## State: COMPLETE

**PRECONDITION CHECK (mandatory — run this before anything else):**
Read SPRINT.md and verify that EVERY row's Post-Merge column is either `pass` or `n/a`. If ANY row shows `pending`, STOP — you are not in COMPLETE state. Return to VALIDATE for those items. Do not present the sprint review, do not run the retrospective, do not ask for archival. This is not optional.

Once the precondition is verified:

1. Present a sprint review: completed issues with PR links, decisions logged to DECISIONS.md, any risk-tagged issues and their self-review outcomes, rework items and their resolution, summary of what was accomplished.
2. Run `/aam-retrospective` to generate metrics. Present alongside the review.
3. If a final documentation-only PR is needed (README updates, API docs, etc.), create it and run it through the pipeline.
4. **Wait for human to accept the review.** If accepted, archive the sprint:

   ```
   S{n} archived ({date}): {planned} planned, {completed} completed, {rework} rework. {scope_changes} scope changes, {blocked} blocked. {brief summary}.
   <!-- sizing: {recommended_min}-{recommended_max} -->
   ```

5. Notify the human: "Sprint S{n} complete. Ready for the next sprint when you are."

→ **Transition:** Human asks for next sprint → increment sprint number, move to PLAN.

---

## State: BLOCKED

Any state can transition to BLOCKED when Claude cannot proceed.

Triggers:
- External dependency unavailable
- Missing credentials or secrets
- Ambiguous acceptance criteria that cannot be resolved from existing docs
- Debug checkpoint (3 failed attempts at same error)
- Test requires human action (physical device, hardware interaction, or visual judgment Claude cannot resolve via Playwright screenshots)
- PR pipeline escalation

When blocked:
1. Update SPRINT.md row to `blocked`.
2. Notify the human with: what's blocked, why, what information or action would unblock it.
3. Wait for human response.

→ **Transition:** Human provides resolution → return to the state that was blocked.

---

## State: CONTEXT_CYCLE

Autonomous context management. When context pressure is high, Claude persists sprint state, self-terminates, and a fresh session resumes automatically. **No human intervention required** (if the profile hook or sprint-runner wrapper is set up).

### When to Cycle

Evaluate at every NEXT transition. Cycle if ANY of these are true:

- **Item count threshold:** 3 or more items completed in this session. Each item consumes significant context (spec reading, implementation, test output, PR pipeline, review comments). By item 4+, quality visibly degrades.
- **Compaction has occurred:** If the `compact-reorient.js` hook has fired during this session, context has already been lossy-compressed once. A second compaction will degrade further. Cycle before it happens.
- **Heavy debugging occurred:** If a debug checkpoint was triggered (3+ failed attempts on an error) during the current or most recent item, that debugging consumed disproportionate context. Factor this into the decision.
- **Complex rework:** If a REWORK item was executed in this session, its full cycle (diagnosis + fix + re-test + re-review) added substantial context on top of the original items.

Use judgment — these are heuristics, not hard rules. The goal is to cycle BEFORE quality degrades, not after. When in doubt, cycle. A fresh session with good state recovery is always better than a degraded session that limps through the remaining items.

### How to Cycle

Execute these steps in order. Do NOT skip any step.

**Step 1: Commit all work.** Ensure the current item is fully merged or that any in-progress work is committed to a branch. The cycle must not lose uncommitted code.

**Step 2: Write the continuation file.** Create `.sprint-continuation.md` in the project root:

```markdown
# Sprint Continuation State
**Generated:** {ISO timestamp}
**Reason:** {why cycling — e.g., "3 items completed, context pressure high"}
**Session items completed:** {count}

## Resume Point
**Sprint:** S{n}
**Next item:** S{n}-{seq}
**Next item state:** EXECUTE (beginning)
**Branch:** main (or specify if mid-item)

## Completed This Session
{list of items completed with one-line status each}

## Critical Context
{2-5 bullets of non-obvious context the next session needs that isn't in SPRINT.md,
DECISIONS.md, or the item spec. Examples:}
- {architectural decision made during this session not yet in DECISIONS.md}
- {dependency discovered during implementation}
- {test environment state that matters}

## Instructions for Next Session
1. Read SPRINT.md for sprint state and approved specs
2. Use TaskList to see native task states
3. Begin EXECUTE for S{n}-{seq} following the approved spec
4. Continue autonomous execution through remaining items
```

Keep Critical Context minimal — most state is already in SPRINT.md, DECISIONS.md, native Tasks, and git history. Only include what would be LOST without this file.

**Step 3: Write the signal file.** Create `.sprint-continue-signal` in the project root. Contents don't matter (can be empty) — its existence is the signal.

```bash
echo "cycle" > .sprint-continue-signal
```

**Step 4: Self-terminate.** Run the context cycle script:

```bash
bash .claude/scripts/context-cycle.sh
```

This traces the process tree to find the Claude CLI process and kills it. The profile hook or sprint-runner wrapper catches the signal file and starts a fresh Claude instance with the continuation prompt.

**Step 5 (fallback): If self-termination fails** (script error, process not found), tell the user:

```
Context cycle needed but self-termination failed.
State files are written. Please type /exit, then run:
  claude "CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution."
```

### After Cycling (new session)

The new session starts with a `CONTEXT CYCLE:` prompt. On receiving this:

1. Read `.sprint-continuation.md` for the resume point and critical context.
2. Read `SPRINT.md` for full sprint state and approved specs.
3. Use `TaskList` to see native task states.
4. Read the spec for the next item (from SPRINT.md or git history).
5. Delete `.sprint-continuation.md` (it has served its purpose).
6. Resume from EXECUTE for the indicated item. Continue autonomous execution.

→ **Transition:** Self-terminate → fresh session → EXECUTE for next item.

---

## Cross-Session Behavior

- `SPRINT.md` persists across sessions via git — it's the sprint header and authoritative scope record.
- Native Tasks persist across sessions automatically (stored at `~/.claude/tasks/`).
- When resuming a session with an active sprint: read `SPRINT.md` to get context, then use TaskList to see current task states. Resume from where you left off — identify which state the current item is in and continue from there.
- Item specs are preserved in git history (committed during the APPROVE state). If context is lost after compaction, re-read the spec from the committed version.
- `/aam-handoff` works independently — it checkpoints decisions and key context. Do not modify SPRINT.md or tasks during handoff; sprint state is updated during sprint execution.
- **Context cycling** preserves sprint continuity across automatic session restarts. The continuation file (`.sprint-continuation.md`) bridges the gap between sessions with ephemeral context that isn't captured in SPRINT.md or git. The signal file (`.sprint-continue-signal`) triggers the restart mechanism. Both are ephemeral and gitignored.
- **Setup requirement:** Context cycling self-termination works on Windows (Git Bash). The restart requires either the PowerShell profile hook (installed via `.claude/scripts/install-profile-hook.ps1`) or the sprint-runner wrapper (`.claude/scripts/sprint-runner.ps1`). Without either, Claude falls back to telling the user what command to run.

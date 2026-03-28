---
description: Sprint planning and execution workflow — state machine with mandatory quality steps
---

# Sprint Workflow
# AIAgentMinder-managed. Delete this file to opt out of sprint-driven development.

Sprint governance (bounded scope, approval gates, review/archive) tracks in `SPRINT.md`. Issue execution uses native Tasks (TaskCreate/TaskUpdate/TaskList — persistent, cross-session). `SPRINT.md` is the sprint header; individual issues are native Tasks.

## State Machine

```
PLAN → SPEC → APPROVE → [per item: EXECUTE → TEST → REVIEW → MERGE → VALIDATE] → COMPLETE
                                                    ↑
                                             CONTEXT_CYCLE (at NEXT transition)
```

**Human checkpoints** (pause for input): PLAN (approve issues), APPROVE (approve specs), BLOCKED, REWORK.
**Autonomous** (proceed without asking): all other transitions after spec approval.

## Quality Checklist (non-negotiable — never skip, even if told "go faster")

Per item, in order. Fix failures before advancing — no skipping to "come back later."

1. Read spec + gather context → 2. Feature branch → 3. Failing tests (TDD RED) → 4. Implement to pass (TDD GREEN) → 5. Refactor (tests green) → 6. Full test suite (zero failures) → 7. `/aam-quality-gate` → 8. `/aam-self-review` → 9. Create PR → 10. `/aam-pr-pipeline` (review→fix→test→merge) → 11. Post-merge validation (if any)

## Autonomy Rules

After spec approval, execute all items sequentially without permission. The approved spec IS the permission.

**Ask human ONLY when:** blocked (dependency/credentials/ambiguous AC), debug checkpoint (3 failed same-error attempts), test needs human action (physical/hardware/unresolvable visual), post-merge fails, insufficient info for spec.

**Never ask** "Shall I proceed/create PR/run QG/run tests/merge?" — always yes.

**Never skip** (even if user says "go faster"): TDD, full test suite, quality gate, self-review, PR pipeline, post-merge validation. "Reduce interruptions" = stop asking permission, NOT skip quality. When uncertain if permission prompt or quality step → quality step.

## PLAN

1. Read `docs/strategy-roadmap.md` for phase features/AC.
2. Read `DECISIONS.md` for architectural context.
3. Check `SPRINT.md` archives for `<!-- sizing: {min}-{max} -->` → use as recommended count. Default 4-5. Max 7 regardless.
4. Scope: 4-7 issues covering a coherent phase subset. Prefer whole features over exact count. >7 = context overload; <3 = insufficient granularity.
5. Decompose: title, type (feature/fix/chore/spike), AC, roadmap refs. One PR per issue. Completable in single focused effort.
6. **Risk tag `[risk]`** if touching: auth/session, payments/billing, data migration/schema, public API changes, security/secrets.
7. Write sprint header to `SPRINT.md`:
   ```markdown
   **Sprint:** S{n} — {goal}
   **Status:** proposed
   **Phase:** {phase}
   **Issues:** {count} proposed

   | ID | Title | Type | Risk | Status | Post-Merge |
   |---|---|---|---|---|---|
   | S{n}-001 | {title} | feature |  | todo | n/a |
   | S{n}-002 | {title} [risk] | fix | ⚠ | todo | n/a |
   ```
8. Present numbered list with AC per issue. Note risk tags and deferred work. **Wait for approval.**

Issue ID format: `S{sprint}-{seq}` (S1-001, S2-003). → User approves → SPEC.

## SPEC

Write detailed spec per item before coding.

```markdown
### S{n}-{seq}: {title}
**Approach:** {files to create/modify, patterns, key decisions}
**Test Plan (TDD RED):** 1. {behavior-focused failing test} 2. ...
**Integration/E2E:** {Playwright/API tests, or "None"}
**Post-Merge Validation:** {deploy-dependent tests, or "None"}
**Files:** Create: {list} | Modify: {list}
**Dependencies:** {other items, or "None"}
**Custom Instructions:** {human-provided, or "None"}
```

Present all specs together. User may: approve all, revise items, add custom instructions, reorder. If info missing (unclear AC, unknown API), ask for that specific info — don't guess. → User approves → APPROVE.

## APPROVE

1. Update `SPRINT.md` status to `in-progress`.
2. Create native Task per issue (title with risk tag, description: AC + spec summary + issue ID, dependencies from spec).
3. Confirm: "Sprint S{n} started. {count} tasks. Beginning execution."

→ Immediately begin EXECUTE for first item.

## EXECUTE

1. Update Task to `in_progress`, SPRINT.md row to `in-progress`.
2. Read spec + relevant source files.
3. Branch: `{type}/S{n}-{seq}-{short-desc}`.
4. TDD RED → TDD GREEN → Refactor → Integration/E2E if spec defines → Full test suite (zero failures; investigate unrelated failures as regressions).

→ All pass → TEST.

## TEST

1. Full suite (clean run). 2. `/aam-quality-gate` — fix failures. 3. `/aam-self-review` — fix High; fix Medium/Low without asking. 4. Playwright/browser tests if spec requires (screenshots for visual; escalate to human only if unresolvable).

→ All pass → REVIEW.

## REVIEW

1. Create PR (title refs item ID; body: what built, how tested, decisions).
2. `/aam-pr-pipeline` in session. Handles review→fix→retest→merge. If escalated (needs-human-review, ci-failure, cycle limit) → BLOCKED.

→ Pipeline merges → MERGE.

## MERGE

1. `git checkout main && git pull`. 2. Update Task to `completed`, SPRINT.md row to `done`. 3. Check spec for post-merge validation.

→ Post-merge exists → VALIDATE. None → NEXT.

## VALIDATE

1. If deployed env needed, poll availability (max 15 min; if exceeded, notify human, continue to NEXT — Post-Merge stays `pending`, **sprint cannot close until validated**).
2. Run post-merge tests. Update SPRINT.md Post-Merge: `pass`, `fail`, or `pending`. A `pending` validation is a blocking obligation, not informational.

→ Pass → NEXT. Fail → REWORK. Deferred → NEXT (pending remains).

## REWORK

1. Notify human: what failed, expected vs actual, diagnosis.
2. Add row: `| S{n}-{seq}r | Rework: {title} — {failure} | fix | ⚠ | todo | n/a |`
3. Create native Task. **Wait for human acknowledgment.**

→ Human acknowledges → EXECUTE rework item (full cycle). Sprint can't close with outstanding rework.

## NEXT

1. Find next `todo` in SPRINT.md. 2. Complete any deferred VALIDATE steps now ready. 3. Context pressure check (see CONTEXT_CYCLE).

→ Cycle needed → CONTEXT_CYCLE. Next exists → EXECUTE. All `done` + all Post-Merge `pass`/`n/a` → COMPLETE. All `done` but any `pending` → execute those validations — **do not present sprint review**.

## COMPLETE

**Precondition:** Every SPRINT.md row Post-Merge must be `pass` or `n/a`. Any `pending` → STOP, return to VALIDATE. Do not present review/retrospective/archive.

1. Sprint review: completed issues + PR links, decisions, risk items + self-review outcomes, rework + resolution, summary.
2. `/aam-retrospective` for metrics.
3. Optional docs-only PR through pipeline.
4. **Wait for human acceptance.** Archive:
   ```
   S{n} archived ({date}): {planned} planned, {completed} completed, {rework} rework. {scope_changes} scope, {blocked} blocked. {summary}.
   <!-- sizing: {min}-{max} -->
   ```
5. "Sprint S{n} complete. Ready for next sprint when you are."

→ Next sprint requested → increment number → PLAN.

## BLOCKED

Any state → BLOCKED when: external dependency unavailable, missing credentials, ambiguous AC, debug checkpoint (3 failed attempts), test needs human action, pipeline escalation.

Update SPRINT.md to `blocked`. Notify human: what, why, what unblocks. Wait. → Human resolves → return to prior state.

## CONTEXT_CYCLE

Autonomous context management at NEXT transitions. Persists state, self-terminates, fresh session resumes (requires profile hook or sprint-runner).

**Primary signal:** Read `.context-usage` in the project root. If the file exists and `should_cycle` is `true`, cycle. Thresholds: 250k tokens Sonnet, 350k Opus, 35% unknown models.

**Fallback** (`.context-usage` absent — status line not configured): Cycle when ANY true: 3+ items completed this session | debug checkpoint triggered | rework executed. When in doubt, cycle.

**Steps (all required, in order):**

1. **Commit all work** — nothing uncommitted.
2. **Write `.sprint-continuation.md`:**
   ```markdown
   # Sprint Continuation State
   **Generated:** {ISO timestamp}
   **Reason:** {why}
   **Session items completed:** {count}
   ## Resume Point
   **Sprint:** S{n}  **Next:** S{n}-{seq}  **State:** EXECUTE  **Branch:** main
   ## Completed This Session
   {items with one-line status}
   ## Critical Context
   {2-5 bullets NOT in SPRINT.md/DECISIONS.md/spec — only what would be lost}
   ## Next Session
   1. Read SPRINT.md  2. TaskList  3. EXECUTE S{n}-{seq}  4. Continue autonomous
   ```
3. **Write `.sprint-continue-signal`** (empty file; existence = signal).
4. **Run `bash .claude/scripts/context-cycle.sh`** (finds CLI process, kills it; profile hook/sprint-runner catches signal and restarts).
5. **Fallback** if termination fails: tell user to `/exit` then run `claude "CONTEXT CYCLE: Read .sprint-continuation.md and resume sprint execution."`

**After cycle (new session receives `CONTEXT CYCLE:` prompt):** Read `.sprint-continuation.md` → `SPRINT.md` → `TaskList` → next spec → delete `.sprint-continuation.md` → resume EXECUTE.

## Cross-Session

- `SPRINT.md` persists via git. Tasks persist in `~/.claude/tasks/`. Resuming: read both, identify current state, continue.
- Specs preserved in git history (committed at APPROVE) — re-read if context lost.
- `/aam-handoff` is independent; don't modify SPRINT.md or tasks during handoff.
- `.sprint-continuation.md` and `.sprint-continue-signal` are ephemeral, gitignored.
- Restart requires profile hook (`install-profile-hook.ps1`) or sprint-runner. Without either, Claude tells user the command.

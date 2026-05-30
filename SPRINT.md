# SPRINT.md - Sprint Header

> Sprint scope and status. Loaded via @import each session when an active sprint exists.
> Individual issues are tracked as native Claude Code Tasks (persistent across sessions).
> Archived to git history when a sprint completes.
>
> **Post-Merge column:** `n/a` = no post-merge tests needed, `pending: {desc}` = awaiting validation,
> `pass` = validated, `fail` = failed (rework task created).

## Archive

S1 archived (2026-03-29): 7 planned, 5 completed, 2 deferred (S1-005 npm publish pending, S1-006 GH Actions blocked on PR #84 human review), 0 rework. 0 scope changes, 0 blocked (at completion). Shipped automated correction capture, stop hook enforcement, zero-token-cost scripts, cross-model review gate, README rewrite, v3.3.0 GitHub Release. Deferred release automation items to post-v4.0.
<!-- sizing: 5-7 -->

S2 archived (2026-03-30): 9 planned, 9 completed, 0 rework. 0 scope changes, 0 blocked. Shipped skills migration, 1M context cycling, negative test enforcement, UX friction lens, judge agent pass, setup auto-detection, SessionStart/StopFailure hooks, hooks schema fix. Closes v4.0 Tier 1; Tier 2 partial (custom subagents and rule compression deferred — subsumed by session profiles approach).
<!-- sizing: 5-7 -->

S3 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Shipped session profiles (5 agents, rule reorganization, sprint-runner --agent flag), backlog capture system (backlog-capture.sh, BACKLOG.md, /aam-backlog skill, integration touchpoints). 81 new tests (175→256). PRs #96-101.
<!-- sizing: 5-7 -->

S4 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.1.0 version bump + GitHub Release, migration integration tests, custom review subagents (5 agents), self-review agent architecture refactor, roadmap/README update. PRs #102-106.
<!-- sizing: 5-7 -->

S5 archived (2026-03-30): 7 planned, 7 completed, 0 rework. 0 scope changes, 0 blocked. Shipped deterministic sync CLI (lib/sync.js, lib/migrations.js, lib/settings-merge.js), CLI sync command, /aam-update rewrite (404→112 lines), plugin skill removal (13 packages), manifest consistency tests. 60 new tests (285→345). PRs #107-113.
<!-- sizing: 5-7 -->

S6 archived (2026-03-30): 5 planned, 5 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v4.2.0 release, /aam-setup CLI delegation (183→139 lines), roadmap/README update, v4.2 migration entry, e2e sync test (v3.3→v4.2 full upgrade path). 12 new tests (345→357). PRs #115-119.
<!-- sizing: 5-7 -->

S7 archived (2026-03-30): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Fixed init --force data-loss bug (settings.json merge), stale debug-checkpoint/PROGRESS.md references, added jq dependency check to sync/init, pruned 82 remote + 51 local stale branches, updated README rules table for v4.1 session profiles. 63 new tests (357→420). PRs #122, #124–127.
<!-- sizing: 5-7 -->

S8 archived (2026-05-06): 10 planned, 10 completed, 0 rework. 0 scope changes, 0 blocked. Shipped v5.0-pre orchestrator architecture: sprint-master state-machine router, 6 phase agents (sprint-planner, sprint-speccer, item-executor, quality-reviewer, pr-pipeliner, sprint-retro), 5 review lens sub-agents, sprint-metrics collection, integration test suite, v4.2→v5.0 migration. sprint-executor removed in #142. PR #143 (v4.3.0 quality-gate hardening) shipped as interim release; v5.0 cut deferred to S9. Sprint sized at 10 (oversized — pre-approved); recommend S9 returns to 5-7.
<!-- sizing: 5-7 -->

S9 archived (2026-05-07): 6 planned, 6 completed, 0 rework. 0 scope changes, 0 blocked. Shipped context cycling robustness fixes (F1–F6) addressing the dungeon-game 2026-05-06 work-loss incident: SessionStart cycle reset (F1), status-line warmup hysteresis (F2), resume-chain dual-matcher (F3), sprint-state gating (F4), Edit allowed during cycle (F5), F6 resolved as consequence. New ADR "Context cycling: sprint-gated with session-relative thresholds." 57 new tests (510→567). PRs #154–159, plus opportunistic merge of stale #153 (manifest drift) with conflict resolution.
<!-- sizing: 5-6 -->

---

**Sprint:** S10 — Sprint workflow ergonomics: Tasks-first state + smart lens dispatch
**Status:** in-progress
**Phase:** EXECUTE
**Issues:** 5 proposed

| ID | Title | Type | Risk | Status | Post-Merge |
|---|---|---|---|---|---|
| S10-001 | Tasks-first status refactor — sprint-workflow.md + sprint-master.md | feature | | todo | n/a |
| S10-002 | Prune sprint-update.sh status subcommand + tests | chore | | todo | n/a |
| S10-003 | templates/SPRINT.md — remove Status column | chore | | todo | n/a |
| S10-004 | Content-type lens selection in sprint-master TEST phase | feature | | todo | n/a |
| S10-005 | self-review skill — lens ownership clarification + tests | chore | | todo | n/a |

---

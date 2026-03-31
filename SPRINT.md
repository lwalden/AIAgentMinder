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

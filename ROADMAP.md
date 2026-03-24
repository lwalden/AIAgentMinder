# Roadmap

This document tracks future direction. The backlog has full acceptance criteria for unscheduled items.

---

## v1.0 — Governance Maturity (shipped)

All v1.0 features have been implemented and merged. See [CHANGELOG.md](CHANGELOG.md) for details.

**Shipped:** `/aam-checkup` command, `/aam-scope-check` command, `approach-first.md` rule, `debug-checkpoint.md` rule, complexity budget in `/aam-milestone`, technical debt tracker (Known Debt in DECISIONS.md), risk-flagged issues in sprint planning, adaptive sprint sizing formalization, PROGRESS.md pruned, `/aam-handoff` refactored, CLAUDE.md context budget simplified.

## v1.1 — Command Prefix + Housekeeping (shipped)

**Shipped:** All commands renamed with `aam-` prefix to avoid collision with Claude Code built-in commands and other plugins. Docs reviewed and updated for accuracy. Analysis docs archived. Examples modernized.

---

## v1.2 — `/aam-revise` (shipped)

**Shipped:** Mid-stream plan revision command. Add, change, drop, or reprioritize features directly in `docs/strategy-roadmap.md` with decision logging and active sprint impact checks.

---

## v1.3 — Backlog Clearance (shipped)

**Shipped:** Roadmap versioning (`## Roadmap History` table + `/aam-revise` logging), GitHub Issues bridge (`/aam-sync-issues` optional command), missing skill packages for `aam-checkup` and `aam-scope-check`.

---

## v1.4.1 — Tool-First Autonomy (current)

- **`tool-first.md` rule** (always active) — Directs Claude to use CLI tools, APIs, and package managers instead of asking the user to perform actions manually. CLAUDE.md Autonomy Boundaries updated to reference it.

---

## v1.4 — Development Methodology Skills (shipped)

Three new skills adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), reshaped for AIAgentMinder conventions:

- **`/aam-tdd`** — Guided TDD workflow (plan, tracer bullet, incremental RED-GREEN loop, refactor). Complements `code-quality.md`'s one-liner with the full methodology.
- **`/aam-triage`** — Structured bug triage: reproduce, diagnose root cause, design durable fix plan, create GitHub issue. Complements `debug-checkpoint.md` (triage = structured start, checkpoint = structured pause).
- **`/aam-grill`** — Plan interrogation: walk every branch of the decision tree before implementation. Intensive counterpart to `approach-first.md`.

---

## v1.5 — Correction Capture

- **`correction-capture.md` rule** (default-on) — Instructs Claude to self-monitor for repeated wrong-first-approach patterns within a session. When the same correction recurs, flags it and proposes a permanent `.claude/rules/` instruction for user approval. Complement to `debug-checkpoint.md` (which catches error spirals).
- **`default-on` update category** — New file taxonomy category in `/aam-update`: installed by default during `/aam-setup`, but treated as optional during `/aam-update` (overwrite if present; prompt if absent). Respects user deletion.

---

## v2.0 — Autonomous PR Pipeline

- **`/aam-pr-pipeline` skill** — Autonomous review-fix-test-merge pipeline for PRs. Reviews with full repo context (not just the diff), evaluates each issue with a developer perspective, applies fixes, runs the test suite, waits for external CI checks, and auto-merges when everything is green. Escalates to the user via email or PR label for high-risk files, cycle limit, blocked tests, or unresolvable merge blockers.
- **`pr-pipeline-trigger.js` hook** — PostToolUse hook that detects `gh pr create` output and spawns a background `claude -p` in an isolated git worktree. The pipeline runs autonomously without blocking the active Claude Code session.
- **`.pr-pipeline.json` config template** — Per-repo configuration for high-risk file patterns, cycle limit, auto-merge preference, merge method, notification email, and external check timeout.
- **Sprint workflow integration** — `sprint-workflow.md` updated so the post-PR flow proceeds to the next issue without waiting for manual merge confirmation when the pipeline is installed.

---

## Post-v1.4 Direction

AIAgentMinder is stable as a project governance layer for single-agent Claude Code sessions. Remaining future work:

1. **Reducing overhead** — evaluating whether the compact-reorient.js hook is still needed as Claude Code's native context handling improves
2. **Distribution improvements** — `/aam-update` dry-run mode
3. **HTTP hook support** — replacing Node.js dependency with Claude Code's HTTP hooks

---

## Backlog (unscheduled)

- **Evaluate compact-reorient.js necessity** — As Claude Code's native Session Memory and context handling improve, the post-compaction sprint reorientation hook may become redundant. Test whether removing it degrades sprint continuity; if not, drop the Node.js dependency.
- **`/aam-update` dry-run mode** — Show what would change before committing to the migration.
- **HTTP hook support** — Leverage Claude Code's HTTP hooks for integrations without requiring Node.js.

### Dropped

- **`/aam-handoff` JSON digest** — Speculative value for the target audience. Nobody has asked for it.
- **`/onboard` command** — The existing `/aam-brief` Starting Point E (existing project audit) covers this use case adequately. A separate command would duplicate effort.

---

*Items move from backlog → versioned milestone when they have acceptance criteria and are ready to implement.*

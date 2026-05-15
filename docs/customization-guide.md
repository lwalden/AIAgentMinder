# Customization Guide

## Essential Customizations

Before starting development, customize these files (or let `/aam-setup` do it):

### 1. `CLAUDE.md` -- Project Identity Section

Replace the placeholder block with your actual project info:
```markdown
**Project:** my-app
**Description:** A task management tool for remote teams
**Type:** web-app
**Stack:** TypeScript / Next.js / PostgreSQL / Vercel
**MCP Servers:** postgres (db queries)

**Developer Profile:**
- Senior developer, comfortable with TypeScript and React
- Medium risk tolerance
```

### 2. `docs/strategy-roadmap.md` -- Your Project Plan

Run `/aam-brief` to fill it interactively, or edit manually. At minimum, fill in:
- What & Why (problem, vision, users)
- MVP Features with acceptance criteria
- Technical Stack choices

---

## Optional Features

### Code Quality Guidance

A small set of development discipline instructions loaded natively at every session start. Covers TDD cycle, build-before-commit, small focused functions, and read-before-write.

**Enabled by default** during `/aam-setup` and `/aam-brief`.
**Disable:** Delete `.claude/rules/code-quality.md` from your project.

The file lives at `.claude/rules/code-quality.md` and is overwritten by `/aam-update` to stay current. Claude Code loads all `.md` files in `.claude/rules/` natively — no hooks needed.

### Sprint Planning

A structured development workflow where Claude decomposes phase work into discrete issues, presents them for your review, then works them one-by-one with per-issue PRs. Sprint state is tracked in `SPRINT.md`, which is loaded via `@import` in CLAUDE.md when a sprint is active.

**How sprints are scoped**

A sprint in AIAgentMinder is not a time-boxed agile sprint — there's no two-week clock. A sprint is a coherent subset of a phase's work, typically 4–7 issues. Claude reads the phase's features and acceptance criteria from `docs/strategy-roadmap.md`, groups related work into a first sprint, and defers the rest to subsequent sprints. Multiple sprints per phase is normal for any non-trivial phase. Scope is bounded by thematic coherence and issue count, not by a calendar. When Claude presents the proposed sprint, it notes what phase work is deferred so you have the full picture before approving.

**Full lifecycle:**
1. Tell Claude "start a sprint" or "begin Phase 1"
2. Claude reads the roadmap, proposes issues with acceptance criteria — waits for your approval
3. Claude writes detailed implementation specs per item (approach, test plan, post-merge validation) — waits for your approval
4. Claude executes items autonomously in sequence: TDD, full test suite, quality gate, self-review, PR pipeline — no permission prompts between items
5. Post-merge validation runs; failures create rework tasks within the sprint
6. Sprint ends when all items pass quality gates, review, merge, and validation
7. Claude presents a sprint review; you accept → sprint is archived to git history
8. Start the next sprint

**Blocked issues and user interaction**

When Claude cannot complete an issue — missing information, an unresolved dependency, or a decision that requires your input — it marks the issue `blocked` in `SPRINT.md` and notifies you with a clear description of what's needed. Claude does not skip ahead to the next issue or make assumptions to work around the block. It stops and waits.

You resolve the block (answer the question, provide the missing resource, make the decision), then tell Claude to continue. Blocked issues don't invalidate the sprint — the sprint resumes once the blocker is cleared.

**End of sprint**

A sprint ends when every issue is `done`. Claude presents a sprint review: completed issues with PR links, decisions logged to `DECISIONS.md`, a plain-language summary of what was accomplished, and what the next sprint might address. On acceptance, Claude archives the sprint — the active `SPRINT.md` content is replaced with a single summary line, preserved in full in git history. You can then ask to begin the next sprint.

**Enabled by default** during `/aam-setup` and `/aam-brief`.
**Disable:** Delete `.claude/rules/sprint-workflow.md`. SPRINT.md can be left or removed.

Sprint workflow instructions live in `.claude/rules/sprint-workflow.md` (overwritten by `/aam-update`). Sprint state lives in `SPRINT.md` (user-owned; `/aam-update` never overwrites an active sprint).

---

## Optional Customizations

### Risk Tolerance (in CLAUDE.md)
- **Conservative:** Claude asks before most decisions, smaller PRs
- **Medium:** Claude makes routine decisions autonomously, asks for architectural choices
- **Aggressive:** Claude makes most decisions autonomously, asks only for major pivots

### CI/CD

Generated on-demand, not scaffolded upfront:
```
Tell Claude: "Set up GitHub Actions CI for this project."
```

### MCP Servers

1. Configure in Claude Code workspace settings
2. Add `**MCP Servers:**` line to CLAUDE.md Project Identity
3. Claude will use MCP tools instead of shell commands for those tasks

### Hooks

One hook script (Node.js, cross-platform) in `.claude/hooks/`, configured in `.claude/settings.json`. Requires Node.js to run.

| Hook | Event | Script | What It Does |
|------|-------|--------|-------------|
| Sprint reorientation | SessionStart (compact) | `compact-reorient.js` | Outputs sprint summary after context compaction |

**Prerequisite:** Node.js must be installed for hooks to work.

**Disable a hook:** Remove its entry from `hooks` in `.claude/settings.json`.

**Add a custom hook:** Add a new entry to `settings.json` and create the script in `.claude/hooks/`. See the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks) for the full event list and JSON input format.


### Context Cycling (Sprint Sessions)

Scripts in `.claude/scripts/` enable automatic context cycling during long sprint sessions. When Claude detects context pressure, it persists state and self-terminates. A restart mechanism catches the exit and starts a fresh session automatically.

**One-time setup (recommended):**

```powershell
# Windows (PowerShell)
.\.claude\scripts\install-profile-hook.ps1
. $PROFILE
```

```bash
# macOS / Linux
bash .claude/scripts/install-profile-hook.sh
source ~/.bashrc  # or ~/.zshrc
```

**Alternative: Wrapper script (for dedicated sprint sessions):**

```powershell
# Windows
.\.claude\scripts\sprint-runner.ps1 -Prompt "plan and start a sprint for phase 2"
```

```bash
# macOS / Linux
bash .claude/scripts/sprint-runner.sh "plan and start a sprint for phase 2"
```

The profile hook is recommended because it works regardless of how you start Claude — even if you begin with a planning conversation and only later start a sprint.

**Platform:** Cross-platform. Windows uses PowerShell hooks + Git Bash WMI tracing. macOS/Linux uses bash/zsh hooks + native `ps` ppid tracing.

### Custom Slash Commands

Create `.claude/commands/your-command.md` files for project-specific workflows:
- `/deploy-staging` -- deployment steps
- `/db-migrate` -- database migration workflow
- `/release` -- release checklist

---

## Native Claude Code Features Worth Knowing

These ship in Claude Code itself — no AAM configuration required. They pair
well with AAM but are entirely opt-in. AAM is designed for solo and small-team
use; these features are equally appropriate at that scale.

### Minimum Claude Code Version

AAM v4.6+ relies on several Claude Code features that landed in May 2026:

- **Agent worktree isolation** with `worktree.baseRef` (2.1.121+) — sprint items
  run in isolated git worktrees off `origin/<default-branch>` so they don't
  collide with each other or with your in-progress work in the main worktree.
- **Auto Memory** (2.1.59+) — supersedes the retired AAM correction-capture.

Use Claude Code 2.1.139 or newer. Older versions will still work for everything
except worktree-isolated sprint items (sprint-master falls back to in-place
execution if the Agent tool rejects `isolation: "worktree"` — your tests still
gate the merge, but parallelism is reduced).

Known issue: [anthropics/claude-code#47548](https://github.com/anthropics/claude-code/issues/47548)
— under specific conditions, `isolation: "worktree"` has historically been
observed to switch the parent worktree's branch rather than create an isolated
one. If you hit this, file a bug upstream and disable worktree mode by
removing `isolation: "worktree"` from sprint-master's item-executor spawn block.

### Worktree base ref

Claude Code's `worktree.baseRef` setting (in `~/.claude/settings.json`)
controls where new worktrees branch from:

```json
{ "worktree": { "baseRef": "fresh" } }
```

- `fresh` (default, **recommended for sprints**) — branches off
  `origin/<default-branch>`. Keeps unpushed commits out of new items, so a
  half-done feature on `main` in your main worktree doesn't leak into the
  next sprint item.
- `head` — branches off local `HEAD`. Use only when you specifically want
  the worktree to inherit your current state.


### `/less-permission-prompts`

Native command that scans your recent transcripts for routine read-only Bash
and MCP calls, then proposes an allowlist for `.claude/settings.json`. Useful
after `/aam-setup` to tune permissions to AAM's tool footprint (lots of `git`,
`gh`, `jq`, `bash .claude/scripts/...` calls).

Run it once after install, accept the prompts that match your comfort level,
and the noise drops noticeably.

### `skillOverrides` setting

Opt-in setting in `~/.claude/settings.json` (or project-level) that lets you
hide bundled skills from the model:

```json
{
  "skillOverrides": {
    "aam-grill": "user-invocable-only",
    "aam-milestone": "off"
  }
}
```

Modes: `off` (hides from model and `/`), `user-invocable-only` (you can still
type `/aam-grill`, but Claude won't suggest it), `name-only` (description
collapsed). Useful if a specific AAM skill consistently activates when you
don't want it.

### `/goal` for autonomous sprint runs

Claude Code's native `/goal` command (2.1.139+) sets a completion condition
and auto-resumes turns until a small-model evaluator declares the condition
met. Useful when you want to kick off a sprint and come back later instead
of approving each turn.

**Recommended pattern** for solo execution:

```
/goal "complete sprint S5: every item merged via pr-pipeliner, sprint marked
COMPLETE in SPRINT.md, no items blocked or in rework"

claude --agent sprint-master
```

Or, more common in practice — run interactively up through the SPEC approval
checkpoint, then issue `/goal` once specs are approved so the execute-through-
merge loop runs unattended.

**How it interacts with AAM's enforcement layer:**

- Sprint-master's Stop hook and human checkpoints are unchanged — when
  sprint-master writes `.sprint-human-checkpoint` (PLAN, SPEC, COMPLETE) and
  ends the turn, `/goal`'s evaluator reads "waiting for human" and stops
  resuming. Your approval is still required at the gates AAM was designed
  around.
- BLOCKED and REWORK still escalate to you the same way. `/goal` cannot
  bypass these because sprint-master explicitly ends the turn after writing
  the blocker report; the evaluator sees the escalation language and stops.
- After your approval, just keep typing — `/goal` is still active for the
  session and will resume driving the loop forward.

**Difference from AAM's dispatch mode:** dispatch mode (`.exec/directive.md`)
is for executive-layer orchestration (HLPM-style: status files, history
audit, cancellation polling). `/goal` is a lightweight alternative for solo
developers — no directive file, no status file, just a completion condition.
Pick dispatch mode when you need the audit trail; pick `/goal` for everyday
"finish this sprint while I'm at lunch."

### Auto Memory

Claude Code records build commands, debugging insights, and repeated mistake
patterns automatically across sessions (v2.1.59+). AAM previously shipped a
custom `correction-capture` rule and hook for this; both were retired in
v4.6.0 because Auto Memory subsumes the value cleanly.

### `/recap` and resume

Two session-resume patterns both work with AAM:

- `claude --resume <session>` — native session picker with full or compacted
  resume modes. AAM does nothing to interfere.
- "resume working" prompt on a fresh `claude` — AAM's
  `session-start-continuation.sh` hook injects `.sprint-continuation.md` if
  the prior session ended under context pressure during an active sprint,
  pointing Claude back at SPRINT.md.

If you ran `/aam-handoff` at the end of the prior session, your "Next Session"
priorities also live in Claude's native Auto Memory and are recalled
automatically.

---

## Upgrading AIAgentMinder

When a new version of AIAgentMinder is released, run `/aam-update` from the AIAgentMinder repo (not from your project). It performs a safe in-place upgrade:

**Overwritten (AIAgentMinder-owned):**
- `.claude/hooks/compact-reorient.js`
- `.claude/scripts/*` (context-cycle.sh, sprint-runner.ps1/.sh, install-profile-hook.ps1/.sh)
- `.claude/settings.json` (hook configuration)
- `.claude/commands/aam-brief.md`, `aam-revise.md`, `aam-handoff.md`, `aam-checkup.md`, `aam-quality-gate.md`, `aam-scope-check.md`, `aam-self-review.md`, `aam-pr-pipeline.md`, `aam-tdd.md`, `aam-triage.md`, `aam-grill.md`, `aam-milestone.md`, `aam-retrospective.md`, `aam-sync-issues.md`
- `.claude/rules/git-workflow.md`, `scope-guardian.md`, `approach-first.md`, `debug-checkpoint.md`, `tool-first.md`
- `.pr-pipeline.json`

**Overwritten if present, prompted if absent (optional features):**
- `.claude/rules/code-quality.md`
- `.claude/rules/sprint-workflow.md`
- `.claude/rules/architecture-fitness.md`

**Surgically merged:**
- `CLAUDE.md` — Behavioral Rules and Context Budget sections are updated; your Project Identity and MVP Goals blocks are preserved

**Protected (user-owned):**
- `DECISIONS.md`, `docs/strategy-roadmap.md`, `.gitignore`
- `SPRINT.md` — never overwritten if an active sprint exists

All version migrations are handled automatically by `/aam-update`. After updating, it writes a version stamp to `.claude/aiagentminder-version` and commits the changes in your project.

---

## Tips

1. **Be specific in strategy-roadmap.md** -- More context = better decisions
2. **Run `/aam-handoff` before ending sessions** -- Writes priorities to auto-memory so the next session resumes cleanly
3. **Use DECISIONS.md for significant choices** -- Prevents re-debating; add `@DECISIONS.md` to CLAUDE.md to auto-load
4. **Prefer smaller PRs** -- Easier to review, less risk
5. **Generate CI/CD from real code** -- Wait until the project has actual code
6. **Sprint approval is mandatory** -- Claude always waits for your go-ahead before starting sprint work

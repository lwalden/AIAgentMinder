# Customization Guide

## Essential Customizations

Before starting development, customize these files (or let `/aiagentminder:setup` do it):

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

Run `/aiagentminder:brief` to fill it interactively, or edit manually. At minimum, fill in:
- What & Why (problem, vision, users)
- MVP Features with acceptance criteria
- Technical Stack choices

---

## Quality and Sprint Execution

### Code Quality

The standalone `.claude/rules/code-quality.md` rule was retired in v4.x. Code-quality enforcement now lives in agents and hooks rather than a rule file:

- **`item-executor`** (the EXECUTE-phase agent) mandates TDD and runs the full test suite before declaring an item done.
- **`quality-reviewer`** runs the quality gate during the sprint REVIEW phase: build, tests, coverage, lint, security.
- **`/aiagentminder:quality-gate`** invokes the same checks on demand outside a sprint.
- **`dev`** and **`qa`** session profile agents carry code-quality instructions in their agent definitions for ad-hoc work outside sprints.

There is no opt-out switch — these are agent-internal, not a separate file. If you don't want them, don't dispatch the agents.

### Sprint Execution

The standalone `.claude/rules/sprint-workflow.md` rule was retired in the v5.0 orchestrator rework. The workflow is now driven by the `sprint-master` sub-agent, which Claude auto-dispatches when you say "start a sprint" or "begin Phase 1."

**How sprints are scoped**

A sprint in AIAgentMinder is not a time-boxed agile sprint — there's no two-week clock. A sprint is a coherent subset of a phase's work, typically 4–7 issues. `sprint-planner` (the PLAN-phase agent) reads the phase's features and acceptance criteria from `docs/strategy-roadmap.md`, groups related work into a first sprint, and defers the rest to subsequent sprints. Multiple sprints per phase is normal for any non-trivial phase. Scope is bounded by thematic coherence and issue count, not by a calendar.

**Full lifecycle** (run by `sprint-master`'s state machine):

1. **PLAN** — `sprint-planner` proposes issues with acceptance criteria; waits for your approval.
2. **SPEC** — `sprint-speccer` writes detailed implementation specs per item (approach, test plan, post-merge validation); waits for your approval.
3. **EXECUTE / TEST / REVIEW / MERGE** (per item, in an isolated git worktree) — `item-executor` runs TDD and the full test suite; `quality-reviewer` runs the quality gate; PR pipeline merges. No permission prompts between items.
4. **VALIDATE** — post-merge validation runs; failures create rework tasks within the sprint.
5. **COMPLETE** — sprint archived to git history.

Phase boundaries are mechanically enforced by `sprint-phase-guard.sh` (PreToolUse, `matcher: "Agent"`) — sub-agents dispatched out of phase order are blocked at the tool layer, not just gently reminded.

**Blocked issues and user interaction**

When an item-executor cannot complete an issue — missing information, an unresolved dependency, or a decision that requires your input — sprint-master marks the issue `blocked` in `SPRINT.md` and notifies you with a clear description of what's needed. It does not skip ahead or make assumptions to work around the block.

You resolve the block, then tell Claude to continue. Blocked issues don't invalidate the sprint — the sprint resumes once the blocker is cleared.

**End of sprint**

A sprint ends when every issue is `done`. `sprint-master` presents a sprint review: completed issues with PR links, decisions logged to `DECISIONS.md`, a plain-language summary of what was accomplished, and what the next sprint might address. On acceptance, the sprint archives to git history — the active `SPRINT.md` content is replaced with a single summary line, preserved in full in git history. You can then ask to begin the next sprint, or invoke `/aiagentminder:retrospective` for sprint metrics first.

**Sprint state lives in `SPRINT.md`** (user-owned; `/aiagentminder:setup` never overwrites an active sprint).

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

The plugin ships hooks in `hooks/hooks.json` and registers them automatically
when enabled. No manual `settings.json` edits required.

| Hook | Event | Script | What It Does |
|------|-------|--------|-------------|
| Context monitor | statusLine | `context-monitor.sh` | Writes `.context-usage` with token thresholds; status line bridge |
| Context warning | Stop | `context-warning-hook.sh` | Injects an advisory warning when `.context-usage` says we're over threshold (v5.1+) |
| Sprint phase guard | PreToolUse (matcher: Agent) | `sprint-phase-guard.sh` | Blocks Agent calls that don't match SPRINT.md Phase |
| Sprint phase reminder | Stop | `sprint-phase-reminder.sh` | Per-turn phase-appropriate reminder during an active sprint (v5.1+) |
| Sprint stop guard | Stop | `sprint-stop-guard.sh` | Blocks premature turn endings during sprint execution |
| Session start cycle reset | SessionStart | `session-start-cycle-reset.sh` | Wipes stale `.context-usage` so resumed sessions get a fresh threshold |
| Session start sprint detect | SessionStart | `session-start-hook.sh` | Detects active sprint and surfaces a one-line reminder |
| Stop failure | StopFailure | `stop-failure-hook.sh` | Logs API errors and preserves sprint state |
| HLPM ping | SessionStart, SessionEnd | `hlpm-ping.sh` | Notifies optional HLPM executive layer of session lifecycle |

**Prerequisite:** Bash (Windows users need Git Bash or WSL). No Node.js
required for hooks.

**Disable a hook:** Use `/plugin disable aiagentminder@lwalden-aiagentminder`
to disable the whole plugin, or fork the plugin and edit `hooks/hooks.json`.
Individual hooks aren't separately toggleable.

**Add a custom hook:** Add an entry under `hooks` in your project's
`.claude/settings.json` (project-level hooks compose with plugin hooks).
See the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
for the full event list and JSON input format.


### Context Warnings (v5.1+)

When context usage crosses the threshold, a Stop-hook injects an
advisory warning at the end of the assistant turn. The warning is
passive: no tools are blocked, no continuation file is written, and the
session is not auto-restarted. Two paths:

- **Wrap up:** run `/aiagentminder:handoff` (writes the "Next Session"
  block into Claude Code's native Auto Memory), commit any work, then
  `/exit`. Resume with "resume work" in the next session.
- **Keep going:** the warning re-fires next turn while you remain over
  threshold.

Earlier versions tried to enforce a cycle protocol (block tools, write
`.sprint-continuation.md`, self-terminate). v5.1 retired that because it
fought Claude Code's native context behavior and didn't work reliably
when monitoring sessions from the mobile app.

If you'd prefer a wrapper that auto-restarts Claude in a tight loop for
dedicated sprint sessions:

```bash
# macOS / Linux
sprint-runner.sh "plan and start a sprint for phase 2"
```

```powershell
# Windows (PowerShell)
sprint-runner.ps1 -Prompt "plan and start a sprint for phase 2"
```

The wrapper scripts are on the Bash tool's PATH while the plugin is
enabled (Claude Code adds `bin/` from any installed plugin to PATH).

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
after `/aiagentminder:setup` to tune permissions to AAM's tool footprint (lots of `git`,
`gh`, `jq`, and `bash` calls to plugin-installed scripts on PATH).

Run it once after install, accept the prompts that match your comfort level,
and the noise drops noticeably. AAM's plugin-installed bin scripts run
under `bash <name>.sh ARGS` from the Bash tool, so allowlisting `bash`
broadly is the simplest tuning.

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
type `/aiagentminder:grill`, but Claude won't suggest it), `name-only` (description
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
- "resume work" prompt on a fresh `claude` — Claude Code's native Auto
  Memory carries the "Next Session" block forward (populated by
  `/aiagentminder:handoff`). AAM's `session-start-hook.sh` also surfaces
  a one-line reminder if SPRINT.md shows an in-progress sprint.

If you ran `/aiagentminder:handoff` at the end of the prior session, your "Next Session"
priorities also live in Claude's native Auto Memory and are recalled
automatically.

---

## Upgrading AIAgentMinder

AIAgentMinder ships as a Claude Code plugin. Plugin code (agents, skills,
hooks, scripts) is updated by Claude Code's plugin system — by default
auto-update is enabled for the official marketplace and disabled for
third-party marketplaces (toggle via `/plugin` → Marketplaces → Enable
auto-update).

Manual update:

```
/plugin marketplace update lwalden-aiagentminder
/reload-plugins
```

Refreshing project-level templates (rules and version stamp) after a
plugin update — run inside your project:

```
/aiagentminder:setup
```

`/aiagentminder:setup` detects an existing install via the version stamp
at `.claude/aiagentminder-version`. It refreshes AIAgentMinder-managed
files (`.claude/rules/*`, `.claude/aiagentminder-version`) and leaves
user-owned files alone.

**Refreshed (AIAgentMinder-managed):**
- `.claude/rules/git-workflow.md`, `tool-first.md`, `context-warnings.md`
- `.claude/aiagentminder-version`

**Protected (user-owned, never overwritten):**
- `CLAUDE.md` (your project identity)
- `DECISIONS.md`, `BACKLOG.md`, `docs/strategy-roadmap.md`
- `SPRINT.md` (never overwritten if an active sprint exists)
- `.gitignore` (only augmented additively)

**Distributed by the plugin (no copy step needed):**
- Skills (`/aiagentminder:brief`, `/aiagentminder:tdd`, ...)
- Agents (sprint-master, item-executor, ...)
- Hooks (registered automatically via `hooks/hooks.json`)
- Scripts (`sprint-update.sh`, `decisions-log.sh`, ...) — on the
  Bash tool's PATH while the plugin is enabled

### Migrating from a pre-v5.0 npm install

If you previously ran `npx aiagentminder init`:

1. **Remove the npm CLI** (optional, no longer used):

   ```
   npm uninstall -g aiagentminder
   ```

2. **Install the plugin** (one-time per Claude Code install):

   ```
   /plugin marketplace add lwalden/AIAgentMinder
   /plugin install aiagentminder@lwalden-aiagentminder
   ```

3. **Refresh the project** (one-time per project):

   ```
   /aiagentminder:setup
   ```

   This detects the v4.x install, bumps `.claude/aiagentminder-version`
   to 5.0, refreshes `.claude/rules/`, and leaves your other files
   intact.

4. **Update local references** to `/aam-X` commands to
   `/aiagentminder:X` in any docs or scripts you wrote.

5. **(Optional) Remove old script and command files** that the npm
   installer copied to your project — they no longer do anything since
   hooks and scripts now live in the plugin install:

   ```bash
   rm -rf .claude/scripts/ .claude/hooks/ .claude/commands/aam-*.md
   ```

   Keep `.claude/rules/`, `.claude/agents/` (if you have custom
   project-level agents), and `.claude/settings.json` (custom hooks).

---

## Tips

1. **Be specific in strategy-roadmap.md** -- More context = better decisions
2. **Run `/aiagentminder:handoff` before ending sessions** -- Writes priorities to auto-memory so the next session resumes cleanly
3. **Use DECISIONS.md for significant choices** -- Prevents re-debating; add `@DECISIONS.md` to CLAUDE.md to auto-load
4. **Prefer smaller PRs** -- Easier to review, less risk
5. **Generate CI/CD from real code** -- Wait until the project has actual code
6. **Sprint approval is mandatory** -- Claude always waits for your go-ahead before starting sprint work

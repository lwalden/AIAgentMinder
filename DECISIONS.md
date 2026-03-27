# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.
> Not auto-loaded. Add `@DECISIONS.md` to CLAUDE.md to auto-load.
>
> **When to log:** command/rule design choices, hook architecture, install mechanism changes, naming conventions.

---

## Format: Lightweight

```
### [Title] | Date | Status: Active
Chose: [X] over [alternatives considered]. Why: [rationale]. Tradeoff: [what you gave up].
```

---

### Sprint continuation counter via HTML comment in SPRINT.md | 2026-03 | Status: Active

Chose: `<!-- ai-continues: N -->` HTML comment written directly into SPRINT.md at runtime over tracking via PR labels or a separate state file. Why: self-contained with no external dependencies, survives worktree removal, is invisible in rendered markdown, and resets naturally when the sprint is archived. Counter is NOT committed — it is ephemeral state that controls runaway protection within a single sprint execution. Tradeoff: if SPRINT.md is reset by hand mid-sprint, the counter resets too (acceptable — manual sprint intervention implies human oversight).

---

### nohup + disown spawn pattern for continuation agent | 2026-03 | Status: Active

Chose: `nohup claude -p ... >> log 2>&1 & disown $!` over Node.js `spawn({detached: true})` or a separate trigger script for spawning the continuation agent. Why: the continuation is spawned from inside a `claude -p` bash invocation (not a Node.js hook), so `nohup`/`disown` is the natural detach mechanism. Running in the main repo root (`cd $REPO_ROOT`) ensures the continuation agent has the correct working directory for git operations. Tradeoff: `nohup` is not available on Windows natively, but the pipeline already runs in bash (git bash or WSL) and uses other bash-only patterns throughout.

---

### PostToolUse hook over webhook-only for PR pipeline trigger | 2026-03 | Status: Active

Chose: PostToolUse hook on `Bash` detecting `gh pr create` output to spawn background `claude -p` in a worktree over relying solely on GitHub webhook → n8n → spawn. Why: the hook path eliminates n8n as a dependency for the primary use case (PRs created from Claude Code sessions), removes the cloudflare tunnel dependency, reduces latency, and keeps pipeline logic in AIAgentMinder where it's version-controlled alongside governance rules. The n8n webhook path is retained as a fallback for PRs created outside Claude Code. Tradeoff: two trigger paths to maintain; hook depends on `claude -p` being available with the user's active Claude subscription.

---

### Autonomous context cycling via self-kill + profile hook | 2026-03 | Status: Active

Chose: Process self-termination (`taskkill` via `/proc/$$/winpid` → WMI trace → `claude.exe`) with PowerShell prompt hook restart over (a) subagent-per-item (loses interactive flow), (b) `RemoteTrigger` chaining (server-side, loses terminal env), (c) manual handoff only. Why: The profile hook fires when the shell prompt renders after Claude dies — same terminal, same env vars (BW_SESSION, etc.), zero human intervention. Works whether Claude was started via wrapper or directly. Tradeoff: Windows-only for self-kill (Git Bash `/proc/$$/winpid` + WMI). Continuation file + manual resume work cross-platform. The `taskkill` is a hard kill — no exit hooks fire, so all state must be persisted before the kill. First cycle in a non-wrapper session requires one user action (type `/exit`) only if the profile hook isn't installed.

---

### aam- command prefix | 2025-11 | Status: Active

Chose: `aam-` prefix for all commands over unprefixed names (e.g., `/handoff`, `/milestone`). Why: Claude Code ships built-in commands (`/plan`, `/doctor`, `/review`) and other plugins use short names — collisions break silently. `aam-` is a namespace that cannot collide. Tradeoff: slightly more typing for users.

---

### rules/ over guidance/ | 2025-10 | Status: Active

Chose: `.claude/rules/` directory name over `.claude/guidance/`. Why: Claude Code natively auto-loads all `.md` files from `.claude/rules/` without any hook configuration. The `guidance/` name required hooks to load files. Switching to `rules/` eliminated a hook entirely. Tradeoff: none meaningful.

---

### compact-reorient.js fires on compact only | 2025-10 | Status: Active

Chose: compact matcher (post-compaction only) over SessionStart for the sprint reorientation hook. Why: Firing on every SessionStart added noise to sessions that didn't need reorientation. The only session where sprint context is truly lost is after context compaction. Tradeoff: sprint reorientation won't fire on fresh sessions — acceptable because fresh sessions have full history.

---

### Stop hook removed | 2025-08 | Status: Active

Chose: remove auto-commit Stop hook and replace with `git-workflow.md` rule over keeping the hook. Why: the hook committed on session end regardless of intent, creating noise commits. `git-workflow.md` encodes the same discipline as a behavioral rule — Claude follows it without automation. Tradeoff: relies on Claude following the rule rather than enforcement.

---

### No AGENTS.md, single-agent only | 2025-10 | Status: Active

Chose: single-agent Claude Code sessions over multi-agent (AGENTS.md / Copilot layer). Why: AIAgentMinder targets solo developers using Claude Code. Multi-agent coordination adds complexity that the target audience doesn't need. Tradeoff: not applicable to team/multi-agent setups (by design).

---

### PROGRESS.md pruned | 2025-10 | Status: Active

Chose: remove PROGRESS.md entirely over keeping it as a session continuity file. Why: Claude Code's native Session Memory and `--continue` flag handle cross-session continuity. PROGRESS.md was maintenance overhead with no unique value. Tradeoff: none; native tooling is strictly better for this use case.

---

### Commands split: meta vs installed | 2025-11 | Status: Active

Chose: keep `aam-setup.md` and `aam-update.md` in the repo root `.claude/commands/` (meta-commands) while all other commands live in `project/.claude/commands/` (installed to targets). Why: setup and update commands operate on the AIAgentMinder repo itself — they don't belong in target projects. All governance commands (`aam-brief`, `aam-handoff`, etc.) belong to the target. Tradeoff: two locations to be aware of; this file documents the split to prevent confusion.

---

## Known Debt

> Record shortcuts, workarounds, and deferred quality work here.

| ID | Description | Impact | Logged | Sprint |
|---|---|---|---|---|
<!-- Debt entries go here -->

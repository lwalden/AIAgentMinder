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

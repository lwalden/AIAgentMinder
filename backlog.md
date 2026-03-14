# AIAgentMinder Backlog

Full acceptance criteria for planned features. Items here are assessed and ready to implement; items in ROADMAP.md backlog section are unscheduled without full AC.

---

## v1.0 Must-Have Features

### `/checkup` Diagnostic Command

**Title:** New `/checkup` command that validates AIAgentMinder installation health

**Description:**
As a developer who has installed AIAgentMinder in my project, I want to run `/checkup` to verify that my installation is correctly configured and all prerequisites are met, so that I can quickly diagnose why hooks aren't firing, commands aren't loading, or the framework isn't working as expected.

**Acceptance Criteria:**

1. Create `project/.claude/commands/checkup.md`
2. The command checks and reports on:
   - **Node.js availability**: `node --version` — PASS/FAIL with version shown
   - **Required files exist**: CLAUDE.md, DECISIONS.md, docs/strategy-roadmap.md, .claude/settings.json — PASS/WARN for each
   - **Hook script exists**: `.claude/hooks/compact-reorient.js` — PASS/FAIL
   - **Hook configuration valid**: `.claude/settings.json` parses as valid JSON and contains expected hook entry — PASS/FAIL
   - **CLAUDE.md Project Identity**: Check if placeholder brackets still present (`[Project Name]`, `[Brief description]`) — PASS/WARN
   - **Version stamp**: Read `.claude/aiagentminder-version` and display current version — INFO
   - **Git status**: Is this a git repo? Is there a remote? What branch? — INFO

3. Output format:

   ```text
   AIAgentMinder Health Check — v1.0.0

   ✓ Node.js: v20.11.0
   ✓ CLAUDE.md: found (Project Identity populated)
   ✓ DECISIONS.md: found
   ⚠ docs/strategy-roadmap.md: found but has placeholder values — run /brief
   ✓ .claude/settings.json: valid JSON, 1 hook entry (compact-reorient)
   ✓ .claude/hooks/compact-reorient.js: found
   ✓ Git: on branch feature/add-search, remote origin configured

   Status: Healthy (1 warning)
   ```

4. Warnings are non-blocking; failures are flagged with remediation steps
5. `/setup` and `/update` copy this command and reference it in their output

**Supporting Story: Update `/setup` and `/update`**

1. `/setup` Step 3 copies `project/.claude/commands/checkup.md` to the target project
2. `/setup` Step 7 summary lists `checkup.md` in "Created files"
3. `/update` Step 2 overwrites `checkup.md` as an AIAgentMinder-owned file
4. README troubleshooting section says: "Run `/checkup` first to check your installation"

---

### `approach-first.md` Rule

**Title:** Rule instructing Claude to state approach before executing architecture-affecting tasks

**Description:**
A `.claude/rules/approach-first.md` rule that prevents "wrong approach" errors — the top friction pattern from the March 2026 session analysis. Claude must state its intended approach before executing when the task involves architecture changes, adding new dependencies, multi-file refactors, new data models, or any change affecting more than 3 files.

**Acceptance Criteria:**

1. Create `project/.claude/rules/approach-first.md`
2. Rule applies to: architecture changes, new dependencies, multi-file refactors, data model changes, changes affecting more than 3 files
3. Claude states what it's going to do, which files will change, and any assumptions — before writing code
4. If the user replies with corrections, Claude adjusts approach before executing
5. Rule does NOT apply to: single-file edits, bug fixes with obvious fixes, test additions, documentation edits
6. `/setup` copies this file (always-active, not optional)
7. `/update` overwrites this file as AIAgentMinder-owned

---

### `debug-checkpoint.md` Rule

**Title:** Rule triggering a checkpoint after repeated failed debug attempts

**Description:**
A `.claude/rules/debug-checkpoint.md` rule that prevents debugging spirals. After 3 consecutive failed attempts at the same fix (same error, different code changes), Claude stops, summarizes what's been tried, and asks the human for input before continuing.

**Acceptance Criteria:**

1. Create `project/.claude/rules/debug-checkpoint.md`
2. Trigger condition: 3 consecutive attempts targeting the same error that did not resolve it
3. Checkpoint output: what the error is, what was tried (list of approaches), what Claude's current hypothesis is, and a clear ask for human input
4. After human responds, Claude may continue — the checkpoint resets
5. Rule does NOT block: first attempt at a fix, different errors, making progress on the same error
6. `/setup` copies this file (always-active)
7. `/update` overwrites this file as AIAgentMinder-owned

---

### Complexity Budget (in `/milestone`)

**Title:** Add Complexity Budget as a fifth health dimension to `/milestone`

**Description:**
Track cumulative complexity signals at sprint boundaries. No SDD tool or native Claude Code feature provides ongoing complexity trend tracking. Integrate into `/milestone` rather than a separate command.

**Acceptance Criteria:**

1. `/milestone` Step 1 gathers: file count, top-5 largest source files by line count, direct dependency count
2. `/milestone` Step 2 adds **Section E: Complexity Budget**:
   - File count vs phase expectations (Phase 1 <50, Phase 2 <150, Phase 3+ uncapped)
   - Largest 3 source files with line counts
   - Dependency count vs last sprint (trend)
   - Flag: any file >300 lines in Phase 1, >500 lines in Phase 2+
3. `/milestone` Step 3 health report includes Complexity Budget row:

   ```text
   Complexity Budget: [Healthy / Watch / Concern]
     File count: {n} ({delta from last sprint if available})
     Largest:    {file}: {lines}, {file}: {lines}, {file}: {lines}
     Deps:       {n} direct ({delta})
   ```

4. Step 4 hard issues: flag files exceeding thresholds before proceeding

---

### Technical Debt Tracker (in `/milestone`)

**Title:** Surface Technical Debt in `/milestone`; establish logging convention

**Description:**
A structured `## Known Debt` section in DECISIONS.md for recording known shortcuts. Claude logs debt when implementing workarounds. `/milestone` surfaces the debt list.

**Acceptance Criteria:**

1. `project/DECISIONS.md` template includes a `## Known Debt` section with format:

   ```markdown
   ## Known Debt
   | ID | Description | Impact | Logged | Sprint |
   |---|---|---|---|---|
   | D-001 | [shortcut taken] | [what breaks if ignored] | [date] | S{n} |
   ```

2. When Claude implements a workaround or intentional shortcut, it appends a row to Known Debt
3. `/milestone` Step 1 reads the Known Debt section
4. `/milestone` Step 3 health report includes:

   ```text
   Known Debt: {n} items logged
     Oldest:       {date} — {description}
     Highest risk: {description}
   ```

5. `/milestone` Step 4 flags debt items that are more than 2 sprints old

---

### Risk-Flagged Issues in Sprint Planning

**Title:** Auto-trigger `/self-review` for risk-flagged sprint issues

**Description:**
During sprint planning, issues touching high-risk areas get a `[risk]` tag. At PR creation for that issue, `/self-review` runs automatically regardless of quality tier.

**Acceptance Criteria:**

1. `sprint-workflow.md` Step 4 (decompose issues): instruct Claude to add `[risk]` tag to issues touching auth/session handling, payments/billing, data migration, public API changes, or security-sensitive config
2. Risk tag appears in SPRINT.md issue table and native Task description
3. During sprint execution, before creating a PR for a risk-tagged issue: run `/self-review` automatically (even for Lightweight/Standard quality tiers)
4. If `/self-review` finds High severity issues, they must be addressed before the PR is created
5. Sprint review output notes which issues were risk-flagged

---

### Adaptive Sprint Sizing — Formalize Metadata

**Title:** Write sprint velocity metadata to SPRINT.md on archive for cross-session trend tracking

**Description:**
`/retrospective` already provides adaptive sizing guidance after Sprint 3+. Formalize it so the data persists without parsing git history.

**Acceptance Criteria:**

1. When a sprint is archived, the archive line includes velocity metadata:

   ```text
   S{n} archived ({date}): {planned} planned, {completed} completed ({velocity}%). Recommended next sprint: {min}–{max} issues.
   ```

2. A `<!-- sizing: {min}-{max} -->` comment is appended after the archive line for the next sprint planning step to read
3. `/retrospective` Step 4 reads prior archived sprint lines to compute trend (not just git log)
4. After Sprint 3+, the recommendation is based on median velocity across available archived sprints

---

## v1.0 Should-Have Features

### `/scope-check` Command

**Title:** Active scope governance command for evaluating proposed work against the roadmap

**Description:**
The passive `scope-guardian.md` rule catches scope drift during execution. `/scope-check` provides an on-demand consultation before the developer commits to building something.

**Acceptance Criteria:**

1. Create `project/.claude/commands/scope-check.md`
2. The developer describes a proposed feature or task — can be a brief sentence or a draft issue
3. Claude reads `docs/strategy-roadmap.md`, current phase, and approved sprint scope (if active)
4. Returns one of:
   - **In-scope:** "This aligns with Phase {n} — [MVP feature it maps to]. Proceed."
   - **Out-of-scope:** "This is explicitly out of scope: [quote from roadmap]. Add to a future phase or override?"
   - **Deferred:** "This isn't in Phase {n} but is in Phase {m}. Build it then, or move it up?"
   - **Not in roadmap:** "This isn't in the roadmap. Options: add it to the current phase, defer to a future phase, or mark out of scope."
5. Response always includes a one-sentence recommendation and a clear path to proceed
6. `/setup` and `/update` copy this command

---

## Backlog (Unscheduled)

### SDD Integration Layer

**Title:** Generate a `constitution.md` from `/brief` output for SDD tool compatibility

**Description:**
SDD tools (Spec-Kit, cc-sdd, GSD) handle feature-level planning. AIAgentMinder handles project-level governance. Instead of competing, generate a governance document that SDD tools can consume — positioning AIAgentMinder as the layer above SDD.

**Acceptance Criteria (draft):**

1. `/brief` final step optionally generates `docs/constitution.md` with: project identity, quality tier, architectural constraints, out-of-scope list, tech stack decisions
2. The file follows emerging SDD conventions (compatible with Spec-Kit `constitution.md` format)
3. `/setup` asks: "Generate SDD constitution.md for use with Spec-Kit/cc-sdd? (y/n)"

---

### `/onboard` Command

**Title:** Analyze an existing codebase and generate AIAgentMinder governance files from it

**Description:**
Targets developers who discover AIAgentMinder mid-project. Reads the existing codebase and git history to generate a filled-in CLAUDE.md, initial DECISIONS.md entries, quality tier recommendation, and draft strategy-roadmap.md.

**Acceptance Criteria (draft):**

1. Read: existing CLAUDE.md (from `claude /init`), recent git log (last 50 commits), package/dependency files, top-level README
2. Generate: project identity block, DECISIONS.md entries from notable git commits, quality tier recommendation based on project size/history, draft strategy-roadmap.md with inferred phases
3. Always prompts for human review before writing — never overwrites without confirmation
4. Leverages subagents for parallel codebase analysis

---

### `/handoff` JSON Digest

**Recommendation: Keep in backlog. Do not implement for v1.0.**

The JSON digest was designed for external tooling integration. For the target audience (solo devs, small teams), this is speculative value — nobody has requested it. If someone needs programmatic session state, they can request it. The markdown output of `/handoff` is sufficient.

---

### `/update` Dry-Run Mode

Show what would change before committing to the migration. Useful but not v1.0 critical.

---

### GitHub Issues Bridge

Optional sync of native Tasks to GitHub Issues for teams that want visibility outside Claude Code. Team feature, not solo dev priority.

---

### MCP Server Detection in `/checkup`

Verify MCP servers listed in CLAUDE.md are actually configured in the project's MCP config. Post-v1.0 because MCP config format is still stabilizing.

---

### Strategy-Roadmap.md Versioning

Lightweight change log when the roadmap is revised mid-project. Low urgency; git history serves as the archive.

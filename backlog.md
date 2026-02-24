# AIAgentMinder Backlog

## Competitive Landscape Analysis 2/23/2026

### Direct Competitors (Session Continuity for Claude Code)

| Tool | Approach | Strengths vs AIAgentMinder | Weaknesses vs AIAgentMinder |
|------|----------|---------------------------|----------------------------|
| **claude-mem** (thedotmack) | Plugin marketplace install; 5 lifecycle hooks; SQLite + Chroma vector DB; 3-layer progressive disclosure | Zero-config automatic capture; 10x token efficiency via compression; semantic search; 1,739 GitHub stars in 24 hours (Feb 2026) | Requires Bun + external dependencies; API cost (~$0.10/day for Haiku calls); no planning/governance layer |
| **memory-mcp** (yuvalsuede) | MCP server; Haiku-powered extraction; two-tier memory (CLAUDE.md + deep store) | Fully automatic; LLM-powered consolidation; visual dashboard; npm install | External LLM dependency (cost); no project planning; no decision tracking |
| **ContextStream** (contextstream) | Hooks-based auto-capture; per-message context injection | Smart per-message relevance filtering; learns from errors | No planning layer; no governance; less mature |
| **claude-sessions** (iannuttall) | Slash commands only; session files in `sessions/` directory | Simple; pure markdown | Manual-only; no hooks; no auto-inject; no planning |
| **Claude Code Native Session Memory** | Built-in (v2.1.30+, Feb 2026); background recall/write of memories | Zero setup; native integration; no token cost | Compressed summaries lose detail; no decision tracking; no structured planning; no governance; gradual rollout |

### Broader Ecosystem (Project Management / Governance)

| Tool | Approach | Overlap with AIAgentMinder |
|------|----------|---------------------------|
| **CCPM** (automazeio) | GitHub Issues as source of truth; PRDs → Epics → Issues; parallel agent execution via git worktrees | Planning layer overlaps with `/plan`; much heavier; targets teams, not solo devs |
| **claude-simone** | Framework for AI-assisted development with Claude Code | Project management focus; less session continuity |
| **Compound Engineering Plugin** (EveryInc) | Agents, skills, commands; turns mistakes into lessons | Learning-from-errors overlaps with DECISIONS.md; different philosophy |
| **Context Engineering Kit** (Vlad Goncharov) | Minimal-token context patterns | Complements rather than competes; could inform AIAgentMinder's context budget approach |

### Key Takeaway

AIAgentMinder occupies a **unique niche**: lightweight session continuity + structured planning + decision governance, all in plain markdown with no external dependencies beyond Node.js. The biggest emerging threat is **Claude Code's native Session Memory** (Feb 2026 rollout), which automates the session continuity piece. However, native memory doesn't provide planning (`/plan`), decision tracking (DECISIONS.md), or structured handoffs — AIAgentMinder's governance and planning layers remain independently valuable, as the README correctly notes.

The **automated memory tools** (claude-mem, memory-mcp) are more sophisticated at context capture but add dependencies and cost. AIAgentMinder's manual-but-structured approach (git-tracked, human-readable) is a feature for developers who want transparency and control.

---

## C) High-Value Enhancement to Existing Feature

### Story: Enhance `/handoff` to Generate a Machine-Readable Session Digest

**Title:** `/handoff` writes a structured JSON digest alongside PROGRESS.md for automated tooling integration

**Description:**
As a developer using AIAgentMinder, I want `/handoff` to produce a small structured JSON file (`.claude/session-digest.json`) in addition to updating PROGRESS.md, so that external tools (CI/CD, dashboards, Linear/GitHub integrations) can programmatically read session state without parsing markdown.

This positions AIAgentMinder to integrate with the broader Claude Code ecosystem (CCPM, Linear, GitHub Actions) without adding heavy dependencies. The digest is a lightweight bridge file — write-only from AIAgentMinder's perspective.

**Rationale:**
- Multiple competing tools (CCPM, claude-mem) offer programmatic access to session state. AIAgentMinder's pure-markdown approach is a strength for human readability but a weakness for tooling integration.
- A JSON digest is the minimum viable step toward integration without abandoning the markdown-first philosophy.
- Users who want to build custom dashboards, Slack notifications, or CI checks can consume this file.

**Acceptance Criteria:**
1. When `/handoff` runs, it writes `.claude/session-digest.json` with the following schema:
   ```json
   {
     "version": "0.5.3",
     "timestamp": "2026-02-23T10:30:00Z",
     "phase": "1 - MVP",
     "activeTasks": ["Implement POST /recipes endpoint with Zod validation"],
     "blockers": ["Need DATABASE_URL for staging"],
     "nextPriorities": ["Wire Zod validation", "Apply auth middleware", "Implement PUT/DELETE"],
     "decisions": ["Input Validation: Zod over Joi"],
     "filesModified": ["src/routes/recipes.ts", "src/schemas/recipe.ts"],
     "sessionSummary": "Implemented GET /recipes with tests. POST stub exists."
   }
   ```
2. The JSON file is added to `.gitignore` in the template (it's ephemeral — git history of PROGRESS.md is the durable record)
3. `/handoff` command markdown instructions are updated to include the digest generation step
4. The `session-start-context.js` hook does NOT read this file (it's for external consumers, not Claude)
5. If the file already exists, it is overwritten (not appended)

**Test Plan:**
1. Run `/handoff` in a test project → verify `.claude/session-digest.json` is created with valid JSON
2. Verify the schema matches the AC above
3. Verify the file is listed in `.gitignore`
4. Verify `session-start-context.js` does not reference the digest file
5. Run `/handoff` twice → verify second run overwrites the first (no duplicate data)

---

## D) High-Value New Feature

### Story: Add `/doctor` Diagnostic Command for Installation Health Checks

**Title:** New `/doctor` command that validates AIAgentMinder installation health and identifies common misconfiguration issues

**Description:**
As a developer who has installed AIAgentMinder in my project, I want to run `/doctor` to verify that my installation is correctly configured and all prerequisites are met, so that I can quickly diagnose why hooks aren't firing, commands aren't loading, or session continuity isn't working.

**Rationale:**
- The #1 troubleshooting section in the README addresses "Hooks not running" and "Commands not showing." A diagnostic command eliminates guesswork.
- Competing tools (CCPM has `/pm:validate`, claude-mem has a dashboard) provide self-diagnosis. AIAgentMinder has nothing.
- This is especially valuable for the `/update` flow — after upgrading, run `/doctor` to confirm everything is healthy.
- Low implementation complexity (reads files and checks conditions) with high user-facing value.

**Acceptance Criteria:**
1. Create `.claude/commands/doctor.md` in the `project/` directory (gets copied to target projects by `/setup` and `/update`)
2. The command checks and reports on:
   - **Node.js availability**: `node --version` — PASS/FAIL with version shown
   - **Required files exist**: CLAUDE.md, PROGRESS.md, DECISIONS.md, docs/strategy-roadmap.md, .claude/settings.json — PASS/WARN for each
   - **Hook scripts exist**: All 4 files in `.claude/hooks/` — PASS/FAIL for each
   - **Hook configuration valid**: `.claude/settings.json` parses as valid JSON and contains expected hook entries — PASS/FAIL
   - **settings.json deny list**: Verify deny list is present and non-empty — PASS/WARN
   - **CLAUDE.md Project Identity**: Check if placeholder brackets still present (`[Project Name]`, `[Brief description]`) — PASS/WARN ("still has placeholder values — run /setup")
   - **Version stamp**: Read `.claude/aiagentminder-version` and display current version — INFO
   - **Git status**: Is this a git repo? Is there a remote? What branch? — INFO
3. Output format:
   ```
   AIAgentMinder Health Check — v0.5.3

   ✓ Node.js: v20.11.0
   ✓ CLAUDE.md: found (Project Identity populated)
   ✓ PROGRESS.md: found
   ✓ DECISIONS.md: found
   ⚠ docs/strategy-roadmap.md: found but has placeholder values — run /plan
   ✓ .claude/settings.json: valid JSON, 10 deny rules, 4 hook entries
   ✓ .claude/hooks/: 4/4 scripts present
   ✓ Git: on branch feature/add-search, remote origin configured

   Status: Healthy (1 warning)
   ```
4. Warnings are non-blocking (the tool still reports overall health)
5. Failures (Node.js missing, settings.json invalid) are clearly flagged with remediation steps

**Test Plan:**
1. Run `/doctor` in a correctly configured project → all checks pass
2. Remove `node` from PATH, run `/doctor` → Node.js check fails with clear message
3. Delete one hook file, run `/doctor` → hook check warns about missing file
4. Corrupt `.claude/settings.json` (invalid JSON), run `/doctor` → settings check fails
5. Run `/doctor` on a freshly `/setup`-initialized project before `/plan` → warns about placeholder values in strategy-roadmap.md
6. Add `/doctor` to the file list in `/setup` Step 7 summary and `/update` Step 2 overwrite list
7. Update README troubleshooting section to recommend `/doctor` as first step

### Supporting Story: Update `/setup` and `/update` to Include `/doctor`

**Title:** `/setup` and `/update` commands copy `doctor.md` and reference it in their output

**Description:**
As a maintainer of AIAgentMinder, I need `/setup` and `/update` to include the new `doctor.md` command file so that users get it automatically on install and upgrade.

**Acceptance Criteria:**
1. `/setup` Step 3 copies `project/.claude/commands/doctor.md` to the target project
2. `/setup` Step 7 summary lists `doctor.md` in the "Created files" output
3. `/update` Step 2 overwrites `doctor.md` as an AIAgentMinder-owned file
4. `/update` file taxonomy table includes `doctor.md` in the "AIAgentMinder-owned" row
5. README "What Gets Copied" tree includes `doctor.md`
6. README troubleshooting section says: "Run `/doctor` first to check your installation"

**Test Plan:**
1. Run `/setup` on a new project → verify `.claude/commands/doctor.md` exists in target
2. Run `/update` on an existing project that doesn't have `doctor.md` → verify it's added
3. Run `/update` on a project that has an older `doctor.md` → verify it's overwritten
4. Verify README file tree includes the new command

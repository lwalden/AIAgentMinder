---
name: milestone
description: Run a project health assessment across four dimensions — phase progress, timeline health, complexity vs phase, and scope drift. Produces a structured health report with actionable recommendations. Run at sprint boundaries, phase transitions, or any time you want a clear picture of project health.
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep
---

# /milestone - Project Health Assessment

Run a milestone health check to assess whether the project is on track. This is the "project standup" that solo developers don't have — a periodic review of scope, progress, and complexity.

Run this at sprint boundaries, at phase transitions, or any time you want a clear picture of where the project stands.

---

## Step 1: Gather Context

Read the following:

1. `docs/strategy-roadmap.md` — current phase, MVP features, out-of-scope items, phase timeline
2. `DECISIONS.md` — original stack and architecture decisions
3. `SPRINT.md` — current sprint status (if active)
4. Use TaskList to get current task states
5. Recent git log: `git log --oneline -20` — what has been merged recently
6. Project file count: `find . -type f -not -path './.git/*' | wc -l` (or `Get-ChildItem -Recurse -File | Measure-Object` on Windows)
7. Dependencies: read `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or equivalent

---

## Step 2: Assess Each Dimension

### A. Phase Progress

- Which phase is declared in the roadmap?
- What MVP features are complete (have merged PRs), in progress, or not started?
- Is there non-MVP work that was done while MVP features remain unstarted? (scope drift signal)
- What percentage of Phase 1 features are done?

### B. Timeline Health

- What is the declared target date or phase duration from the roadmap?
- Based on the pace of recent merged work, is the project on track?
- Are there open blockers or unresolved questions that threaten the timeline?

### C. Complexity vs Phase

Assess whether the codebase complexity is proportional to the project phase:

- **Early prototype / Phase 1:** Complexity should be minimal. Flag if there are more than ~20 source files, deeply nested modules, or an unexpectedly large dependency count.
- **Active development / Phase 2+:** Growth is expected. Flag files over ~300 lines as decomposition candidates. Flag if new dependencies were added in the last sprint that weren't in the original stack plan.
- **Maintenance:** Flag if file count is growing without corresponding feature delivery.

List the 3 largest source files by line count:
```bash
find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | xargs wc -l 2>/dev/null | sort -rn | head -5
```
(adjust extension for project stack)

### D. Dependency Health

- How many direct dependencies does the project have now vs what was planned?
- Were any dependencies added that weren't in the original stack decision?
- Are there any dependencies that significantly expand the project's surface area (large frameworks, heavy runtimes)?

---

## Step 3: Present the Health Report

```
Milestone Health Check — S{sprint_number} / Phase {n}
Date: {today}

Phase Progress:    {X}/{total} MVP features complete ({%})
Timeline:          [On track / At risk / Behind — one sentence why]
Scope Drift:       [None detected / {description of drift}]
Complexity:        [Healthy / Watch / Concern — one sentence]
  Largest files:   {file}: {lines}, {file}: {lines}, {file}: {lines}
Dependency count:  {n} direct dependencies
  New this sprint: {list any added}

Recommendations:
- [Actionable item if any concern raised]
- [Or: "No actions needed — project health looks good."]
```

---

## Step 4: Flag Hard Issues

If any of the following are true, surface them explicitly before proceeding:

- **MVP features unstarted while non-MVP work was done** — "Scope drift detected: [feature] was built but [MVP item] is still not started. Recommend pausing non-MVP work until MVP is complete."
- **Phase deadline at risk** — "At current pace, Phase 1 will complete in ~{N} weeks. Target was {date}. Consider reducing sprint scope."
- **Large files that should be decomposed** — "{file} is {N} lines. Consider splitting before Phase 2 complexity increases."
- **Surprise dependencies** — "{package} was added but wasn't in the original stack plan. Was this intentional? If so, log it in DECISIONS.md."

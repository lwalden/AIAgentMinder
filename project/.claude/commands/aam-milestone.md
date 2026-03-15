# /aam-milestone - Project Health Assessment

Run a milestone health check to assess whether the project is on track. This is the "project standup" that solo developers don't have — a periodic review of scope, progress, complexity, and known debt.

Run this at sprint boundaries, at phase transitions, or any time you want a clear picture of where the project stands.

---

## Step 1: Gather Context

Read the following:

1. `docs/strategy-roadmap.md` — current phase, MVP features, out-of-scope items, phase timeline
2. `DECISIONS.md` — original stack and architecture decisions; also read the `## Known Debt` section if present
3. `SPRINT.md` — current sprint status (if active); archived sprint lines for sprint sizing data
4. Use TaskList to get current task states
5. Recent git log: `git log --oneline -20` — what has been merged recently
6. File count and largest files:
   ```bash
   # Cross-platform file count (excluding .git)
   find . -type f -not -path './.git/*' | wc -l
   # Largest source files
   find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | xargs wc -l 2>/dev/null | sort -rn | head -5
   ```
   (adjust extensions for the project stack; on Windows use `Get-ChildItem -Recurse -File | Measure-Object`)
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

### C. Scope Drift

- Were any features added to the sprint or codebase that aren't in the roadmap?
- Did any approved issue expand significantly beyond its original scope?
- Check SPRINT.md scope additions if present.

### D. Dependency Health

- How many direct dependencies does the project have now vs what was planned?
- Were any dependencies added that weren't in the original stack decision?
- Are there any dependencies that significantly expand the project's surface area?

### E. Complexity Budget

Assess whether codebase complexity is proportional to the current phase:

**Phase thresholds:**
- Phase 1 (prototype/MVP): <50 source files, no single file >300 lines
- Phase 2 (active development): <150 source files, no single file >500 lines
- Phase 3+: growth expected — flag files >800 lines as decomposition candidates

From the data gathered in Step 1:
- Total file count vs phase threshold
- Top 3 largest source files by line count
- Dependency count trend (vs prior sprint if archived sprint data is available)

Flag any file exceeding the phase threshold.

### F. Known Debt

Read the `## Known Debt` section in DECISIONS.md (if present):
- How many open debt items are logged?
- Which is oldest? Which has the highest stated impact?
- Are any items more than 2 sprints old without a resolution plan?

---

## Step 3: Present the Health Report

```
Milestone Health Check — S{sprint_number} / Phase {n}
Date: {today}

Phase Progress:    {X}/{total} MVP features complete ({%})
Timeline:          [On track / At risk / Behind — one sentence why]
Scope Drift:       [None detected / {description of drift}]
Dependency count:  {n} direct ({+/-delta from last sprint if known})
  New this sprint: {list any added, or "none"}
Complexity Budget: [Healthy / Watch / Concern]
  File count:      {n} ({threshold for this phase})
  Largest files:   {file}: {lines} lines, {file}: {lines} lines, {file}: {lines} lines
Known Debt:        {n} items  [{oldest date} — {highest-impact description}]

Recommendations:
- [Actionable item if any concern raised]
- [Or: "No actions needed — project health looks good."]
```

---

## Step 4: Flag Hard Issues

If any of the following are true, surface them explicitly before proceeding:

- **MVP features unstarted while non-MVP work was done** — "Scope drift detected: [feature] was built but [MVP item] is still not started. Recommend pausing non-MVP work until MVP is complete."
- **Phase deadline at risk** — "At current pace, Phase 1 will complete in ~{N} weeks. Target was {date}. Consider reducing sprint scope."
- **File count exceeds phase threshold** — "File count is {n}, above the Phase {x} threshold of {limit}. Consider whether all files are necessary or if the project structure needs consolidation."
- **Large files that should be decomposed** — "{file} is {N} lines, exceeding the Phase {x} limit of {limit}. Consider splitting before complexity increases further."
- **Surprise dependencies** — "{package} was added but wasn't in the original stack plan. Was this intentional? If so, log it in DECISIONS.md."
- **Stale debt items** — "{n} debt items are more than 2 sprints old. Review whether they still apply or schedule resolution."

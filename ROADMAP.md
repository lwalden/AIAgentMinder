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

## v2.0 — Autonomous PR Pipeline (shipped)

- **`/aam-pr-pipeline` skill** — Autonomous review-fix-test-merge pipeline for PRs. Reviews with full repo context (not just the diff), evaluates each issue with a developer perspective, applies fixes, runs the test suite, waits for external CI checks, and auto-merges when everything is green. Escalates to the user via email or PR label for high-risk files, cycle limit, blocked tests, or unresolvable merge blockers.
- **`.pr-pipeline.json` config template** — Per-repo configuration for high-risk file patterns, cycle limit, auto-merge preference, merge method, notification email, and external check timeout.
- **Sprint workflow integration** — `sprint-workflow.md` invokes `/aam-pr-pipeline` in-session after PR creation. On success (merged), the sprint continues to the next issue. On escalation, the sprint stops for human intervention.

---

## v2.1 — In-Session Pipeline Execution (shipped)

Replaced the background hook-based pipeline with in-session execution. The sprint workflow now invokes `/aam-pr-pipeline` directly after creating a PR, eliminating the headless `claude -p` worktree approach and its associated issues (command files not loading, insufficient turns, context gaps).

### Changes from v2.0

- **Removed `pr-pipeline-trigger.js` hook** — No longer needed. The PostToolUse Bash hook that detected `gh pr create` output and spawned a background agent is gone.
- **Sprint continuation simplified** — After the pipeline merges a PR, control returns to the sprint workflow which naturally continues to the next issue. No headless spawning, no `autoContinueSprint` / `continueMaxIssues` config needed.
- **Reduced hook count** — Down to 1 hook script (`compact-reorient.js`).
- **`/aam-update` migration** — Removes the old hook file and PostToolUse settings entry from target projects.

---

## v2.2 — Release Automation (`/aam-release`)

Generate a CHANGELOG.md entry, bump the version, tag, and create a GitHub release — all from a single command after a sprint is merged.

### Feature: `/aam-release` command

**Implementation — `project/.claude/commands/aam-release.md`:**

#### Step 0: Parse Input

Accept an optional explicit version argument: `/aam-release 1.2.0`. If not provided, determine via Step 1 + Step 2.

#### Step 1: Detect Current Version

Check in order:
1. `package.json` → `.version` field
2. `pyproject.toml` → `[project] version` or `[tool.poetry] version`
3. `Cargo.toml` → `[package] version`
4. `version.txt` or `VERSION` at repo root
5. Last git tag matching `v*` semver pattern: `git describe --tags --abbrev=0 2>/dev/null`
6. If none found: default to `0.0.0` and warn the user.

#### Step 2: Determine New Version

If explicit version was passed: use it. Otherwise:

Present current version and ask:
```
Current version: {current}
Bump type?
  1. patch  → {patch}
  2. minor  → {minor}
  3. major  → {major}
  4. custom → enter version
```

Wait for selection.

#### Step 3: Determine Release Range

Get the date/SHA of the previous release:
```bash
git tag --sort=-version:refname | head -1
# If tag exists:
git log {last_tag}..HEAD --oneline
# If no tag:
git log --oneline
```

Get all PRs merged to main since the last tag:
```bash
gh pr list \
  --base main \
  --state merged \
  --json number,title,mergedAt,labels,url \
  --jq '[.[] | select(.mergedAt > "{last_tag_date}")]'
```

If no PRs found since last tag, warn: "No merged PRs found since last release. Continue anyway? (y/n)"

#### Step 4: Generate Changelog Entry

Group PRs by conventional commit type in the title:

- **Features** — title starts with `feat` or has label `feature`
- **Bug Fixes** — title starts with `fix` or has label `bug`
- **Other** — everything else (chore, docs, refactor, test, etc.)

Produce a Keep A Changelog format section:

```markdown
## [{new_version}] — {YYYY-MM-DD}

### Features
- {PR title} ([#{number}]({url}))

### Bug Fixes
- {PR title} ([#{number}]({url}))

### Other
- {PR title} ([#{number}]({url}))
```

Omit empty sections.

Present the draft to the user:
```
Changelog draft for v{new_version}:

{draft}

Write to CHANGELOG.md? (y/n/edit)
```

- `y`: proceed
- `n`: stop
- `edit`: open the draft for manual editing before continuing

#### Step 5: Update Version Files

For each detected version file from Step 1, update the version string:
- `package.json`: `"version": "{new_version}"`
- `pyproject.toml`: `version = "{new_version}"` (under `[project]` or `[tool.poetry]`)
- `Cargo.toml`: `version = "{new_version}"` (under `[package]`)
- `version.txt` / `VERSION`: replace entire file contents with `{new_version}`

Print each file updated: `✓ Updated version: package.json → {new_version}`

#### Step 6: Write CHANGELOG.md

If `CHANGELOG.md` exists: prepend the new section after the first `# Changelog` heading (or before all existing `## [` entries).

If `CHANGELOG.md` does not exist: create it with a standard header and the new section.

#### Step 7: Commit, Tag, Push

```bash
git add CHANGELOG.md {version_files}
git commit -m "chore(release): v{new_version}"
git tag v{new_version} -m "v{new_version}"
git push origin main --tags
```

If push fails (branch protection, etc.): commit and tag locally, notify the user to push manually.

#### Step 8: Create GitHub Release

```bash
gh release create v{new_version} \
  --title "v{new_version}" \
  --notes "{generated_changelog_section}"
```

Check for build artifacts to attach:
- If `dist/` exists with files: `gh release upload v{new_version} dist/*`
- If `build/` exists with files: `gh release upload v{new_version} build/*`

Print the release URL on completion.

#### Step 9: Summary

```
Release v{new_version} complete

✓ CHANGELOG.md updated
✓ Version bumped: {files}
✓ Commit: chore(release): v{new_version}
✓ Tag: v{new_version}
✓ GitHub release: {release_url}
[✓ Artifacts uploaded: {count} files]
```

**Acceptance criteria:**

- Works without `package.json` — auto-detects whichever version file is present.
- CHANGELOG.md created if absent; new section prepended if present, existing entries preserved.
- PRs grouped by conventional commit type; PRs without matching prefix go under "Other".
- Tag and release are created on the current branch (caller's responsibility to be on main).
- `gh release create` receives the full changelog section as release notes — no manual copy-paste.
- `autoContinueSprint` is **not** triggered after `/aam-release` — releases are explicit human actions.
- Added to `/aam-setup` core files list and `/aam-update` file taxonomy (always overwrite).

---

## Post-v1.4 Direction

Remaining maintenance work (lower priority than v2.1 and v2.2):

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

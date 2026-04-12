---
description: Autonomous PR review, fix, test, and merge pipeline
user-invocable: true
effort: high
---

# /aam-pr-pipeline - Autonomous PR Review Pipeline

Review, fix, test, and merge a pull request autonomously. Handles the full
review→fix→test→merge loop with human escalation for high-risk or genuinely
blocked cases.

Invoked in-session by the sprint workflow after PR creation, or manually:
`/aam-pr-pipeline` (uses current branch PR) or `/aam-pr-pipeline <PR-URL>`.

---

## Step 0: Parse Input and Load Config

**Determine the PR:**

If invoked with a PR URL argument: parse owner, repo, and PR number.

If invoked without arguments, get current PR:
```bash
git rev-parse --abbrev-ref HEAD
gh pr view --json number,url,headRefName,baseRefName,title,body,author
```

If no open PR for the current branch, tell the user and stop.

**Load config** from `.pr-pipeline.json` at the repo root (if it exists):

```json
{
  "highRiskPatterns": ["**/auth/**", "**/security/**", "**/payment/**",
    "**/billing/**", "**/migration/**", ".github/workflows/**",
    "Dockerfile*", "docker-compose*", "*.tf", "*.tfvars"],
  "cycleLimit": 5,
  "autoMerge": true,
  "mergeMethod": "squash",
  "skipPatterns": ["package-lock.json", "yarn.lock", "*.lock",
    "dist/**", "build/**", ".next/**"],
  "notification": { "email": "", "from": "pipeline@resend.dev" },
  "testCommand": null,
  "mergeWait": { "pollIntervalSeconds": 30, "timeoutMinutes": 15 }
}
```

If the file is absent, use these defaults.

**Get PR metadata:**
```bash
gh pr view {number} --json number,title,body,headRefName,baseRefName,files,labels,headRefOid,author
```

**Initialize cycle counter:** Check PR labels for a label matching `ai-cycle-N`.
Set `cycleNumber` to N, or 1 if no such label exists.

---

## Step 1: High-Risk File Gate

Get the list of changed files from the PR metadata (Step 0, `files` field).

Check each file path against `highRiskPatterns`. Use glob-style matching:
`**` matches any path segment, `*` matches within a single segment.

If ANY file matches a high-risk pattern:

1. Comment on the PR:
   ```
   ## PR Pipeline — Human Review Required

   This PR modifies files in a high-risk area that requires human review before
   automated processing:

   {list each matching file and which pattern it matched}

   The pipeline has stopped. Please review and merge manually, or remove the
   relevant files from the PR if the change is unintentional.
   ```
   ```bash
   gh pr comment {number} --body "..."
   ```

2. Add label and set status:
   ```bash
   gh pr edit {number} --add-label "needs-human-review"
   gh api repos/{owner}/{repo}/statuses/{sha} \
     -f state=failure \
     -f context="ai-review/claude" \
     -f description="High-risk files detected — human review required"
   ```

3. Send notification email if `notification.email` is configured (see
   Notification Helper at the bottom of this file).

4. **STOP. Proceed to Step 9 (Cleanup) then exit.**

---

## Step 2: Cycle Limit Check

If `cycleNumber` exceeds `cycleLimit`:

1. Comment on the PR:
   ```
   ## PR Pipeline — Cycle Limit Reached

   The automated review-fix loop has run {cycleNumber} times without converging.
   Manual review is required to resolve the remaining feedback.
   ```
   ```bash
   gh pr comment {number} --body "..."
   ```

2. Add label and set status:
   ```bash
   gh pr edit {number} --add-label "needs-human-review"
   gh api repos/{owner}/{repo}/statuses/{sha} \
     -f state=failure \
     -f context="ai-review/claude" \
     -f description="Review cycle limit reached ({cycleNumber}) — manual review required"
   ```

3. Send notification email if configured.

4. **STOP. Proceed to Step 9 (Cleanup) then exit.**

**Update cycle label:**
```bash
# Remove old label if present
gh pr edit {number} --remove-label "ai-cycle-{cycleNumber-1}"
# Add new label (create it first if it doesn't exist)
gh api repos/{owner}/{repo}/labels -f name="ai-cycle-{cycleNumber}" \
  -f color="0075ca" 2>/dev/null || true
gh pr edit {number} --add-label "ai-cycle-{cycleNumber}"
```

---

## Step 3: Review the Code

Set status to pending:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=pending \
  -f context="ai-review/claude" \
  -f description="Review in progress"
```

**Get the diff:**
```bash
git diff {baseRefName}...HEAD
```

If the diff is empty (no changes vs base), post a comment noting this and stop.

**Read context beyond the diff:**

For each file changed in the PR, you CAN and SHOULD read the full source file
to understand context that isn't visible in the diff. Focus especially on:
- The surrounding functions of changed lines
- Interfaces or types that changed code depends on
- Existing error handling patterns in the file

Also read:
- `.claude/rules/architecture-fitness.md` if it exists
- `.claude/rules/code-quality.md` if it exists

**Read prior review comments** to avoid re-flagging addressed issues:
```bash
gh pr view {number} --json comments \
  --jq '[.comments[] | select(.body | startswith("## Claude Code Review"))] | last'
```

**Read prior developer evaluation comments** (this is a re-review after fixes):
```bash
gh pr view {number} --json comments \
  --jq '[.comments[] | select(.body | startswith("## Developer Evaluation"))] | last'
```

**Review focus:**
- Bugs and logic errors (highest priority)
- Security vulnerabilities: injection, auth bypass, data exposure, hardcoded secrets
- Missing error handling on external calls, file I/O, and network requests
- Performance: N+1 queries, unbounded loops, blocking calls in async contexts
- Breaking API changes (removed fields, changed types, renamed endpoints)

**Do NOT flag:**
- Minor style preferences not backed by existing project conventions
- Issues already addressed in prior reviews
- Issues where the developer's rebuttal in a prior `## Developer Evaluation`
  comment gave a valid context-based justification

**Produce a structured verdict** (hold in memory — do not output as raw JSON):

```
verdict: "clean" | "issues_found"
issues: [
  {
    file: string,
    line: number | null,
    severity: "critical" | "major" | "minor",
    description: string,
    suggested_fix: string | null,
    fix_confidence: "confident" | "uncertain" | "no_fix",
    context_sufficient: boolean  // false = reviewer unsure due to limited diff context
  }
]
summary: string
```

---

## Step 4: Route on Verdict

**If verdict is `clean`** (or all issues have `context_sufficient: false`):

Post review comment:
```bash
gh pr comment {number} --body "## Claude Code Review

{summary}

No actionable issues found.
{list any context_sufficient:false items as informational only, prefixed with ℹ️}"
```

Set status success:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=success \
  -f context="ai-review/claude" \
  -f description="Review passed"
```

**Proceed to Step 6 (Run Tests).**

**If verdict is `issues_found`** (at least one issue with `context_sufficient: true`):

Post review comment listing all issues:
```bash
gh pr comment {number} --body "## Claude Code Review

{summary}

{for each issue:
  ### {SEVERITY}: {file}:{line}
  {description}
  **Suggested fix** ({fix_confidence}): {suggested_fix}
  [ℹ️ Informational only — may not be an issue with full context] (if context_sufficient:false)
}"
```

Set status failure:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=failure \
  -f context="ai-review/claude" \
  -f description="Review found {count} issue(s)"
```

**Proceed to Step 5 (Evaluate and Fix).**

---

## Step 5: Evaluate and Fix Issues

Switch roles: you are now the **developer** working on this PR.

For each issue from Step 3 where `context_sufficient: true`:

Read the full source file for each issue. Evaluate with full repo context:

**A) VALID** — The issue is real and worth fixing. Fix it.

**B) CONTEXT_INSUFFICIENT** — The reviewer flagged this based on a partial diff,
but with full repo access the code is correct. Explain specifically what context
the reviewer was missing and why the code is correct.

**C) NOT_WORTH_IMPLEMENTING** — The suggestion is technically valid but the
implementation cost outweighs the benefit for this PR.
IMPORTANT: Never use this for critical/major bugs or security issues.
Only valid for minor stylistic suggestions, premature optimizations, or
architectural preferences that don't affect correctness.

**For VALID issues:** Fix the code, then:
```bash
git add {changed files}
git commit -m "[ai-fix] Address review feedback: {brief one-line summary}"
```

**For CONTEXT_INSUFFICIENT or NOT_WORTH_IMPLEMENTING:** Document the reasoning.
Do NOT change the code.

**Safety escalation check:**

After evaluating all issues, check:
- Is `cycleNumber >= cycleLimit`?
- AND did you dismiss any issue as `NOT_WORTH_IMPLEMENTING` (not `CONTEXT_INSUFFICIENT`)
  where the original `severity` was `critical` OR the description mentions security?

If both conditions are true: the pipeline is stuck at the cycle limit with a developer
dismissing a critical/security finding. Human judgment is needed.

1. Post a comment showing both the reviewer's finding and the developer's dismissal.
2. Add label `needs-human-review`.
3. Send notification email.
4. **STOP. Proceed to Step 9 (Cleanup) then exit.**

**Routing after evaluation:**

If any fixes were committed (`[ai-fix]` commits exist):
```bash
git push origin HEAD
```
Set review status back to pending (re-review will begin).
**Loop back to Step 2** with `cycleNumber += 1`.

If all issues were dismissed (no commits):
Post a developer evaluation comment:
```bash
gh pr comment {number} --body "## Developer Evaluation

{summary of evaluation}

{for each issue:
  ### {icon} Issue: {file}
  **Disposition:** {fixed | context_insufficient | not_worth_implementing}
  **Reasoning:** {specific explanation with file/line references}
}"
```

Set review status to success:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=success \
  -f context="ai-review/claude" \
  -f description="Review issues addressed"
```

**Proceed to Step 6 (Run Tests).**

---

## Step 6: Run Tests

Set test status to pending:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=pending \
  -f context="tests/claude" \
  -f description="Test execution in progress"
```

**Detect the test runner:**

If `testCommand` is set in config, use that. Otherwise check in this order:
- `package.json` with a `test` script → `npm test`
- `*.csproj` or `*.sln` in repo root → `dotnet test`
- `pytest.ini`, `pyproject.toml`, or `setup.py` → `pytest`
- `go.mod` → `go test ./...`
- If none found: note "No test suite detected" and proceed to Step 7.

**Run tests.** You MUST execute the test suite yourself — do not describe tests
for a human to run.

If the PR changes functionality not covered by existing tests, write and run
additional targeted verification:
- HTTP endpoints: use `curl` or `Invoke-WebRequest`
- CLI tools: invoke directly
- File generators: run the generator and verify output exists and is parseable

**If all tests pass:**

Post comment:
```bash
gh pr comment {number} --body "## Test Execution Results

{summary}

{for each test: ✅/❌ **{name}**: {details}}"
```

Set status:
```bash
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=success \
  -f context="tests/claude" \
  -f description="All tests passed"
```

**Proceed to Step 7 (Pre-Merge Readiness).**

**If tests fail with a code bug you can fix:**

Fix the code, re-run the failing test to confirm it passes, then:
```bash
git add {changed files}
git commit -m "[ai-fix] Fix test failure: {brief description}"
git push origin HEAD
```

**Loop back to Step 2** with `cycleNumber += 1` (the push triggers re-review).

**If tests are blocked** (cannot execute due to genuinely external requirements):

The ONLY acceptable reasons for escalation:
- A test requires a running external service you cannot start
- A test requires credentials or secrets you don't have access to
- A test requires physical hardware interaction
- A test requires visual inspection only a human can perform

If you CAN approximate the verification (mock the dependency, check output
format, validate logic without the live service), DO THAT instead of escalating.

For genuine blocks:
```bash
gh pr comment {number} --body "## Test Execution Results — Blocked

{for each blocked item:
  - **{description}**: {why Claude cannot execute this test}
}"
```

Add label and set status:
```bash
gh pr edit {number} --add-label "needs-human-review"
gh api repos/{owner}/{repo}/statuses/{sha} \
  -f state=failure \
  -f context="tests/claude" \
  -f description="Test execution blocked — human verification required"
```

Send notification email (see Notification Helper). Include the blocked items
and the PR URL so the human can decide: merge manually or fix the environment.

**STOP. Proceed to Step 9 (Cleanup) then exit.**

---

## Step 7: Pre-Merge Readiness

Both pipeline checks (`ai-review/claude` and `tests/claude`) are green.
Before merging, confirm all OTHER required checks have also passed.

Poll with backoff:
```bash
gh pr checks {number} --json name,state,status,conclusion
```

Repeat every `mergeWait.pollIntervalSeconds` seconds (default 30) until:
- All checks have a `conclusion` of `success` or `skipped` → proceed to Step 8
- Any check has `conclusion` of `failure` or `cancelled` → escalate (see below)
- Total wait exceeds `mergeWait.timeoutMinutes` (default 15 min) → escalate

**If an external check fails or times out:**

Send notification email listing which check(s) failed/timed out.
Set a label: `gh pr edit {number} --add-label "ci-failure"`
**STOP. Proceed to Step 9 (Cleanup) then exit.**

Note: do NOT post a PR comment about the failure — the CI system typically
already posts its own failure details.

---

## Step 8: Auto-Merge

All checks are green. If `autoMerge` is false in config, post a comment
notifying the user that the PR is ready to merge manually, then stop.

**Attempt merge:**
```bash
gh pr merge {number} --{mergeMethod} --delete-branch
```
(Default `mergeMethod` is `squash`.)

**If merge succeeds:**

Post a final summary comment:
```bash
gh pr comment {number} --body "## PR Pipeline Complete

Reviewed, tested, and merged automatically.

- Review cycles: {cycleNumber}
- Fixes applied: {count of [ai-fix] commits}
- Tests executed: {count} ({passed} passed)"
```

**If merge fails — attempt self-resolution first:**

Check the failure reason:
- **Merge conflict:** Pull base branch, resolve conflicts, commit, push, then
  loop back to Step 7 (wait for checks on the resolution commit):
  ```bash
  git fetch origin {baseRefName}
  git merge origin/{baseRefName}
  # Resolve conflicts by reading both versions and choosing the correct merge
  git add {conflicted files}
  git commit -m "[ai-fix] Resolve merge conflict with {baseRefName}"
  git push origin HEAD
  ```
- **Branch out of date (not a conflict):** Rebase or merge base and retry.
- **PR already merged:** No action needed, skip to cleanup.
- **PR closed or draft:** Post a comment noting the unexpected state, stop.

**If merge fails with a reason the pipeline cannot resolve** (branch protection
rule the pipeline can't satisfy, admin approval required, etc.):

```bash
gh pr edit {number} --add-label "needs-human-review"
```

Send notification email with the failure reason and PR URL.
**STOP. Proceed to Step 9 (Cleanup) then exit.**

---

## Step 9: Cleanup

Remove the `ai-pipeline-active` label (n8n sets it before spawning; the pipeline owns removal):
```bash
gh pr edit {number} --remove-label "ai-pipeline-active" 2>/dev/null || true
```


---

## Notification Helper

When a notification email is needed, read `notification.email` and
`notification.from` from config. If `notification.email` is empty, skip email
and post a PR comment instead.

If email is configured, read the Resend API key:
```bash
# Try environment first, fall back to Bitwarden
RESEND_KEY="${RESEND_API_KEY:-$(bw get item 'Resend API Key' --session $BW_SESSION 2>/dev/null | \
  node -e 'let d=""; process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).notes))' 2>/dev/null)}"
```

Send via Resend:
```bash
curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "{notification.from}",
    "to": ["{notification.email}"],
    "subject": "PR Pipeline: {reason} — {repo}#{prNumber}",
    "html": "{formatted HTML with PR URL, reason, and relevant details}"
  }'
```

---

## Integration with Sprint Workflow

The sprint workflow invokes `/aam-pr-pipeline` in-session after creating a PR.
When the pipeline completes successfully (PR merged), control returns to the
sprint workflow which continues to the next issue.

When the pipeline escalates, the PR label (`needs-human-review`, `ci-failure`,
`ai-cycle-{N}`) indicates the current state. The sprint workflow stops and
notifies the user. Resolve the issue, then re-invoke `/aam-pr-pipeline` to
resume.

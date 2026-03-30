---
description: Pre-PR code review using specialist subagents
user-invocable: true
effort: high
---

# /aam-self-review - Pre-PR Code Review

Run a focused code review before creating a pull request. Spawns a review subagent with a specific lens so the review is context-efficient — it reads the diff and relevant rules, not the entire codebase.

---

## Step 1: Get the Diff

Get the diff for the current branch vs main (or the base branch):

```bash
git diff main...HEAD
```

If the diff is empty: tell the user "No changes vs main — nothing to review."

Also read:
- `.claude/rules/architecture-fitness.md` if it exists (structural constraints to enforce)
- `.claude/rules/code-quality.md` if it exists (quality standards for this project)

---

## Step 2: Choose Review Lens

During autonomous sprint execution: always run all five lenses — do not ask.

When invoked manually, ask the user which lens to apply (or accept all three for a full review):

**A) Security** — injection, auth bypass, data exposure, hardcoded secrets
**B) Performance** — N+1 queries, unbounded loops, missing indexes, blocking I/O
**C) API Design** — consistency with existing endpoints, naming conventions, error response shapes
**D) Cost Impact** — paid API call patterns, retry/fallback designs that could cause runaway costs, unbounded batch sizes sent to paid services
**E) UX Friction** — confusing error messages, inconsistent CLI output, missing feedback, poor discoverability
**F) All five** (default)

---

## Step 3: Run the Review

For each selected lens, use the Agent tool to spawn a review subagent. Pass the diff and the lens-specific prompt. Do not pass the entire codebase — the subagent works from the diff only.

### Security Lens prompt:
```
You are a security code reviewer. Review the following diff for security issues only.

Focus on:
- Injection vulnerabilities (SQL, command, path traversal, template injection)
- Authentication and authorization gaps (missing auth checks, IDOR, privilege escalation)
- Sensitive data exposure (secrets in code, PII in logs, unencrypted storage)
- Input validation gaps (missing validation on user-supplied data)
- Dependency vulnerabilities (new packages added — flag any known risky ones)

For each issue found: state the file, line range, issue type, severity (High/Medium/Low), and a one-line fix recommendation.
If no issues found: state "Security review: no issues found."

DIFF:
[paste diff here]
```

### Performance Lens prompt:
```
You are a performance code reviewer. Review the following diff for performance issues only.

Focus on:
- N+1 query patterns (loops that trigger database calls)
- Unbounded operations (loops or queries with no limit on result size)
- Synchronous blocking calls in async contexts
- Missing database indexes implied by new query patterns
- Memory leaks (event listeners not removed, large objects held in scope)
- Repeated expensive computations that could be cached

For each issue found: state the file, line range, issue type, severity (High/Medium/Low), and a one-line fix recommendation.
If no issues found: state "Performance review: no issues found."

DIFF:
[paste diff here]
```

### API Design Lens prompt:
```
You are an API design code reviewer. Review the following diff for API design consistency only.

Focus on:
- Endpoint naming consistency (matches the project's existing conventions)
- HTTP method correctness (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes)
- Error response shape consistency (matches existing error format)
- Status code correctness (201 for creates, 404 for not found, 422 for validation errors, etc.)
- Request/response field naming (camelCase vs snake_case — consistent with existing API)
- Breaking changes (removed fields, changed types, renamed endpoints)

For each issue found: state the file, line range, issue type, severity (High/Medium/Low), and a one-line fix recommendation.
If no issues found: state "API design review: no issues found."

DIFF:
[paste diff here]
```

### Cost Impact Lens prompt:
```
You are a cost-aware code reviewer. Review the following diff for designs that could cause unexpected costs with paid external services.

Focus on:
- Retry loops or fallback chains that re-send work to a paid API (each retry costs money)
- Fallback paths that re-process already-handled items instead of only unhandled ones
- Unbounded batch sizes sent to paid services (no cap on items per request)
- Missing circuit breakers or rate limits on paid API calls
- Error handling that swallows failures silently, causing upstream retries
- SDK or package upgrades that change API versions without updating all integration points (webhook endpoints, serialization contracts)

For each issue found: state the file, line range, issue type, severity (High/Medium/Low), and a one-line fix recommendation.
If no issues found: state "Cost impact review: no issues found."

DIFF:
[paste diff here]
```

### UX Friction Lens prompt:
```
You are a UX friction reviewer. Review the following diff for user experience issues only.

Focus on:
- Error messages that are unclear, overly technical, or missing actionable guidance
- CLI output that lacks context (e.g., silent success with no confirmation, missing --help hints)
- Inconsistent output formatting (mixed casing, inconsistent punctuation, varying emoji usage)
- Missing user feedback for long-running operations (no progress indicator, no "done" message)
- Poor discoverability (features that exist but are hard to find or invoke)
- Breaking changes to user-facing behavior without migration guidance

For each issue found: state the file, line range, issue type, severity (High/Medium/Low), and a one-line fix recommendation.
If no issues found: state "UX friction review: no issues found."

DIFF:
[paste diff here]
```

---

## Step 3b: Cross-Model Review (optional)

Check `.pr-pipeline.json` for `crossModelReview.enabled`. If `true` (or if the field is absent, skip this step):

Use the Agent tool with `model` set to `crossModelReview.model` (default: `"sonnet"`) to spawn a single consolidated review subagent. Pass it the diff and this prompt:

```
You are an independent code reviewer providing a second opinion. Review the following diff
for bugs, security issues, and correctness problems. Focus on issues the primary reviewer
might have missed — you are the safety net, not a duplicate.

Do NOT flag: style preferences, minor naming choices, or issues that are clearly intentional
design decisions.

For each issue found: state the file, line range, severity (High/Medium/Low), and a one-line
description with suggested fix.
If no issues found: state "Cross-model review: no additional issues found."

DIFF:
[paste diff here]
```

If the cross-model review finds issues not caught by the primary lenses, add them to the
consolidated report with a `[cross-model]` tag. These findings carry the same severity
weight as primary findings.

If the cross-model agent is unavailable (model not accessible, API error): log
"Cross-model review skipped: {reason}" and continue. This is a graceful degradation —
never block the review pipeline on cross-model availability.

---

## Step 4: Consolidate and Act

After all subagents complete:

1. Present a consolidated report:
   ```
   Self-Review Results

   Security:    [X issues / no issues]
   Performance: [X issues / no issues]
   API Design:  [X issues / no issues]
   Cost Impact: [X issues / no issues]

   [List all findings by severity: High → Medium → Low]
   ```

2. **If High severity issues found:** Do not proceed to PR. Fix the issues and re-run `/aam-self-review` or `/aam-quality-gate`.

3. **If Medium/Low issues only:** During autonomous sprint execution, fix them — do not ask whether to proceed. When invoked manually, ask the user: "Medium/Low issues found. Fix before PR, or proceed with issues noted in PR description? (fix / proceed)"

4. **If no issues:** Proceed directly to PR creation.

---

## Integration with Sprint Workflow

`/aam-self-review` is called by the sprint workflow before PR creation for every item. During autonomous sprint execution, address all findings by fixing them — do not prompt. Fix Medium/Low findings as well.

You can also invoke it manually at any time with `/aam-self-review`.

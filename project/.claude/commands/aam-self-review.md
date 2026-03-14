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
- `docs/strategy-roadmap.md` Quality Tier section (to calibrate review depth)

---

## Step 2: Choose Review Lens

Ask the user which lens to apply (or accept all three for a full review):

**A) Security** — injection, auth bypass, data exposure, hardcoded secrets
**B) Performance** — N+1 queries, unbounded loops, missing indexes, blocking I/O
**C) API Design** — consistency with existing endpoints, naming conventions, error response shapes
**D) All three** (default)

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

---

## Step 4: Consolidate and Act

After all subagents complete:

1. Present a consolidated report:
   ```
   Self-Review Results

   Security:    [X issues / no issues]
   Performance: [X issues / no issues]
   API Design:  [X issues / no issues]

   [List all findings by severity: High → Medium → Low]
   ```

2. **If High severity issues found:** Do not proceed to PR. Fix the issues and re-run `/aam-self-review` or `/aam-quality-gate`.

3. **If Medium/Low issues only:** Ask the user: "Medium/Low issues found. Fix before PR, or proceed with issues noted in PR description? (fix / proceed)"
   - If fix: address issues, then proceed to PR creation.
   - If proceed: add a "Review Notes" section to the PR description listing the known issues.

4. **If no issues:** Proceed directly to PR creation.

---

## Integration with Sprint Workflow

`/aam-self-review` is called by the sprint workflow before PR creation for **Rigorous** and **Comprehensive** quality tiers. For **Standard** tier it's optional. For **Lightweight** tier it's skipped.

You can also invoke it manually at any time with `/aam-self-review`.

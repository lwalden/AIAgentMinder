---
description: Pre-PR code review using specialist subagents
user-invocable: true
effort: high
---

# /aam-self-review - Pre-PR Code Review

Run a focused code review before creating a pull request. Spawns dedicated reviewer agents — each with a specific lens, read-only permissions, and its own context window.

---

## Step 1: Get the Diff

Get the diff for the current branch vs main (or the base branch):

```bash
git diff main...HEAD
```

If the diff is empty: tell the user "No changes vs main — nothing to review."

---

## Step 2: Choose Review Lens

During autonomous sprint execution: always run all five lenses — do not ask.

When invoked manually, ask the user which lens to apply:

**A) Security** — injection, auth bypass, data exposure, hardcoded secrets
**B) Performance** — N+1 queries, unbounded loops, missing indexes, blocking I/O
**C) API Design** — consistency with existing endpoints, naming conventions, error response shapes
**D) Cost Impact** — paid API call patterns, retry/fallback designs, unbounded batch sizes
**E) UX Friction** — error messages, CLI output, feedback, discoverability
**F) All five** (default)

---

## Step 3: Run the Review

For each selected lens, use the Agent tool to spawn the corresponding reviewer agent. Pass the diff as the prompt — the agent's own instructions define its focus areas and output format.

| Lens | Agent | Notes |
|---|---|---|
| Security | `security-reviewer` | `disallowedTools: [Edit, Write, Bash]`, model: sonnet, effort: high |
| Performance | `performance-reviewer` | `disallowedTools: [Edit, Write, Bash]`, model: sonnet, effort: high |
| API Design | `api-reviewer` | `disallowedTools: [Edit, Write, Bash]`, model: sonnet, effort: medium |
| Cost Impact | `cost-reviewer` | `disallowedTools: [Edit, Write, Bash]`, model: sonnet, effort: medium |
| UX Friction | `ux-reviewer` | `disallowedTools: [Edit, Write, Bash]`, model: sonnet, effort: medium |

Spawn each agent with a prompt like:
```
Review this diff for [lens] issues. The diff is:

{diff content}
```

The agent's own instructions (in `.claude/agents/{name}.md`) define the focus areas and output format. Do not duplicate the lens-specific instructions in the prompt.

Run all selected lenses in parallel when possible — they are independent.

---

## Step 3b: Cross-Model Review (optional)

Check `.pr-pipeline.json` for `crossModelReview.enabled`. If `true`:

Use the Agent tool with `model` set to `crossModelReview.model` (default: `"sonnet"`) to spawn a consolidated review subagent with this prompt:

"You are an independent code reviewer providing a second opinion. Review the diff for bugs, security issues, and correctness problems. Focus on issues the primary reviewer might have missed. Do NOT flag style preferences or intentional design decisions. For each issue: file, line range, severity, one-line description with fix. If none: 'Cross-model review: no additional issues found.'"

Pass the diff. If cross-model finds issues not caught by primary lenses, add them with a `[cross-model]` tag. If unavailable, log and continue — never block on cross-model availability.

---

## Step 3c: Judge Agent Pass

After all lens subagents complete, spawn a judge agent to evaluate the collective review quality. The judge does NOT re-review the code — it reviews the reviews.

Spawn a judge subagent with the diff AND all lens findings:

"You are a review quality judge. Evaluate whether the specialist reviews (security, performance, API design, cost impact, UX friction) were thorough: (1) Did any lens miss an obvious issue in its domain? (2) Are there cross-cutting concerns between lenses? (3) Did any lens flag a clear false positive? For each gap: which lens, file, line, severity, description. If thorough: 'Judge pass: all lenses covered their domains adequately.'"

Judge findings get a `[judge]` tag. High severity judge findings block PR creation.

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
   UX Friction: [X issues / no issues]

   [List all findings by severity: High → Medium → Low]
   ```

2. **If High severity issues found:** Do not proceed to PR. Fix the issues and re-run `/aam-self-review` or `/aam-quality-gate`.

3. **If Medium/Low issues only:** During autonomous sprint execution, fix them — do not ask whether to proceed. When invoked manually, ask the user: "Medium/Low issues found. Fix before PR, or proceed with issues noted in PR description? (fix / proceed)"

4. **If no issues:** Proceed directly to PR creation.

---

## Integration with Sprint Workflow

`/aam-self-review` is called by the sprint workflow before PR creation for every item. During autonomous sprint execution, address all findings by fixing them — do not prompt. Fix Medium/Low findings as well.

You can also invoke it manually at any time with `/aam-self-review`.

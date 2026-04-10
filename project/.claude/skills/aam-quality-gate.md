---
description: Pre-PR quality checks — build, tests, coverage, lint, security
user-invocable: true
effort: high
context: fork
---

# /aam-quality-gate - Pre-PR Quality Checks

Run this before creating any pull request. Runs the full quality checklist — all checks, every time.

---

## Step 1: Run All Checks

Execute every check in order. Fix failures before proceeding to the next check.

### Build

- [ ] **Build passes** — Run the project's build command. If it fails, fix before proceeding.

### Tests

- [ ] **Tests exist for new functionality** — For each new or changed function/module, confirm at least one test covers it.
- [ ] **Test suite passes** — Run the full test suite. Zero failing tests.
- [ ] **No debug statements** — Search for `console.log`, `debugger`, `print(`, `puts`, `binding.pry` in changed files. Remove any found.

### Negative test enforcement

- [ ] **Error paths are tested** — Read `negativeTestEnforcement` from `.pr-pipeline.json`. If `enabled` is `true` (default), search test files touched by this PR for assertions that exercise error paths — look for the configured `patterns` (e.g., `throw`, `reject`, `error`, `invalid`, `not found`). Each new function or endpoint that can fail should have at least `minNegativeTests` test(s) covering the failure case. If missing, write them before proceeding.

If `negativeTestEnforcement.enabled` is `false` in `.pr-pipeline.json`, skip this check.

### Coverage & Lint

- [ ] **Test coverage delta** — Run coverage and confirm new code is covered. Flag any untested branches in critical paths.
- [ ] **No `any` types** (TypeScript projects) — Search changed `.ts`/`.tsx` files for `: any` and `as any`. Each occurrence needs justification or fixing.
- [ ] **Linter clean** — Run the project's linter (`eslint`, `ruff`, `golangci-lint`, etc.). Zero new warnings.

### Security

- [ ] **No hardcoded secrets** — Search changed files for patterns: API keys, connection strings, passwords, tokens. None should be literal strings.
- [ ] **Error handling on external calls** — For each new call to an external service, API, or database: confirm there's explicit error handling (try/catch, `.catch()`, `if err != nil`).
- [ ] **Security scan** — Run the project's security scanner if configured (`npm audit`, `pip-audit`, `govulncheck`, `trivy`, etc.). Address any high/critical findings.

---

## Step 2: Report and Decide

After running checks:

- **All pass:** Write the gate-pass marker for hook enforcement: `bash -c 'date +%s > .quality-gate-pass'`. Then announce: "Quality gate passed. Creating PR."
- **Failures found:** List each failure with the specific file and line. Fix all failures before creating the PR. During autonomous sprint execution, fix failures without asking — do not prompt for override. Remove stale marker if present: `bash -c 'rm -f .quality-gate-pass'`.

If invoked manually outside a sprint and the user explicitly requests an override: create the PR and add a note to the PR description: "Quality gate override: [reason for override]."

---

## Integration with Sprint Workflow

This command is called automatically by the sprint workflow before each PR creation. During sprint execution, quality gate failures must be fixed — not overridden. You can also invoke it manually at any time with `/aam-quality-gate`.

# /aam-quality-gate - Pre-PR Quality Checks

Run this before creating any pull request. It enforces the quality tier declared in `docs/strategy-roadmap.md`.

---

## Step 1: Read the Quality Tier

Read `docs/strategy-roadmap.md` and find the **Quality Tier** section.

If the file is missing or the tier is placeholder: default to **Standard** and note this to the user.

---

## Step 2: Run Checks by Tier

### Lightweight

- [ ] **Build passes** — Run the project's build command. If it fails, fix before proceeding.

If all checks pass → proceed to PR creation.

### Standard (run Lightweight checks first, then:)

- [ ] **Tests exist for new functionality** — For each new or changed function/module, confirm at least one test covers it.
- [ ] **Test suite passes** — Run the full test suite. Zero failing tests.
- [ ] **No debug statements** — Search for `console.log`, `debugger`, `print(`, `puts`, `binding.pry` in changed files. Remove any found.

If all checks pass → proceed to PR creation.

### Rigorous (run Standard checks first, then:)

- [ ] **Test coverage delta** — Run coverage and confirm new code is covered. Flag any untested branches in critical paths.
- [ ] **No `any` types** (TypeScript projects) — Search changed `.ts`/`.tsx` files for `: any` and `as any`. Each occurrence needs justification or fixing.
- [ ] **Linter clean** — Run the project's linter (`eslint`, `ruff`, `golangci-lint`, etc.). Zero new warnings.

If all checks pass → proceed to PR creation.

### Comprehensive (run Rigorous checks first, then:)

- [ ] **No hardcoded secrets** — Search changed files for patterns: API keys, connection strings, passwords, tokens. None should be literal strings.
- [ ] **Error handling on external calls** — For each new call to an external service, API, or database: confirm there's explicit error handling (try/catch, `.catch()`, `if err != nil`).
- [ ] **Security scan** — Run the project's security scanner if configured (`npm audit`, `pip-audit`, `govulncheck`, `trivy`, etc.). Address any high/critical findings.

If all checks pass → proceed to PR creation.

---

## Step 3: Report and Decide

After running checks:

- **All pass:** "Quality gate passed ([Tier] tier). Creating PR."
- **Failures found:** List each failure with the specific file and line. Do not create the PR until failures are resolved unless the user explicitly overrides: "Proceed despite quality gate failure? (y/n)"

If the user overrides: create the PR and add a note to the PR description: "⚠ Quality gate override: [reason for override]."

---

## Integration with Sprint Workflow

This command is called automatically by the sprint workflow before each PR creation. You can also invoke it manually at any time with `/aam-quality-gate`.

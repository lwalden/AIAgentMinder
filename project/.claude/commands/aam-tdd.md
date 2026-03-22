# /aam-tdd - Test-Driven Development

Guided TDD workflow for implementing features through red-green-refactor cycles. This is the full methodology behind `code-quality.md`'s one-liner: "Write a failing test first. Implement the minimal solution. Refactor after green."

**Core principle:** Tests verify behavior through public interfaces, not implementation details. A good test survives internal refactors because it doesn't care about internal structure.

---

## Step 0: Read Context

Read `docs/strategy-roadmap.md` and find the **Quality Tier** section.

- **Standard tier and above:** TDD is the expected workflow. Proceed.
- **Lightweight tier:** TDD is optional. Ask: "Quality tier is Lightweight — TDD is optional. Proceed with TDD anyway? (y/n)"

Also read `.claude/rules/code-quality.md` if it exists — the skill complements that rule, not replaces it.

---

## Step 1: Planning

Before writing any code:

1. **Read existing tests** in the project to learn the test framework, naming conventions, file organization, and assertion style. Match the project's patterns.
2. **Identify the public interface** — what functions, endpoints, or APIs will callers use? Aim for a small interface with deep implementation (fewer methods, simpler parameters, complexity hidden inside).
3. **List 3-7 behaviors to test** — describe what the system does, not how. Each behavior should be observable through the public interface.
   - Good: "returns 404 when user not found"
   - Bad: "calls findById with the user ID"
4. **Design for testability** — accept dependencies as parameters instead of creating them internally. Return results instead of producing side effects. Keep the surface area small.
5. **Present the test plan** to the user for approval.

You cannot test everything. Focus testing effort on critical paths and complex logic, not every edge case. Confirm priorities with the user.

---

## Step 2: Tracer Bullet

Write ONE test that confirms ONE thing about the system — the simplest vertical slice of the feature.

```
RED:   Write the test → it fails (confirms test infrastructure works)
GREEN: Write minimal code to pass → it passes
```

This is the tracer bullet — it proves the end-to-end path works and establishes the pattern for subsequent cycles.

**Vertical slices, not horizontal layers.** Your first test should touch the real entry point and produce a real result, even if simplified. Do not write all tests first then all implementation — that produces tests of imagined behavior.

---

## Step 3: Incremental Loop

For each remaining behavior from the test plan:

```
RED:   Write the next test → it fails
GREEN: Write minimal code to pass → it passes
```

Rules:
- One test at a time
- Only enough code to pass the current test
- Do not anticipate future tests
- Keep tests focused on observable behavior

**Mocking guidance:** Mock at system boundaries only — network calls, filesystem, clock, randomness. Do not mock your own modules or internal collaborators. Use dependency injection to swap external implementations in tests. Prefer specific mock functions per operation over a single generic mock.

**Test quality check per cycle:**
- [ ] Test describes behavior, not implementation
- [ ] Test uses the public interface only
- [ ] Test would survive an internal refactor
- [ ] Code is minimal for this test
- [ ] No speculative features added

---

## Step 4: Refactor

All tests are green. Now look for refactor candidates:

- **Duplication** — extract shared logic into functions
- **Long methods** — break into private helpers (keep tests on the public interface)
- **Shallow modules** — if a module's interface is as complex as its implementation, combine or deepen it
- **Feature envy** — logic that uses another module's data more than its own belongs in that other module
- **Primitive obsession** — raw strings or numbers where a domain type would add clarity
- **Existing code** the new code reveals as problematic

Run tests after each refactor step. Never refactor while RED — get to GREEN first.

---

## When to Use This

- **Use `/aam-tdd`** when starting a new feature or when the test plan is non-obvious.
- **Use `code-quality.md`** (loaded automatically at Standard+ tiers) for day-to-day TDD discipline without the full structured workflow.
- Pairs well with `/aam-triage` — triage produces a fix plan as RED-GREEN cycles that this skill can execute.

---

*Adapted from [mattpocock/skills/tdd](https://github.com/mattpocock/skills) (MIT license).*

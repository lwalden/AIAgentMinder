---
description: Architecture fitness rules — structural constraints for this project
---

# Architecture Fitness Rules
# AIAgentMinder-managed. Customize the rules below to match your project's architecture.
# Delete this file to opt out of architecture fitness enforcement.

## How to Use This File

These rules are enforced by Claude during code review, PR creation, and when writing new code.
Replace the examples below with constraints that match YOUR project's architecture.
Each rule should be specific enough that Claude can check it mechanically.

Rules that apply only to certain file types can be scoped with glob patterns in the frontmatter:
```yaml
globs: ["src/routes/**", "src/handlers/**"]
```

---

## Structural Constraints

<!-- Replace these examples with your own. Remove sections that don't apply. -->

### Layer Boundaries

<!-- Example: Enforce separation between layers -->
<!-- Route handlers must not import from the database layer directly.
     All database access goes through the service layer.
     Bad: import { db } from '../db' inside a route handler
     Good: import { UserService } from '../services/user' -->

[Define your layer boundary rules here]

### External API Calls

<!-- Example: Centralize external service calls -->
<!-- All calls to external HTTP services must go through clients in `src/integrations/`.
     No direct `fetch()`, `axios.get()`, or HTTP calls from route handlers or services.
     This ensures retry logic, auth headers, and error handling are applied consistently. -->

[Define where external calls are allowed here]

### Test Isolation

<!-- Example: Keep tests self-contained -->
<!-- Test files must not import from other test files.
     Each test file must be independently runnable.
     Shared fixtures belong in a `__fixtures__/` or `test/helpers/` directory, not in test files. -->

[Define your test structure rules here]

### File Size Limits

<!-- Example: Flag files that are getting too large to maintain -->
<!-- If a source file exceeds 300 lines, flag it for decomposition before adding more code.
     A file that large usually contains more than one responsibility. -->

[Define your size thresholds here]

---

## Enforcement

When writing or reviewing code:

1. Check each constraint above before creating or modifying a file in scope.
2. If a constraint would be violated: explain the rule, show the compliant alternative, and implement the compliant version.
3. If there's a legitimate exception: document it in a code comment (`// Architecture exception: [reason]`) and note it in DECISIONS.md.

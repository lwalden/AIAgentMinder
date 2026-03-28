---
description: Architecture fitness rules — structural constraints for this project
---

# Architecture Fitness Rules
# AIAgentMinder-managed. Customize the rules below to match your project's architecture.
# Delete this file to opt out of architecture fitness enforcement.

## How to Use This File

These rules are enforced by Claude during code review, PR creation, and when writing new code.
The defaults below are stack-agnostic starting points. Tighten, relax, or replace them
to match YOUR project's architecture. Remove sections that don't apply.

Rules that apply only to certain file types can be scoped with glob patterns in the frontmatter:
```yaml
globs: ["src/routes/**", "src/handlers/**"]
```

---

## Structural Constraints

### File Size

If a source file exceeds 300 lines, flag it for decomposition before adding more code.
A file that large usually contains more than one responsibility. Split by extracting
a helper, a subcomponent, or a dedicated module — don't just continue appending.

Generated files (migrations, lock files, snapshots) are exempt.

### Secrets in Source

No hardcoded credentials, API keys, tokens, passwords, or connection strings in source files.
Use environment variables, `.env` files (gitignored), secret managers (Azure Key Vault, AWS SSM,
1Password CLI, Bitwarden CLI), or framework-provided config binding.

Patterns to catch: string literals assigned to variables named `key`, `secret`, `token`,
`password`, `apiKey`, `connectionString`, `auth`; Base64-encoded blobs in config files;
URLs containing credentials (`https://user:pass@`).

### Test Isolation

Test files live in a dedicated directory (e.g., `tests/`, `__tests__/`, `*.test.*` co-located
by framework convention) — not scattered arbitrarily through source directories.

Each test file must be independently runnable. Test files must not import from other test files.
Shared fixtures and helpers belong in a dedicated test utilities location (e.g., `tests/helpers/`,
`tests/__fixtures__/`, `tests/conftest.py`), not inside individual test files.

### Layer Boundaries

External HTTP calls and direct database access belong in dedicated service or client modules —
not in route handlers, UI components, CLI entrypoints, or middleware.

This ensures retry logic, auth headers, error handling, and connection management are
centralized rather than duplicated across call sites.

Does not apply to projects with only one source file or no external dependencies.

<!-- ──────────────────────────────────────────────────────────────── -->
<!-- STACK-SPECIFIC EXAMPLES                                         -->
<!-- Uncomment rules that match your stack. Add your own below.      -->
<!-- ──────────────────────────────────────────────────────────────── -->

<!-- ### C# / .NET
     - Controllers must not inject repositories directly — go through a service layer.
     - All EF Core queries go through repository classes, not inline in controllers.
     - `<Nullable>enable</Nullable>` must be set in every .csproj. -->

<!-- ### TypeScript / React
     - UI components must not call fetch/axios directly — use hooks or service modules.
     - No `any` type annotations — use `unknown` and narrow, or define a proper type.
     - `strict: true` must be set in tsconfig.json. -->

<!-- ### Python
     - No raw SQL string concatenation — use parameterized queries or ORM.
     - `mypy --strict` must pass with zero errors.
     - No `import *` — all imports must be explicit. -->

<!-- ### Java / Spring
     - Controllers must not instantiate repositories — inject services.
     - @RequestBody parameters must have @Valid annotation.
     - No unbounded .findAll() in service layer — use pagination. -->

---

## Enforcement

When writing or reviewing code:

1. Check each constraint above before creating or modifying a file in scope.
2. If a constraint would be violated: explain the rule, show the compliant alternative, and implement the compliant version.
3. If there's a legitimate exception: document it in a code comment (`// Architecture exception: [reason]`) and note it in DECISIONS.md.

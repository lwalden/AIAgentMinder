# /aam-checkup - Installation Health Check

Validate that AIAgentMinder is correctly installed and configured in this project.

Run this after `/aam-update`, when hooks aren't firing, or when commands aren't loading.

---

## Checks

Run each check in order and report PASS / WARN / FAIL for each.

### 1. Node.js

```bash
node --version
```

- **PASS:** Node.js found — show version
- **FAIL:** Not found — "Node.js is required for hooks. Install from nodejs.org, then verify with `node --version`."

### 2. Required Files

Check that each of these exists in the project root or expected path:

| File | Missing = |
| --- | --- |
| `CLAUDE.md` | FAIL |
| `DECISIONS.md` | WARN |
| `docs/strategy-roadmap.md` | WARN — "Run /aam-brief to create" |
| `.claude/settings.json` | FAIL |

### 3. Hook Script

Check that `.claude/hooks/compact-reorient.js` exists.

- **PASS:** Found
- **FAIL:** Missing — "Hook script not found. Run /aam-update to restore it."

### 4. Hook Configuration

Read `.claude/settings.json` and verify:

- Parses as valid JSON — if not: **FAIL** — "settings.json is not valid JSON. Re-run /aam-update to restore it."
- Contains a `hooks` entry referencing `compact-reorient.js` — if missing: **WARN** — "Hook entry not found in settings.json. The compact-reorient hook may not fire."

### 5. Project Identity

Read `CLAUDE.md` and check for unfilled placeholder brackets (`[Project Name]`, `[Brief description]`, `[Language`, etc.).

- **PASS:** No placeholders found
- **WARN:** Placeholders present — "CLAUDE.md still has placeholder values. Run /aam-brief to fill them in."

### 6. Version Stamp

Read `.claude/aiagentminder-version`.

- **INFO:** Show installed version (e.g., "v1.0.0")
- **WARN if missing:** "No version stamp found. Run /aam-update to write one."

### 7. Git Status

Check git status in the project directory:

```bash
git rev-parse --is-inside-work-tree 2>/dev/null
git branch --show-current 2>/dev/null
git remote -v 2>/dev/null | head -1
```

- **INFO:** Show branch name and remote (if any)
- **INFO if no git:** "Not a git repo — consider running `git init`."

---

## Output Format

```
AIAgentMinder Health Check — v{version}

✓ Node.js: v20.11.0
✓ CLAUDE.md: found (Project Identity populated)
✓ DECISIONS.md: found
⚠ docs/strategy-roadmap.md: found but has placeholder values — run /aam-brief
✓ .claude/settings.json: valid JSON, hook entry present (compact-reorient)
✓ .claude/hooks/compact-reorient.js: found
✓ Git: branch main, remote origin configured

Status: Healthy (1 warning)
```

Use `✓` for PASS, `⚠` for WARN, `✗` for FAIL. Count warnings and failures separately.

**Status line:**

- All pass: `Status: Healthy`
- Warnings only: `Status: Healthy ({n} warning{s})`
- Any failures: `Status: Action required ({n} failure{s}, {n} warning{s})`

For each WARN or FAIL, include a one-line remediation step on the same line after a `—`.

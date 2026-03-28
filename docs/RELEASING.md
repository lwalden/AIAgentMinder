# Releasing AIAgentMinder

Manual release checklist. Run this when a coherent set of changes is ready to ship.

## Versioning Policy

Strict semver: `MAJOR.MINOR.PATCH`

| Bump | Trigger | Examples |
|------|---------|----------|
| **MAJOR** | Breaking change requiring `/aam-update` migration steps | Rename commands, remove rules, change SPRINT.md format |
| **MINOR** | New functionality, backwards compatible | New command, new rule, new script, new CLI subcommand |
| **PATCH** | Bug fix or doc correction only | Fix awk syntax, fix stale reference, typo in rule text |

Multiple PRs can land in one version. Bump once at release time, not per-PR.

## Pre-Release

1. All PRs for this version are merged to `main`
2. `git checkout main && git pull`
3. Full test suite passes: `npm test`

## Version Bump

Update all 4 version points (must match):

```
project/.claude/aiagentminder-version   (source of truth)
package.json                             (npm)
.claude-plugin/plugin.json               (plugin manifest)
.claude-plugin/marketplace.json          (marketplace listing)
```

Also update:
- `README.md` version badge
- `SKILL.md` version references
- `CHANGELOG.md` (add new version section at top)
- `docs/strategy-roadmap.md` (mark milestone shipped if applicable)

## Validate

```bash
npm test
node bin/aam.js --version    # should show new version
node bin/aam.js validate     # all consistency checks pass
```

## Commit & Tag

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
```

## GitHub Release

```bash
gh release create vX.Y.Z --generate-notes --title "vX.Y.Z -- one-line summary"
```

This creates the git tag and generates release notes from merged PRs.

## npm Publish

```bash
npm publish
```

Verify: `npm info aiagentminder version` should show the new version.

## Post-Release

- Update target repos with `/aam-update` as needed
- Announce in relevant channels if significant

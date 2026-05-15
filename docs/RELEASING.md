# Releasing AIAgentMinder

Manual release checklist. Run this when a coherent set of changes is ready
to ship. AIAgentMinder is distributed as a Claude Code plugin via a GitHub
marketplace; the release flow is git-tag-driven, not npm-publish-driven.

## Versioning Policy

Strict semver: `MAJOR.MINOR.PATCH`

| Bump | Trigger | Examples |
|------|---------|----------|
| **MAJOR** | Breaking change requiring user migration steps | Rename skills, change plugin layout, remove rules, change SPRINT.md format |
| **MINOR** | New functionality, backwards compatible | New skill, new agent, new rule, new hook |
| **PATCH** | Bug fix or doc correction only | Fix awk syntax, fix stale reference, typo in rule text |

Multiple PRs can land in one version. Bump once at release time, not per-PR.

Plugin updates propagate to users automatically when their Claude Code
auto-update polls the marketplace (third-party marketplaces have
auto-update off by default; users can toggle it via `/plugin`). The
version bump is what triggers a user-visible update notification.

## Pre-Release

1. All PRs for this version are merged to `main`.
2. `git checkout main && git pull`.
3. Full test suite passes: `npm test`.
4. Plugin manifest validation passes:
   ```bash
   node -e "import('./lib/validate.js').then(m => { const r = m.validateAll(process.cwd()); if (!r.pluginJson.valid || !r.versions.valid) { console.error(r); process.exit(1); } else { console.log('valid'); } })"
   ```
5. (Optional but recommended) Smoke-test the plugin locally with
   `--plugin-dir`:
   ```bash
   claude --plugin-dir .
   ```
   In the session, verify: `/help` shows `/aiagentminder:*` skills,
   `/agents` shows the AAM agents, and `/plugin` reports the plugin
   loaded without errors.

## Version Bump

Run the version bump script to update all 4 version points atomically:

```bash
bash bin/version-bump.sh X.Y.Z
```

This updates:
```
templates/.claude/aiagentminder-version  (source of truth — gets copied to target projects)
package.json                             (npm metadata)
.claude-plugin/plugin.json               (plugin manifest)
.claude-plugin/marketplace.json          (marketplace listing)
```

Also update manually:
- `README.md` version badge
- `CHANGELOG.md` (add new version section at top)
- `docs/strategy-roadmap.md` (mark milestone shipped if applicable)

## Validate

```bash
npm test
cat templates/.claude/aiagentminder-version   # should show new version
node -e "import('./lib/validate.js').then(m => { const r = m.validateAll(process.cwd()); console.log(r.versions.versions); })"
# All four version points should match X.Y.Z
```

## Commit & Tag

```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
git push
```

## GitHub Release

```bash
gh release create vX.Y.Z --generate-notes --title "vX.Y.Z — one-line summary"
```

This creates the git tag and generates release notes from merged PRs.
Once the tag is pushed, the marketplace.json on `main` reflects the new
version; Claude Code clients with auto-update enabled pick it up on next
launch.

## Post-Release

- **Verify the marketplace listing:** `git pull && git tag --list 'v*' | tail`
  should show the new tag, and `.claude-plugin/marketplace.json` on `main`
  should have the new version in `plugins[0].version`.
- **Communicate breaking changes:** if MAJOR, post a GitHub Discussions
  thread or issue with the migration steps from `CHANGELOG.md`.
- **Update target repos** by re-running `/aiagentminder:setup` in each
  (refreshes `.claude/rules/` and `.claude/aiagentminder-version`).
- Announce in relevant channels if significant.

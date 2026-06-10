# Migrating a Pre-5.0 Install to the Plugin Layout

Pre-5.0 AIAgentMinder installs (`npx aiagentminder init`) **copied files
into your project**: agents to `.claude/agents/`, scripts to
`.claude/scripts/`, and hook registrations into `.claude/settings.json`.
Since v5.0 the plugin serves all of that itself — agents namespaced
(`aiagentminder:sprint-master`), hooks registered via the plugin's
`hooks/hooks.json`, scripts shipped in the plugin's `bin/` and placed on
the Bash tool's PATH while the plugin is enabled.

A project initialized pre-5.0 and upgraded since is a **hybrid**: the
plugin serves the current versions while stale copies sit in the repo and
duplicate hook registrations fire twice per event. This guide cleans that
up.

## 1. Identify a legacy install

```
cat .claude/aiagentminder-version
```

Anything below `5.0` (e.g. `4.5.0`) is a legacy install. Other tells:
`.claude/agents/` containing AAM agent names (`sprint-master.md`, …),
`.claude/scripts/` containing AAM scripts, and `hooks` entries in
`.claude/settings.json` pointing at `.claude/scripts/*.sh`.

## 2. Update the plugin

In Claude Code:

```
/plugin marketplace update lwalden-aiagentminder
/reload-plugins
```

## 3. Refresh the project

```
/aiagentminder:setup
```

This refreshes `.claude/rules/` and the version stamp, and strips the
retired auto-cycle hook registrations. User-owned files (`CLAUDE.md`,
`DECISIONS.md`, `SPRINT.md`, …) are preserved.

## 4. Run the migration — dry-run first

From the project root (the script is on PATH while the plugin is enabled):

```bash
bash strip-retired-hooks.sh migrate
```

Dry-run is the default — it prints the full plan and changes nothing.
Review the report; every line is one of:

| Category | Meaning |
|---|---|
| `retire` | A stale AAM copy that matches the current plugin copy (or differs only in whitespace/line endings), or a retired AAM file with no current counterpart. Will be **moved**, never deleted. |
| `skip … DIVERGES` | An AAM-shipped filename whose content you've customized. Kept by default — re-run with `--force-divergent` only if you're sure the local edits are disposable. |
| `keep … not an AAM-shipped file` | Your property (custom agents, project test runners like `run-*-tests.*`). Never touched. |
| `keep … still referenced` | An AAM script a surviving settings entry still points at. Resolve the reference first. |
| `dedup` | Hook entries duplicating hooks the plugin already registers via `hooks.json`, plus retired hooks. |
| `repoint` | A legacy `.claude/scripts/context-monitor.sh` statusLine, repointed at the plugin copy. statusLine wiring itself stays project-level — that's intentional. |

Then apply:

```bash
bash strip-retired-hooks.sh migrate --apply
```

Retired files are **moved** to `.claude/legacy-retired-<UTC-timestamp>/`
(they're also still in git history — doubly recoverable).

## 5. Verify

- **Hooks fire once.** Start a new session; sprint reminders and context
  warnings should appear once per event, not twice.
- **Scripts resolve.** In the session, run `command -v sprint-update.sh`
  via the Bash tool — it should resolve to the plugin's `bin/`. Agents
  reference these scripts by bare name; the plugin's `bin/` on PATH is
  the mechanism, so no project-level shim is needed.
- **Status line still renders** (now served from the plugin copy).

## 6. Commit

Commit the removals and the settings changes. Once the commit is verified
(hooks fire once, a sprint command works), the
`.claude/legacy-retired-*/` backup directory can be deleted.

## Notes

- The migration is idempotent — re-running it finds nothing to do.
- It never runs `rm`, never touches files AAM didn't ship, and skips
  your customizations by default.
- `jq` is required for the hook de-dup step (file retirement works
  without it; the script tells you what was skipped).

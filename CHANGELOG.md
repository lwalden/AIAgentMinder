# Changelog

All notable changes to the Claude Code Project Template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2.1.1] - 2026-02-07

### Added
- **Prerequisites section** in README -- links to Claude Code VS Code extension, CLI docs, and GitHub CLI
- **"What It Looks Like" example** in README -- sample `/plan` conversation showing the full Q&A flow
- **CONTRIBUTING.md** -- guidelines for reporting issues, suggesting improvements, and submitting PRs
- **License and version badges** in README header
- **Windows PowerShell commands** in README manual setup (alongside macOS/Linux)
- **Platform-specific permissions note** in customization guide -- reminder to remove irrelevant OS entries

### Changed
- README Quick Start rewritten for beginners -- added `git clone` command, Download ZIP option, example prompts showing what to tell Claude in each scenario
- Strategy roadmap sections renumbered: Part 3 (Risk), Part 4 (Quality & Testing), Part 5 (Timeline), Part 6 (Human Actions) -- eliminates the "Part 3.5" patch numbering
- Deny list description in how-it-works.md corrected from "blocked even if user approves" to "Claude will refuse to run"
- README Version History replaced with link to CHANGELOG.md
- README footer consolidated (Contributing, License sections)

### Removed
- "Migrating from v1.0" section from README (v1.0 was never publicly released)
- `nul` file artifact (Windows error output leftover)

---

## [2.1.0] - 2026-02-07

### Added
- **Adaptive planning depth** in `/plan` -- pre-interview assessment gauges how formed the user's idea is (rough concept through detailed spec) and adjusts question depth accordingly
- **Quality & Testing Strategy** round in `/plan` -- determines quality tier (Lightweight / Standard / Rigorous / Comprehensive) based on project complexity, audience, and reliability needs
- **Quality tier table** in `/plan` with signal-to-tier mapping and testing approach for each level
- **Part 4: Quality & Testing Strategy** section in `docs/strategy-roadmap.md` template with checklist for unit, integration, E2E, security scanning, and performance testing
- **Verification-First Development** behavioral rule in `CLAUDE.md` -- restate requirements before implementing, write tests first for Standard+ tiers, reference acceptance criteria in PRs
- **Session Management** guidance in `CLAUDE.md` Context Budget -- `/clear` for task switching, compaction awareness, fresh session recommendations
- **"Why This Template" comparison table** in README -- feature-by-feature comparison vs. Claude Code's built-in `/init`
- **"Planning Your Project" section** in README -- highlights the `/plan` Q&A flow as a first-class feature, explains all 4 starting points
- **`docs/ARCHITECTURE.md`** template -- living architecture document for complex project types (web-app, api, mobile-app)
- **Project scale question** in `/setup` Step 2 -- personal tool / team tool / public product, used to set initial quality tier
- **ARCHITECTURE.md generation** in `/setup` Step 4 -- conditionally included based on project type
- **Initial quality tier** set by `/setup` based on project scale, refined later by `/plan`
- **Quality & Testing guidance** in `docs/strategy-creation-guide.md` -- explains quality tiers and when to use each

### Changed
- `/plan` question flow restructured: Round 3 is now Quality & Testing, former Round 3 (Unknowns) moved to Round 4
- `/plan` Project Type Adaptation table updated to include Quality & Testing row
- README version bumped to v2.1, version history updated

---

## [2.0.0] - 2026-02-07

### Added
- `project/` directory to clearly separate scaffolding files from template documentation
- 5 slash commands in `.claude/commands/`:
  - `/setup` -- guided project initialization supporting 4 onboarding scenarios (new GitHub repo, existing repo, new local project, blank local repo)
  - `/plan` -- interactive strategy roadmap creation with project-type adaptation
  - `/status` -- read-only project state summary
  - `/checkpoint` -- session end protocol (update progress, commit tracking changes)
  - `/archive` -- move old session summaries and completed tasks to `docs/archive/`
- `.claude/settings.json` -- project-scoped permissions file (replaces `settings_local.json`)
- Security deny list blocking catastrophic operations (`rm -rf /`, `rm -rf ~`, `git push --force`)
- Context Budget section in CLAUDE.md with explicit guidance on what Claude should read and when
- Context Map table in CLAUDE.md linking each file to its purpose and read frequency
- PROGRESS.md archival strategy (keep last 3 sessions, archive older entries)
- `docs/how-it-works.md` -- explains session continuity, context budget, and security model
- `docs/customization-guide.md` -- what and how to customize, extracted from README
- `docs/strategy-creation-guide.md` -- human-readable guide for creating strategy roadmaps
- Migration guide from v1.0 in README
- "Out of Scope" section in strategy-roadmap.md template
- "Human Actions Required" section in strategy-roadmap.md template
- "Unknowns & TODOs" section in strategy-roadmap.md template with structured TODO marker format
- Acceptance criteria format for features in strategy-roadmap.md

### Changed
- CLAUDE.md rewritten from 360 to 102 lines (72% reduction in per-session context)
- PROGRESS.md rewritten from 160 to 45 lines with built-in archival markers
- DECISIONS.md trimmed from 209 to 54 lines (removed redundant templates and duplicate ADR-002)
- strategy-roadmap.md trimmed from 323 to 162 lines (removed SaaS-specific sections, made modular by project type)
- .env.example reduced from 180 to 24 lines (minimal starter; `/setup` generates stack-specific variables)
- CI workflow trimmed to skeleton + security scanning (build jobs generated by `/setup`)
- Deploy workflow trimmed to scaffold (deployment steps generated by `/setup`)
- dependabot.yml reduced to GitHub Actions only (package ecosystem added by `/setup`)
- README.md rewritten with 4 clear onboarding scenarios and accurate file references
- Session resume checklist consolidated into CLAUDE.md (removed duplicate from PROGRESS.md)
- Git workflow rules consolidated into CLAUDE.md Behavioral Rules (removed duplicate ADR-002 from DECISIONS.md)

### Removed
- `STRATEGY-GUIDE.md` -- replaced by `/plan` slash command and `docs/strategy-creation-guide.md`
- `PROMPT-strategy-creation.md` -- replaced by `/plan` slash command
- `settings_local.json` -- replaced by `project/.claude/settings.json`
- Dangerous permissions from settings: `rm:*`, `git reset:*`, `git rebase:*`, `kill:*`, `pkill:*`, `killall:*`, `chmod:*`, `chown:*`, `terraform destroy:*`, `pulumi destroy:*`, `kubectl delete:*`, `docker rm:*`, `docker rmi:*`, `docker system:*`
- Phase task definitions from CLAUDE.md (belong in PROGRESS.md and strategy-roadmap.md)
- Sub-Agent Delegation section from CLAUDE.md (Claude handles natively)
- Checkpoint Protocol section from CLAUDE.md (replaced by `/checkpoint` command)
- Error Recovery section from CLAUDE.md (generic advice Claude already knows)
- Communication Style section from CLAUDE.md (condensed to 3 bullets in Behavioral Rules)
- Technology Stack placeholder from CLAUDE.md (generated by `/setup`)
- Project Structure placeholder from CLAUDE.md (generated by `/setup`)
- Success Criteria placeholder from CLAUDE.md (moved to strategy-roadmap.md)
- External Services table from CLAUDE.md (moved to strategy-roadmap.md)
- Environment & Resources section from PROGRESS.md (belongs in strategy-roadmap.md)
- Recurring Tasks section from PROGRESS.md (unused in practice)
- Session template block from PROGRESS.md (Claude knows markdown)
- Decision template blocks from DECISIONS.md (Claude knows ADR format)
- Superseded Decisions section from DECISIONS.md (one-line note replaces it)
- Launch Strategy section from strategy-roadmap.md (optional, project-type-dependent)
- Cost estimates sub-tables from strategy-roadmap.md
- Resources & References section from strategy-roadmap.md
- All commented-out language-specific CI jobs (generated by `/setup` instead)
- All commented-out deployment platform stubs (generated by `/setup` instead)
- All commented-out dependabot package ecosystems (added by `/setup` instead)
- Kitchen-sink environment variables from .env.example (Web3, Telegram, Datadog, etc.)

### Security
- Removed 14 dangerous permission patterns from settings that allowed destructive operations
- Added explicit deny list for catastrophic commands
- Renamed and relocated permissions file to `.claude/settings.json` (Claude Code native location)

---

## [1.0.0]

### Added
- Initial release with comprehensive templates
- CLAUDE.md development orchestration file
- PROGRESS.md session continuity tracker
- DECISIONS.md architectural decision record
- docs/strategy-roadmap.md project planning template
- STRATEGY-GUIDE.md for AI-assisted strategy creation
- PROMPT-strategy-creation.md ready-to-copy prompt
- settings_local.json with 500+ pre-approved permissions
- .env.example with 180 environment variable templates
- .gitignore covering all major language ecosystems
- GitHub Actions CI workflow with multi-language support
- GitHub Actions deploy workflow with multi-environment support
- Dependabot configuration for 10+ package ecosystems
- MIT License

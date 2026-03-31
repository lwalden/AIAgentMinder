/**
 * Version-chained migration registry.
 *
 * Each entry describes file operations needed when upgrading TO that version.
 * getMigrations(from, to) walks the chain and accumulates operations.
 *
 * To add a new migration: append an entry with the target version.
 * The sync command applies these after computing the file diff.
 */

/**
 * @typedef {Object} Migration
 * @property {string} version - Target version (applied when upgrading TO this version)
 * @property {string} description - Human-readable summary
 * @property {string[]} delete - Files to delete from the target
 * @property {Array<{from: string, to: string}>} rename - Files to rename/move
 */

/** @type {Migration[]} */
export const MIGRATIONS = [
  {
    version: '0.7.0',
    description: 'guidance/ → rules/ migration, remove obsolete hooks',
    delete: [
      '.claude/hooks/session-start-context.js',
      '.claude/hooks/session-end-timestamp.js',
      '.claude/hooks/pre-compact-save.js',
    ],
    rename: [
      { from: '.claude/guidance/code-quality.md', to: '.claude/rules/code-quality.md' },
      { from: '.claude/guidance/sprint-workflow.md', to: '.claude/rules/sprint-workflow.md' },
    ],
  },
  {
    version: '0.8.0',
    description: 'Remove stop hook, rename plan → aam-brief',
    delete: [
      '.claude/hooks/session-end-commit.js',
    ],
    rename: [
      { from: '.claude/commands/plan.md', to: '.claude/commands/aam-brief.md' },
    ],
  },
  {
    version: '1.0.0',
    description: 'Remove PROGRESS.md (session continuity is native)',
    delete: [
      'PROGRESS.md',
    ],
    rename: [],
  },
  {
    version: '2.2.0',
    description: 'Remove pr-pipeline-trigger.js (pipeline runs in-session)',
    delete: [
      '.claude/hooks/pr-pipeline-trigger.js',
    ],
    rename: [],
  },
  {
    version: '3.2.0',
    description: 'Remove compact-reorient.js (replaced by status line monitoring)',
    delete: [
      '.claude/hooks/compact-reorient.js',
    ],
    rename: [],
  },
  {
    version: '4.0.0',
    description: 'Commands → skills migration',
    delete: [],
    rename: [
      { from: '.claude/commands/aam-brief.md', to: '.claude/skills/aam-brief.md' },
      { from: '.claude/commands/aam-checkup.md', to: '.claude/skills/aam-checkup.md' },
      { from: '.claude/commands/aam-grill.md', to: '.claude/skills/aam-grill.md' },
      { from: '.claude/commands/aam-handoff.md', to: '.claude/skills/aam-handoff.md' },
      { from: '.claude/commands/aam-milestone.md', to: '.claude/skills/aam-milestone.md' },
      { from: '.claude/commands/aam-pr-pipeline.md', to: '.claude/skills/aam-pr-pipeline.md' },
      { from: '.claude/commands/aam-quality-gate.md', to: '.claude/skills/aam-quality-gate.md' },
      { from: '.claude/commands/aam-retrospective.md', to: '.claude/skills/aam-retrospective.md' },
      { from: '.claude/commands/aam-revise.md', to: '.claude/skills/aam-revise.md' },
      { from: '.claude/commands/aam-scope-check.md', to: '.claude/skills/aam-scope-check.md' },
      { from: '.claude/commands/aam-self-review.md', to: '.claude/skills/aam-self-review.md' },
      { from: '.claude/commands/aam-sync-issues.md', to: '.claude/skills/aam-sync-issues.md' },
      { from: '.claude/commands/aam-tdd.md', to: '.claude/skills/aam-tdd.md' },
      { from: '.claude/commands/aam-triage.md', to: '.claude/skills/aam-triage.md' },
    ],
  },
  {
    version: '4.1.0',
    description: 'Mode-specific rules → session profile agents',
    delete: [
      '.claude/rules/scope-guardian.md',
      '.claude/rules/approach-first.md',
      '.claude/rules/debug-checkpoint.md',
      '.claude/rules/code-quality.md',
      '.claude/rules/sprint-workflow.md',
      '.claude/rules/architecture-fitness.md',
    ],
    rename: [],
  },
  {
    version: '4.2.0',
    description: 'Deterministic sync — cleanup empty hooks directory',
    delete: [
      // Plugin skills lived in AAM repo (skills/), not in target projects.
      // No target-side files to delete. This entry ensures the hooks directory
      // left empty by prior migrations is cleaned up.
    ],
    rename: [],
  },
];

/**
 * Compare two semver strings.
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
function compareSemver(a, b) {
  const [aMaj, aMin, aPat] = a.split('.').map(Number);
  const [bMaj, bMin, bPat] = b.split('.').map(Number);
  return aMaj - bMaj || aMin - bMin || aPat - bPat;
}

/**
 * Get all migrations needed to upgrade from one version to another.
 *
 * @param {string|null} fromVersion - Currently installed version (null = fresh install)
 * @param {string} toVersion - Target version
 * @returns {Migration[]} Migrations to apply, in order
 */
export function getMigrations(fromVersion, toVersion) {
  // Fresh install needs no migrations — sync handles everything
  if (fromVersion === null) return [];

  // Same version — nothing to do
  if (fromVersion === toVersion) return [];

  // Return all migrations where: fromVersion < migration.version <= toVersion
  return MIGRATIONS.filter(m => {
    return compareSemver(m.version, fromVersion) > 0 &&
           compareSemver(m.version, toVersion) <= 0;
  });
}

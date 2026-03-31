import fs from 'node:fs';
import path from 'node:path';

/**
 * Map from target filename to source filename when they differ.
 * The template stores settings.json.tpl to avoid Claude Code treating it as config.
 */
const SOURCE_OVERRIDES = {
  '.claude/settings.json': '.claude/settings.json.tpl',
};

/**
 * Inverse of SOURCE_OVERRIDES: source filename → target filename.
 */
const TARGET_OVERRIDES = Object.fromEntries(
  Object.entries(SOURCE_OVERRIDES).map(([target, source]) => [source, target])
);

/**
 * Files that should never be overwritten once they exist in the target.
 * They are only added if missing.
 */
const USER_OWNED_FILES = new Set([
  'DECISIONS.md',
  'BACKLOG.md',
  'SPRINT.md',
  'docs/strategy-roadmap.md',
  '.gitignore',
  '.pr-pipeline.json',
]);

/**
 * Files that require surgical merge (human/LLM judgment), not overwrite.
 */
const HYBRID_FILES = new Set([
  'CLAUDE.md',
]);

/**
 * Files that require deterministic JSON merge (settings).
 */
const MERGE_FILES = new Set([
  '.claude/settings.json',
]);

/**
 * Classify a file by ownership type.
 *
 * @param {string} relativePath - Path relative to project root (forward slashes)
 * @returns {'aam-owned' | 'aam-owned-merge' | 'hybrid' | 'user-owned'}
 */
export function classifyFile(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');

  if (MERGE_FILES.has(normalized)) return 'aam-owned-merge';
  if (HYBRID_FILES.has(normalized)) return 'hybrid';
  if (USER_OWNED_FILES.has(normalized)) return 'user-owned';

  // Everything else under .claude/ is aam-owned
  if (normalized.startsWith('.claude/')) return 'aam-owned';

  // Anything else not explicitly classified is user-owned
  return 'user-owned';
}

/**
 * Walk a directory recursively and return relative file paths.
 *
 * @param {string} dir - Absolute path to walk
 * @param {string} [prefix=''] - Current path prefix for recursion
 * @returns {string[]} Relative paths with forward slashes
 */
function walkDir(dir, prefix = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Compute a sync plan between a template directory and a target installation.
 *
 * @param {string} templateDir - Absolute path to the template (project/) directory
 * @param {string} targetDir - Absolute path to the target project
 * @returns {{
 *   installedVersion: string|null,
 *   templateVersion: string,
 *   adds: Array<{file: string, classification: string}>,
 *   updates: Array<{file: string, classification: string}>,
 *   merge: Array<{file: string, classification: string}>,
 *   hybrid: Array<{file: string, classification: string}>,
 *   skipped: Array<{file: string, classification: string, reason: string}>,
 * }}
 */
export function computeSyncPlan(templateDir, targetDir) {
  // Read versions
  const templateVersionPath = path.join(templateDir, '.claude', 'aiagentminder-version');
  const templateVersion = fs.existsSync(templateVersionPath)
    ? fs.readFileSync(templateVersionPath, 'utf-8').trim()
    : 'unknown';

  const targetVersionPath = path.join(targetDir, '.claude', 'aiagentminder-version');
  const installedVersion = fs.existsSync(targetVersionPath)
    ? fs.readFileSync(targetVersionPath, 'utf-8').trim()
    : null;

  // Walk template to discover all files
  const templateFiles = walkDir(templateDir);

  const adds = [];
  const updates = [];
  const merge = [];
  const hybrid = [];
  const skipped = [];

  for (const sourceFile of templateFiles) {
    // Resolve target filename (handle SOURCE_OVERRIDES)
    const targetFile = TARGET_OVERRIDES[sourceFile] || sourceFile;
    const classification = classifyFile(targetFile);
    const targetPath = path.join(targetDir, targetFile);
    const exists = fs.existsSync(targetPath);

    const entry = { file: targetFile, classification };

    switch (classification) {
      case 'aam-owned':
        if (exists) {
          updates.push(entry);
        } else {
          adds.push(entry);
        }
        break;

      case 'aam-owned-merge':
        if (exists) {
          merge.push(entry);
        } else {
          adds.push(entry);
        }
        break;

      case 'hybrid':
        if (exists) {
          hybrid.push(entry);
        } else {
          adds.push(entry);
        }
        break;

      case 'user-owned':
        if (exists) {
          skipped.push({ ...entry, reason: 'user-owned, already exists' });
        } else {
          adds.push(entry);
        }
        break;
    }
  }

  return {
    installedVersion,
    templateVersion,
    adds,
    updates,
    merge,
    hybrid,
    skipped,
  };
}

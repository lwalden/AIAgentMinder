import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_PLUGIN_FIELDS = ['name', 'version', 'description'];

/**
 * Validate .claude-plugin/plugin.json structure and required fields.
 *
 * @param {string} repoDir - Root of the AIAgentMinder repo
 * @returns {{ valid: boolean, errors: string[], data: object|null }}
 */
export function validatePluginJson(repoDir) {
  const errors = [];
  const pluginPath = path.join(repoDir, '.claude-plugin', 'plugin.json');

  if (!fs.existsSync(pluginPath)) {
    return { valid: false, errors: ['.claude-plugin/plugin.json not found'], data: null };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
  } catch {
    return { valid: false, errors: ['Failed to parse .claude-plugin/plugin.json'], data: null };
  }

  for (const field of REQUIRED_PLUGIN_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`plugin.json missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors, data };
}

/**
 * Validate version consistency across plugin.json, package.json, and template version stamp.
 *
 * @param {string} repoDir
 * @returns {{ valid: boolean, errors: string[], versions: object }}
 */
export function validateVersionConsistency(repoDir) {
  const errors = [];
  const versions = {};

  // Template version (source of truth)
  const templateVersionPath = path.join(repoDir, 'project', '.claude', 'aiagentminder-version');
  if (fs.existsSync(templateVersionPath)) {
    versions.template = fs.readFileSync(templateVersionPath, 'utf-8').trim();
  } else {
    errors.push('Template version file (project/.claude/aiagentminder-version) not found');
  }

  // package.json version
  const pkgPath = path.join(repoDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      versions.packageJson = pkg.version;
    } catch {
      errors.push('Failed to parse package.json');
    }
  }

  // plugin.json version
  const pluginPath = path.join(repoDir, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginPath)) {
    try {
      const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
      versions.pluginJson = plugin.version;
    } catch {
      errors.push('Failed to parse plugin.json');
    }
  }

  // marketplace.json version
  const marketplacePath = path.join(repoDir, '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(marketplacePath)) {
    try {
      const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf-8'));
      if (marketplace.plugins && marketplace.plugins[0]) {
        versions.marketplaceJson = marketplace.plugins[0].version;
      }
    } catch {
      errors.push('Failed to parse marketplace.json');
    }
  }

  // Compare: all should match the template version
  if (versions.template) {
    if (versions.packageJson && versions.packageJson !== versions.template) {
      errors.push(`package.json version (${versions.packageJson}) does not match template (${versions.template})`);
    }
    if (versions.pluginJson && versions.pluginJson !== versions.template) {
      errors.push(`plugin.json version (${versions.pluginJson}) does not match template (${versions.template})`);
    }
    if (versions.marketplaceJson && versions.marketplaceJson !== versions.template) {
      errors.push(`marketplace.json version (${versions.marketplaceJson}) does not match template (${versions.template})`);
    }
  }

  return { valid: errors.length === 0, errors, versions };
}

/**
 * Run all validations on the AIAgentMinder repo.
 *
 * @param {string} repoDir
 * @returns {{ pluginJson: object, skills: object, versions: object }}
 */
export function validateAll(repoDir) {
  return {
    pluginJson: validatePluginJson(repoDir),
    versions: validateVersionConsistency(repoDir),
  };
}

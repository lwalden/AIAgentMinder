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

  // Template version (source of truth) — moved to templates/.claude/ in v5.0
  const templateVersionPath = path.join(repoDir, 'templates', '.claude', 'aiagentminder-version');
  if (fs.existsSync(templateVersionPath)) {
    versions.template = fs.readFileSync(templateVersionPath, 'utf-8').trim();
  } else {
    errors.push('Template version file (templates/.claude/aiagentminder-version) not found');
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
 * Validate the plugin's on-disk component layout. Plugins ship components in
 * convention-named directories at the plugin root, so verifying those exist
 * and are populated is the cheapest reliable smoke test short of running
 * Claude Code against `--plugin-dir`.
 *
 * Checks:
 *  - agents/ exists and has at least one .md file
 *  - skills/ exists with at least one <name>/SKILL.md folder
 *  - bin/ exists and shell scripts are executable
 *  - hooks/hooks.json exists and parses; every referenced script resolves
 *    to bin/ (we substitute ${CLAUDE_PLUGIN_ROOT} with repoDir for the check)
 *  - templates/ exists with the expected bootstrap files
 *
 * @param {string} repoDir
 * @returns {{ valid: boolean, errors: string[], summary: object }}
 */
export function validatePluginLayout(repoDir) {
  const errors = [];
  const summary = {};

  const agentsDir = path.join(repoDir, 'agents');
  if (!fs.existsSync(agentsDir)) {
    errors.push('agents/ directory missing');
  } else {
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    summary.agents = agentFiles.length;
    if (agentFiles.length === 0) errors.push('agents/ is empty');
  }

  const skillsDir = path.join(repoDir, 'skills');
  if (!fs.existsSync(skillsDir)) {
    errors.push('skills/ directory missing');
  } else {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory());
    summary.skills = 0;
    for (const d of skillDirs) {
      const skillFile = path.join(skillsDir, d.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        errors.push(`skills/${d.name}/ has no SKILL.md`);
      } else {
        summary.skills++;
      }
    }
  }

  const binDir = path.join(repoDir, 'bin');
  if (!fs.existsSync(binDir)) {
    errors.push('bin/ directory missing');
  } else {
    const shScripts = fs.readdirSync(binDir).filter(f => f.endsWith('.sh'));
    summary.binScripts = shScripts.length;
    for (const s of shScripts) {
      const st = fs.statSync(path.join(binDir, s));
      // Owner-executable bit (0o100) — Claude Code puts bin/ on PATH, so
      // scripts must be invokable directly without a leading `bash`.
      if ((st.mode & 0o100) === 0) {
        errors.push(`bin/${s} is not executable (chmod +x required for PATH invocation)`);
      }
    }
  }

  const hooksFile = path.join(repoDir, 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksFile)) {
    errors.push('hooks/hooks.json missing');
  } else {
    let hooksConfig;
    try {
      hooksConfig = JSON.parse(fs.readFileSync(hooksFile, 'utf-8'));
    } catch {
      errors.push('hooks/hooks.json does not parse as JSON');
    }
    if (hooksConfig) {
      const referencedScripts = new Set();
      const walk = (obj) => {
        if (typeof obj === 'string') {
          const m = obj.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/bin\/([a-z0-9-]+\.sh)/g);
          if (m) for (const ref of m) {
            const name = ref.replace(/.*\/bin\//, '');
            referencedScripts.add(name);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(walk);
        } else if (obj && typeof obj === 'object') {
          for (const v of Object.values(obj)) walk(v);
        }
      };
      walk(hooksConfig);
      summary.hooksScripts = referencedScripts.size;
      for (const script of referencedScripts) {
        if (!fs.existsSync(path.join(binDir, script))) {
          errors.push(`hooks/hooks.json references missing script: bin/${script}`);
        }
      }
    }
  }

  const templatesDir = path.join(repoDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    errors.push('templates/ directory missing');
  } else {
    const required = [
      'CLAUDE.md',
      'DECISIONS.md',
      'BACKLOG.md',
      '.gitignore',
      '.pr-pipeline.json',
      '.claude/aiagentminder-version',
      '.claude/rules/git-workflow.md',
      '.claude/rules/tool-first.md',
      '.claude/rules/context-warnings.md',
      'docs/strategy-roadmap.md',
    ];
    for (const r of required) {
      if (!fs.existsSync(path.join(templatesDir, r))) {
        errors.push(`templates/${r} missing`);
      }
    }
    summary.templateFiles = required.length - errors.filter(e => e.startsWith('templates/')).length;
  }

  return { valid: errors.length === 0, errors, summary };
}

/**
 * Run all validations on the AIAgentMinder repo.
 *
 * @param {string} repoDir
 * @returns {{ pluginJson: object, layout: object, versions: object }}
 */
export function validateAll(repoDir) {
  return {
    pluginJson: validatePluginJson(repoDir),
    layout: validatePluginLayout(repoDir),
    versions: validateVersionConsistency(repoDir),
  };
}

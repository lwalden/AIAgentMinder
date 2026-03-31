#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../lib/cli.js';
import { getCoreFiles, getOptionalFiles, copyFiles, writeProjectIdentity, writeVersionStamp, getTemplateDir, customizeArchitectureFitness, SOURCE_OVERRIDES } from '../lib/init.js';
import { createInterface, askYesNo, askText, askChoice } from '../lib/prompt.js';
import { writeAgentsMd } from '../lib/agents-md.js';
import { fingerprint, detectExistingInstall } from '../lib/detect.js';
import { validatePluginJson, validateVersionConsistency } from '../lib/validate.js';
import { computeSyncPlan } from '../lib/sync.js';
import { getMigrations } from '../lib/migrations.js';
import { mergeSettings } from '../lib/settings-merge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const HELP_TEXT = `
aiagentminder v${pkg.version}
Opinionated governance framework for Claude Code.

Usage:
  npx aiagentminder [command] [options]

Commands:
  init          Initialize AIAgentMinder in the current directory (default)
  sync [path]   Sync template files to a target project (dry-run by default)
  agents-md     Generate AGENTS.md from installed governance files
  validate      Validate plugin manifest and version consistency (repo dev tool)

Options:
  --all         Enable all optional features (no prompts) [init]
  --core        Install core files only (no prompts) [init]
  --force, -f   Overwrite existing files
  --dry-run     Show sync plan without applying (default for sync)
  --apply       Apply sync plan (copy, delete, merge)
  --help, -h    Show this help message
  --version, -v Show version

Examples:
  npx aiagentminder                          Interactive setup
  npx aiagentminder init --all               Full install, no prompts
  npx aiagentminder init --core              Core only, no prompts
  npx aiagentminder sync /path/to/project    Show upgrade plan
  npx aiagentminder sync /path --apply       Apply upgrade
  npx aiagentminder agents-md                Generate AGENTS.md
  npx aiagentminder agents-md -f             Regenerate AGENTS.md
`.trim();

const OPTIONAL_FEATURES = {
  sprint: {
    label: 'Sprint planning',
    description: 'Structured issue decomposition with per-issue PRs',
  },
  syncIssues: {
    label: 'GitHub Issues sync',
    description: 'Push sprint issues to GitHub Issues for visibility',
  },
  prPipeline: {
    label: 'PR pipeline automation',
    description: 'Auto review, fix, test, and merge after PR creation',
  },
};

const PROJECT_TYPES = ['web-app', 'api', 'cli-tool', 'library', 'mobile-app', 'other'];
const AUTONOMY_LEVELS = ['conservative', 'medium', 'aggressive'];

async function runInit(options) {
  const targetDir = process.cwd();
  const templateDir = getTemplateDir();

  console.log(`\nAIAgentMinder v${pkg.version}`);
  console.log(`Installing to: ${targetDir}\n`);

  // Check for existing installation
  const existing = detectExistingInstall(targetDir);
  if (existing.installed) {
    const versionNote = existing.version ? ` (v${existing.version})` : '';
    console.log(`Existing AIAgentMinder installation detected${versionNote}.`);
    console.log(`Files that already exist will be skipped (use --force to overwrite).\n`);
  }

  // Step 1: Copy core files
  console.log('Copying core files...');
  const coreFiles = getCoreFiles();
  const coreResult = copyFiles(templateDir, targetDir, coreFiles, { force: options.force });

  let totalCopied = coreResult.copied.length;
  let totalSkipped = coreResult.skipped.length;

  for (const file of coreResult.copied) {
    console.log(`  + ${file}`);
  }
  for (const file of coreResult.skipped) {
    console.log(`  ~ ${file} (exists, skipped)`);
  }

  // Step 2: Handle optional features
  let selectedFeatures = {};
  let identityConfigured = false;
  const optionalFiles = getOptionalFiles();
  const detected = fingerprint(targetDir);

  if (options.all) {
    selectedFeatures = Object.fromEntries(
      Object.keys(optionalFiles).map(k => [k, true])
    );
    console.log('\n--all: enabling all optional features');
  } else if (options.core) {
    console.log('\n--core: skipping optional features');
  } else {
    // Interactive prompts with codebase detection
    if (detected.language) {
      console.log('\nDetected codebase:');
      if (detected.stack) console.log(`  Stack: ${detected.stack}`);
      if (detected.testRunner) console.log(`  Test runner: ${detected.testRunner}`);
      if (detected.ci) console.log(`  CI: ${detected.ci}`);
      if (detected.lintTools.length > 0) console.log(`  Lint/format: ${detected.lintTools.join(', ')}`);
    }

    const rl = createInterface();
    try {
      console.log('\nOptional features:');

      for (const [key, meta] of Object.entries(OPTIONAL_FEATURES)) {
        selectedFeatures[key] = await askYesNo(
          rl, `  Enable ${meta.label}? (${meta.description})`, true
        );
      }

      // Step 3: Project identity
      const configureNow = await askYesNo(
        rl, '\nConfigure project identity now?', true
      );

      if (configureNow) {
        console.log('\nProject identity (populates CLAUDE.md):');

        const identity = {
          name: await askText(rl, '  Project name', path.basename(targetDir)),
          description: await askText(rl, '  One-sentence description'),
          type: await askChoice(rl, '  Project type', PROJECT_TYPES, detected.type || 'web-app'),
          stack: await askText(rl, '  Tech stack', detected.stack || ''),
          experience: await askText(rl, '  Developer experience (e.g., Senior developer, 10 years)'),
          autonomy: await askChoice(rl, '  Autonomy preference', AUTONOMY_LEVELS, 'medium'),
        };

        writeProjectIdentity(targetDir, identity);
        identityConfigured = true;
        console.log('\n  CLAUDE.md configured with project identity.');
      }
    } finally {
      rl.close();
    }
  }

  // Copy optional feature files
  for (const [key, files] of Object.entries(optionalFiles)) {
    if (selectedFeatures[key]) {
      const result = copyFiles(templateDir, targetDir, files, { force: options.force });
      totalCopied += result.copied.length;
      totalSkipped += result.skipped.length;
      for (const file of result.copied) {
        console.log(`  + ${file}`);
      }
      for (const file of result.skipped) {
        console.log(`  ~ ${file} (exists, skipped)`);
      }
    }
  }

  // Architecture fitness is now in agent files (v4.1+) — no stack-specific customization
  customizeArchitectureFitness(targetDir, detected.language);

  // Write version stamp (writeProjectIdentity already does this when called)
  if (!identityConfigured) {
    writeVersionStamp(targetDir);
  }

  console.log(`\nDone! ${totalCopied} files installed, ${totalSkipped} skipped (already existed).`);

  console.log('\nNext steps:');
  console.log('  1. Open Claude Code in this directory');
  if (identityConfigured) {
    console.log('  2. Run /aam-brief to create your product roadmap');
  } else {
    console.log('  2. Run /aam-brief to configure your project and create a roadmap');
  }
  console.log('  3. Run /aam-checkup to verify the installation');
}

function runAgentsMdCommand(options) {
  const targetDir = process.cwd();
  console.log(`\nGenerating AGENTS.md in: ${targetDir}\n`);

  const result = writeAgentsMd(targetDir, { force: options.force });

  if (result.status === 'skipped') {
    console.log('AGENTS.md already exists. Use --force to overwrite.');
  } else {
    console.log(`Created: ${result.path}`);
    console.log('\nAGENTS.md is a read-only export of your AIAgentMinder governance.');
    console.log('Regenerate it after changing rules or commands: npx aiagentminder agents-md -f');
  }
}

function runValidateCommand() {
  const repoDir = process.cwd();
  console.log(`\nValidating AIAgentMinder plugin structure in: ${repoDir}\n`);

  const pluginResult = validatePluginJson(repoDir);
  const versionResult = validateVersionConsistency(repoDir);
  let hasErrors = false;

  // Plugin.json
  if (pluginResult.valid) {
    console.log(`  plugin.json: OK (v${pluginResult.data.version})`);
  } else {
    hasErrors = true;
    for (const err of pluginResult.errors) {
      console.log(`  plugin.json: FAIL — ${err}`);
    }
  }

  // Version consistency
  if (versionResult.valid) {
    const v = versionResult.versions;
    console.log(`  versions: OK (${v.template || 'unknown'})`);
  } else {
    hasErrors = true;
    for (const err of versionResult.errors) {
      console.log(`  versions: FAIL — ${err}`);
    }
  }

  console.log('');
  if (hasErrors) {
    console.log('Validation failed. Fix the issues above before publishing.');
    process.exit(1);
  } else {
    console.log('All checks passed.');
  }
}

function runSyncCommand(options) {
  const templateDir = getTemplateDir();
  const targetDir = options.positional[1] || options.positional[0] || process.cwd();
  const apply = options.apply;

  console.log(`\nAIAgentMinder sync`);
  console.log(`Template: ${templateDir}`);
  console.log(`Target:   ${targetDir}\n`);

  // Compute sync plan
  const plan = computeSyncPlan(templateDir, targetDir);

  const versionLabel = plan.installedVersion
    ? `${plan.installedVersion} → ${plan.templateVersion}`
    : `(none) → ${plan.templateVersion}`;
  console.log(`Sync plan: ${versionLabel}`);

  // Get migrations
  const migrations = getMigrations(plan.installedVersion, plan.templateVersion);

  // Print migrations
  if (migrations.length > 0) {
    console.log(`\nMigrations (${migrations.length}):`);
    for (const m of migrations) {
      console.log(`  v${m.version}: ${m.description}`);
      for (const f of m.delete) {
        console.log(`    Delete: ${f}`);
      }
      for (const r of m.rename) {
        console.log(`    Rename: ${r.from} → ${r.to}`);
      }
    }
  }

  // Print plan
  if (plan.adds.length > 0) {
    console.log(`\nAdd: ${plan.adds.length} files`);
    for (const f of plan.adds) {
      console.log(`  + ${f.file} (${f.classification})`);
    }
  }

  if (plan.updates.length > 0) {
    console.log(`\nUpdate: ${plan.updates.length} files`);
    for (const f of plan.updates) {
      console.log(`  ~ ${f.file}`);
    }
  }

  if (plan.merge.length > 0) {
    console.log(`\nMerge: ${plan.merge.length} files`);
    for (const f of plan.merge) {
      console.log(`  ⊕ ${f.file}`);
    }
  }

  if (plan.hybrid.length > 0) {
    console.log(`\nHybrid (manual merge needed): ${plan.hybrid.length} files`);
    for (const f of plan.hybrid) {
      console.log(`  ⚠ ${f.file}`);
    }
  }

  if (plan.skipped.length > 0) {
    console.log(`\nSkipped: ${plan.skipped.length} files`);
    for (const f of plan.skipped) {
      console.log(`  - ${f.file} (${f.reason})`);
    }
  }

  if (!apply) {
    console.log('\nDry run — no files modified. Use --apply to execute.');
    return;
  }

  // === APPLY MODE ===
  console.log('\nApplying...');

  // Step 1: Execute migration deletions and renames
  for (const m of migrations) {
    for (const f of m.delete) {
      const fullPath = path.join(targetDir, f);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath);
        console.log(`  ✓ Deleted: ${f}`);
      }
    }
    for (const r of m.rename) {
      const fromPath = path.join(targetDir, r.from);
      if (fs.existsSync(fromPath)) {
        fs.rmSync(fromPath);
        console.log(`  ✓ Removed (migrated): ${r.from}`);
      }
    }
  }

  // Clean up empty directories left by migrations
  const dirsToCheck = ['.claude/hooks', '.claude/commands', '.claude/guidance'];
  for (const d of dirsToCheck) {
    const dirPath = path.join(targetDir, d);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      if (entries.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`  ✓ Removed empty: ${d}/`);
      }
    }
  }

  // Step 2: Copy adds and updates (aam-owned files)
  for (const f of [...plan.adds, ...plan.updates]) {
    if (f.classification === 'aam-owned') {
      const sourceFile = SOURCE_OVERRIDES[f.file] || f.file;
      const sourcePath = path.join(templateDir, sourceFile);
      const targetPath = path.join(targetDir, f.file);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✓ ${plan.adds.includes(f) ? 'Added' : 'Updated'}: ${f.file}`);
    } else if (f.classification === 'user-owned') {
      // Only add user-owned files if they don't exist
      const sourceFile = SOURCE_OVERRIDES[f.file] || f.file;
      const sourcePath = path.join(templateDir, sourceFile);
      const targetPath = path.join(targetDir, f.file);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  ✓ Created: ${f.file}`);
      }
    }
  }

  // Step 3: Merge settings.json
  for (const f of plan.merge) {
    if (f.file === '.claude/settings.json') {
      const sourceFile = SOURCE_OVERRIDES[f.file] || f.file;
      const templateContent = JSON.parse(fs.readFileSync(
        path.join(templateDir, sourceFile), 'utf-8'));
      const targetPath = path.join(targetDir, f.file);
      const targetContent = fs.existsSync(targetPath)
        ? JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
        : {};
      const merged = mergeSettings(templateContent, targetContent);
      fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
      console.log(`  ✓ Merged: ${f.file}`);
    }
  }

  // Step 4: Hybrid files (CLAUDE.md) — skip, needs manual/LLM merge
  for (const f of plan.hybrid) {
    console.log(`  ⚠ Skipped (manual merge needed): ${f.file}`);
  }

  console.log('\nSync complete.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (options.version) {
    console.log(pkg.version);
    process.exit(0);
  }

  if (options.command === 'init') {
    await runInit(options);
  } else if (options.command === 'sync') {
    runSyncCommand(options);
  } else if (options.command === 'agents-md') {
    runAgentsMdCommand(options);
  } else if (options.command === 'validate') {
    runValidateCommand();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

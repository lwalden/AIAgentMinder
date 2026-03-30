#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../lib/cli.js';
import { getCoreFiles, getOptionalFiles, copyFiles, writeProjectIdentity, writeVersionStamp, getTemplateDir, customizeArchitectureFitness } from '../lib/init.js';
import { createInterface, askYesNo, askText, askChoice } from '../lib/prompt.js';
import { writeAgentsMd } from '../lib/agents-md.js';
import { fingerprint, detectExistingInstall } from '../lib/detect.js';
import { validateAll } from '../lib/validate.js';

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
  agents-md     Generate AGENTS.md from installed governance files
  validate      Validate plugin manifest and skill packages (repo dev tool)

Options:
  --all         Enable all optional features (no prompts) [init]
  --core        Install core files only (no prompts) [init]
  --force, -f   Overwrite existing files
  --help, -h    Show this help message
  --version, -v Show version

Examples:
  npx aiagentminder                 Interactive setup
  npx aiagentminder init --all      Full install, no prompts
  npx aiagentminder init --core     Core only, no prompts
  npx aiagentminder agents-md       Generate AGENTS.md
  npx aiagentminder agents-md -f    Regenerate AGENTS.md
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

  const result = validateAll(repoDir);
  let hasErrors = false;

  // Plugin.json
  if (result.pluginJson.valid) {
    console.log(`  plugin.json: OK (v${result.pluginJson.data.version})`);
  } else {
    hasErrors = true;
    for (const err of result.pluginJson.errors) {
      console.log(`  plugin.json: FAIL — ${err}`);
    }
  }

  // Skills
  if (result.skills.valid) {
    console.log(`  skills/: OK (${result.skills.skillCount} packages)`);
  } else {
    hasErrors = true;
    for (const err of result.skills.errors) {
      console.log(`  skills/: FAIL — ${err}`);
    }
  }

  // Version consistency
  if (result.versions.valid) {
    const v = result.versions.versions;
    console.log(`  versions: OK (${v.template || 'unknown'})`);
  } else {
    hasErrors = true;
    for (const err of result.versions.errors) {
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

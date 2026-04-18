import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeSettings } from './settings-merge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Returns the absolute path to the bundled project/ template directory.
 */
export function getTemplateDir() {
  return path.resolve(__dirname, '..', 'project');
}

/**
 * Returns the list of core files (always copied) as relative paths from project/.
 */
export function getCoreFiles() {
  return [
    // Universal rules (loaded every session)
    '.claude/rules/git-workflow.md',
    '.claude/rules/tool-first.md',
    '.claude/rules/correction-capture.md',
    '.claude/rules/context-cycling.md',
    '.claude/rules/README.md',

    // Session profile agents (mode-specific rules)
    '.claude/agents/sprint-master.md',
    '.claude/agents/sprint-planner.md',
    '.claude/agents/sprint-speccer.md',
    '.claude/agents/item-executor.md',
    '.claude/agents/quality-reviewer.md',
    '.claude/agents/pr-pipeliner.md',
    '.claude/agents/sprint-retro.md',
    '.claude/agents/dev.md',
    '.claude/agents/debug.md',
    '.claude/agents/hotfix.md',
    '.claude/agents/qa.md',
    '.claude/agents/security-reviewer.md',
    '.claude/agents/performance-reviewer.md',
    '.claude/agents/api-reviewer.md',
    '.claude/agents/cost-reviewer.md',
    '.claude/agents/ux-reviewer.md',

    // Scripts
    '.claude/scripts/context-monitor.sh',
    '.claude/scripts/context-cycle-hook.sh',
    '.claude/scripts/correction-capture-hook.sh',
    '.claude/scripts/decisions-log.sh',
    '.claude/scripts/install-profile-hook.ps1',
    '.claude/scripts/install-profile-hook.sh',
    '.claude/scripts/sprint-runner.ps1',
    '.claude/scripts/sprint-runner.sh',
    '.claude/scripts/sprint-stop-guard.sh',
    '.claude/scripts/sprint-phase-guard.sh',
    '.claude/scripts/sprint-update.sh',
    '.claude/scripts/session-start-hook.sh',
    '.claude/scripts/session-start-continuation.sh',
    '.claude/scripts/session-end-cycle.sh',
    '.claude/scripts/stop-failure-hook.sh',
    '.claude/scripts/backlog-capture.sh',
    '.claude/scripts/sprint-metrics.sh',
    '.claude/scripts/version-bump.sh',
    '.claude/scripts/exec-history-append.sh',
    '.claude/scripts/hlpm-ping.sh',

    // Settings
    '.claude/settings.json',

    // Core skills (governance commands — skills replace .claude/commands/ as of v4.0)
    '.claude/skills/aam-brief.md',
    '.claude/skills/aam-revise.md',
    '.claude/skills/aam-handoff.md',
    '.claude/skills/aam-quality-gate.md',
    '.claude/skills/aam-scope-check.md',
    '.claude/skills/aam-self-review.md',
    '.claude/skills/aam-milestone.md',
    '.claude/skills/aam-retrospective.md',
    '.claude/skills/aam-tdd.md',
    '.claude/skills/aam-triage.md',
    '.claude/skills/aam-grill.md',
    '.claude/skills/aam-backlog.md',

    // Version stamp
    '.claude/aiagentminder-version',

    // Root files
    'CLAUDE.md',
    'DECISIONS.md',
    'BACKLOG.md',
    'docs/strategy-roadmap.md',
    '.gitignore',
  ];
}

/**
 * Returns optional feature file groups. Each key is a feature name,
 * value is an array of relative paths from project/.
 */
export function getOptionalFiles() {
  return {
    sprint: [
      'SPRINT.md',
    ],
    syncIssues: [
      '.claude/skills/aam-sync-issues.md',
    ],
    prPipeline: [
      '.claude/skills/aam-pr-pipeline.md',
      '.pr-pipeline.json',
    ],
  };
}

// When the source filename in project/ differs from the installed target name,
// map target → source. This avoids Claude Code treating template files as config.
export const SOURCE_OVERRIDES = {
  '.claude/settings.json': '.claude/settings.json.tpl',
};

/**
 * Copy files from templateDir to targetDir.
 *
 * @param {string} templateDir - Absolute path to the template (project/) directory
 * @param {string} targetDir - Absolute path to the target project directory
 * @param {string[]} files - Relative target paths to copy
 * @param {object} [options]
 * @param {boolean} [options.force=false] - Overwrite existing files
 * @returns {{ copied: string[], skipped: string[] }}
 */
export function copyFiles(templateDir, targetDir, files, options = {}) {
  const { force = false } = options;
  const copied = [];
  const skipped = [];

  for (const file of files) {
    const sourceFile = SOURCE_OVERRIDES[file] || file;
    const sourcePath = path.join(templateDir, sourceFile);
    const targetPath = path.join(targetDir, file);

    if (!force && fs.existsSync(targetPath)) {
      skipped.push(file);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // settings.json requires merge (not overwrite) to preserve user hooks
    if (file === '.claude/settings.json' && force && fs.existsSync(targetPath)) {
      const templateContent = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
      const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      const merged = mergeSettings(templateContent, targetContent);
      fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
    copied.push(file);
  }

  return { copied, skipped };
}

/**
 * Write project identity into the target CLAUDE.md and write the version stamp.
 *
 * @param {string} targetDir - Absolute path to the target project directory
 * @param {object} identity
 * @param {string} identity.name
 * @param {string} identity.description
 * @param {string} identity.type
 * @param {string} identity.stack
 * @param {string} identity.experience
 * @param {string} identity.autonomy
 */
/**
 * Write the AIAgentMinder version stamp to the target project.
 *
 * @param {string} targetDir - Absolute path to the target project directory
 */
export function writeVersionStamp(targetDir) {
  const templateDir = getTemplateDir();
  const versionSource = path.join(templateDir, '.claude', 'aiagentminder-version');
  const versionTarget = path.join(targetDir, '.claude', 'aiagentminder-version');
  fs.mkdirSync(path.dirname(versionTarget), { recursive: true });
  fs.copyFileSync(versionSource, versionTarget);
}

// Language → comment block heading in architecture-fitness.md
const LANGUAGE_SECTION_MAP = {
  'C#': '### C# / .NET',
  'TypeScript': '### TypeScript / React',
  'JavaScript': '### TypeScript / React',
  'Python': '### Python',
  'Java': '### Java / Spring',
};

/**
 * Uncomment the stack-specific section in architecture-fitness.md that matches
 * the detected language. Leaves other sections commented.
 *
 * @param {string} targetDir - Absolute path to the target project directory
 * @param {string|null} language - Detected language from fingerprint()
 */
export function customizeArchitectureFitness(targetDir, language) {
  // Architecture fitness rules are now embedded in agent files (dev.md, sprint-executor.md, qa.md).
  // Stack-specific customization is a no-op in v4.1+ — agents contain the stack-agnostic defaults.
  // Users customize architecture fitness directly in their agent files after setup.
  return;
}

export function writeProjectIdentity(targetDir, identity) {
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  let content = fs.readFileSync(claudeMdPath, 'utf-8');

  // Use function replacements to avoid $ special pattern interpretation
  content = content.replace('[Project Name]', () => identity.name);
  content = content.replace('[Brief description]', () => identity.description);
  content = content.replace(
    '[web-app | api | cli-tool | library | mobile-app | other]',
    () => identity.type
  );
  content = content.replace('[Language / Framework / Database / etc.]', () => identity.stack);
  content = content.replace('[Experience level and tech expertise]', () => identity.experience);
  content = content.replace(
    '[Risk tolerance: conservative / medium / aggressive]',
    () => `${identity.autonomy} autonomy`
  );

  fs.writeFileSync(claudeMdPath, content, 'utf-8');

  writeVersionStamp(targetDir);
}

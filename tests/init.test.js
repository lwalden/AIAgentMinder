import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// The module under test
import { getCoreFiles, getOptionalFiles, copyFiles, writeProjectIdentity, getTemplateDir, customizeArchitectureFitness, SOURCE_OVERRIDES } from '../lib/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-test-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

describe('getTemplateDir', () => {
  it('returns the project/ directory path', () => {
    const dir = getTemplateDir();
    assert.equal(dir, TEMPLATE_DIR);
    assert.ok(fs.existsSync(dir), 'template directory should exist');
  });
});

describe('getCoreFiles', () => {
  it('returns an array of relative paths', () => {
    const files = getCoreFiles();
    assert.ok(Array.isArray(files));
    assert.ok(files.length > 0, 'should have core files');
  });

  it('includes always-active rules', () => {
    const files = getCoreFiles();
    const ruleFiles = files.filter(f => f.startsWith('.claude/rules/'));
    assert.ok(ruleFiles.includes('.claude/rules/git-workflow.md'));
    assert.ok(ruleFiles.includes('.claude/rules/scope-guardian.md'));
    assert.ok(ruleFiles.includes('.claude/rules/approach-first.md'));
    assert.ok(ruleFiles.includes('.claude/rules/debug-checkpoint.md'));
    assert.ok(ruleFiles.includes('.claude/rules/tool-first.md'));
    assert.ok(ruleFiles.includes('.claude/rules/correction-capture.md'));
    assert.ok(ruleFiles.includes('.claude/rules/README.md'));
  });

  it('includes all core skills', () => {
    const files = getCoreFiles();
    const skillFiles = files.filter(f => f.startsWith('.claude/skills/'));
    assert.ok(skillFiles.includes('.claude/skills/aam-brief.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-handoff.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-quality-gate.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-self-review.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-tdd.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-triage.md'));
    assert.ok(skillFiles.includes('.claude/skills/aam-grill.md'));
  });

  it('does NOT include .claude/commands/ paths', () => {
    const files = getCoreFiles();
    const cmdFiles = files.filter(f => f.startsWith('.claude/commands/'));
    assert.equal(cmdFiles.length, 0, 'should have no .claude/commands/ paths');
  });

  it('includes scripts and settings', () => {
    const files = getCoreFiles();
    assert.ok(files.includes('.claude/scripts/context-monitor.sh'));
    assert.ok(files.includes('.claude/scripts/context-cycle.sh'));
    assert.ok(files.includes('.claude/settings.json'));
  });

  it('includes CLAUDE.md template and DECISIONS.md', () => {
    const files = getCoreFiles();
    assert.ok(files.includes('CLAUDE.md'));
    assert.ok(files.includes('DECISIONS.md'));
  });

  it('does NOT include optional files', () => {
    const files = getCoreFiles();
    assert.ok(!files.includes('.claude/rules/code-quality.md'));
    assert.ok(!files.includes('.claude/rules/sprint-workflow.md'));
    assert.ok(!files.includes('.claude/rules/architecture-fitness.md'));
    assert.ok(!files.includes('.claude/skills/aam-sync-issues.md'));
    assert.ok(!files.includes('.claude/skills/aam-pr-pipeline.md'));
    assert.ok(!files.includes('SPRINT.md'));
    assert.ok(!files.includes('.pr-pipeline.json'));
  });

  it('every listed file exists in the template directory', () => {
    const files = getCoreFiles();
    for (const file of files) {
      const sourceFile = SOURCE_OVERRIDES[file] || file;
      const fullPath = path.join(TEMPLATE_DIR, sourceFile);
      assert.ok(fs.existsSync(fullPath), `core file should exist in template: ${sourceFile}`);
    }
  });
});

describe('getOptionalFiles', () => {
  it('returns a map of feature name to file arrays', () => {
    const opts = getOptionalFiles();
    assert.ok(typeof opts === 'object');
    assert.ok('codeQuality' in opts);
    assert.ok('sprint' in opts);
    assert.ok('architectureFitness' in opts);
    assert.ok('syncIssues' in opts);
    assert.ok('prPipeline' in opts);
  });

  it('code quality feature includes code-quality.md', () => {
    const opts = getOptionalFiles();
    assert.ok(opts.codeQuality.includes('.claude/rules/code-quality.md'));
  });

  it('sprint feature includes sprint-workflow.md and SPRINT.md', () => {
    const opts = getOptionalFiles();
    assert.ok(opts.sprint.includes('.claude/rules/sprint-workflow.md'));
    assert.ok(opts.sprint.includes('SPRINT.md'));
  });

  it('architecture fitness includes architecture-fitness.md', () => {
    const opts = getOptionalFiles();
    assert.ok(opts.architectureFitness.includes('.claude/rules/architecture-fitness.md'));
  });

  it('sync issues includes aam-sync-issues.md in skills', () => {
    const opts = getOptionalFiles();
    assert.ok(opts.syncIssues.includes('.claude/skills/aam-sync-issues.md'));
  });

  it('pr pipeline includes aam-pr-pipeline.md in skills and .pr-pipeline.json', () => {
    const opts = getOptionalFiles();
    assert.ok(opts.prPipeline.includes('.claude/skills/aam-pr-pipeline.md'));
    assert.ok(opts.prPipeline.includes('.pr-pipeline.json'));
  });

  it('every listed file exists in the template directory', () => {
    const opts = getOptionalFiles();
    for (const [feature, files] of Object.entries(opts)) {
      for (const file of files) {
        const sourceFile = SOURCE_OVERRIDES[file] || file;
        const fullPath = path.join(TEMPLATE_DIR, sourceFile);
        assert.ok(fs.existsSync(fullPath), `optional file should exist in template: ${sourceFile} (${feature})`);
      }
    }
  });
});

describe('copyFiles', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('copies a list of relative paths from template to target', () => {
    const files = ['.claude/rules/git-workflow.md', 'CLAUDE.md'];
    const result = copyFiles(TEMPLATE_DIR, targetDir, files);

    for (const file of files) {
      const targetPath = path.join(targetDir, file);
      assert.ok(fs.existsSync(targetPath), `should have copied ${file}`);

      const sourceContent = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf-8');
      const targetContent = fs.readFileSync(targetPath, 'utf-8');
      assert.equal(targetContent, sourceContent, `content should match for ${file}`);
    }

    assert.equal(result.copied.length, 2);
    assert.equal(result.skipped.length, 0);
  });

  it('creates intermediate directories as needed', () => {
    const files = ['.claude/scripts/context-monitor.sh'];
    copyFiles(TEMPLATE_DIR, targetDir, files);

    const targetPath = path.join(targetDir, '.claude', 'scripts', 'context-monitor.sh');
    assert.ok(fs.existsSync(targetPath));
  });

  it('skips files that already exist and reports them', () => {
    // Pre-create a file
    const existingFile = '.claude/rules/git-workflow.md';
    const existingPath = path.join(targetDir, existingFile);
    fs.mkdirSync(path.dirname(existingPath), { recursive: true });
    fs.writeFileSync(existingPath, 'user customized content');

    const files = [existingFile, 'CLAUDE.md'];
    const result = copyFiles(TEMPLATE_DIR, targetDir, files);

    assert.equal(result.copied.length, 1);
    assert.equal(result.skipped.length, 1);
    assert.ok(result.skipped.includes(existingFile));

    // Existing file should NOT be overwritten
    const content = fs.readFileSync(existingPath, 'utf-8');
    assert.equal(content, 'user customized content');
  });

  it('force option overwrites existing files', () => {
    const existingFile = 'CLAUDE.md';
    const existingPath = path.join(targetDir, existingFile);
    fs.writeFileSync(existingPath, 'old content');

    const result = copyFiles(TEMPLATE_DIR, targetDir, [existingFile], { force: true });

    assert.equal(result.copied.length, 1);
    assert.equal(result.skipped.length, 0);

    const content = fs.readFileSync(existingPath, 'utf-8');
    const sourceContent = fs.readFileSync(path.join(TEMPLATE_DIR, existingFile), 'utf-8');
    assert.equal(content, sourceContent);
  });

  it('applies SOURCE_OVERRIDES to rename files during copy', () => {
    const files = ['.claude/settings.json'];
    const result = copyFiles(TEMPLATE_DIR, targetDir, files);

    // Target should be settings.json (not .tpl)
    const targetPath = path.join(targetDir, '.claude', 'settings.json');
    assert.ok(fs.existsSync(targetPath), 'should install as settings.json');
    assert.equal(result.copied.length, 1);
    assert.equal(result.copied[0], '.claude/settings.json');

    // Content should match the .tpl source
    const sourceContent = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'settings.json.tpl'), 'utf-8'
    );
    const targetContent = fs.readFileSync(targetPath, 'utf-8');
    assert.equal(targetContent, sourceContent);
  });
});

describe('writeProjectIdentity', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    // Copy the template CLAUDE.md first so there's something to modify
    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    fs.copyFileSync(path.join(TEMPLATE_DIR, 'CLAUDE.md'), claudeMdPath);
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('replaces placeholder values in CLAUDE.md', () => {
    writeProjectIdentity(targetDir, {
      name: 'my-app',
      description: 'A web application for tracking tasks',
      type: 'web-app',
      stack: 'TypeScript / React / PostgreSQL',
      experience: 'Senior developer, 10 years experience',
      autonomy: 'medium',
    });

    const content = fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8');

    assert.ok(content.includes('**Project:** my-app'));
    assert.ok(content.includes('**Description:** A web application for tracking tasks'));
    assert.ok(content.includes('**Type:** web-app'));
    assert.ok(content.includes('**Stack:** TypeScript / React / PostgreSQL'));
    assert.ok(content.includes('Senior developer, 10 years experience'));
    assert.ok(content.includes('medium'));

    // Placeholders should be gone
    assert.ok(!content.includes('[Project Name]'));
    assert.ok(!content.includes('[Brief description]'));
  });

  it('writes the version stamp', () => {
    writeProjectIdentity(targetDir, {
      name: 'test',
      description: 'test',
      type: 'cli-tool',
      stack: 'Node.js',
      experience: 'mid-level',
      autonomy: 'medium',
    });

    const versionPath = path.join(targetDir, '.claude', 'aiagentminder-version');
    assert.ok(fs.existsSync(versionPath), 'version stamp should be written');

    const version = fs.readFileSync(versionPath, 'utf-8').trim();
    const templateVersion = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'aiagentminder-version'),
      'utf-8'
    ).trim();
    assert.equal(version, templateVersion);
  });

  it('handles $ characters in identity values without corruption', () => {
    writeProjectIdentity(targetDir, {
      name: 'price-tracker',
      description: 'Tracks prices — saves $5 per item on average',
      type: 'web-app',
      stack: 'Node.js / $PATH utilities',
      experience: 'Senior developer',
      autonomy: 'medium',
    });

    const content = fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8');

    assert.ok(content.includes('saves $5 per item on average'),
      'Dollar signs in description should be preserved literally');
    assert.ok(content.includes('$PATH utilities'),
      'Dollar signs in stack should be preserved literally');
  });

  it('creates .claude directory if it does not exist', () => {
    // Remove .claude dir if copyFiles created it
    const claudeDir = path.join(targetDir, '.claude');
    if (fs.existsSync(claudeDir)) {
      fs.rmSync(claudeDir, { recursive: true });
    }

    writeProjectIdentity(targetDir, {
      name: 'test',
      description: 'test',
      type: 'api',
      stack: 'Python / FastAPI',
      experience: 'junior',
      autonomy: 'conservative',
    });

    const versionPath = path.join(targetDir, '.claude', 'aiagentminder-version');
    assert.ok(fs.existsSync(versionPath));
  });
});

describe('skill frontmatter validation', () => {
  it('every core skill file has valid YAML frontmatter with description', () => {
    const files = getCoreFiles();
    const skillFiles = files.filter(f => f.startsWith('.claude/skills/'));

    for (const file of skillFiles) {
      const sourceFile = SOURCE_OVERRIDES[file] || file;
      const content = fs.readFileSync(path.join(TEMPLATE_DIR, sourceFile), 'utf-8');

      assert.ok(content.startsWith('---\r\n') || content.startsWith('---\n'),
        `${file} should start with YAML frontmatter delimiter`);
      const endIdx = content.indexOf('---', 4);
      assert.ok(endIdx > 0, `${file} should have closing frontmatter delimiter`);

      const frontmatter = content.substring(4, endIdx);
      assert.ok(frontmatter.includes('description:'), `${file} frontmatter should have description field`);
      assert.ok(frontmatter.includes('user-invocable: true'), `${file} frontmatter should have user-invocable: true`);
    }
  });

  it('quality-gate skill has context: fork', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'skills', 'aam-quality-gate.md'), 'utf-8'
    );
    const endIdx = content.indexOf('---', 4);
    const frontmatter = content.substring(4, endIdx);
    assert.ok(frontmatter.includes('context: fork'), 'quality-gate should run in forked context');
  });

  it('quality-gate skill includes negative test enforcement check', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'skills', 'aam-quality-gate.md'), 'utf-8'
    );
    assert.ok(content.includes('Negative test'), 'quality-gate should include negative test enforcement check');
    assert.ok(content.includes('negativeTestEnforcement'), 'quality-gate should reference .pr-pipeline.json config');
  });

  it('self-review skill includes UX friction review lens', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'skills', 'aam-self-review.md'), 'utf-8'
    );
    assert.ok(content.includes('UX Friction'), 'self-review should include UX friction lens');
    assert.ok(content.includes('All five'), 'self-review should reference all five lenses');
  });

  it('self-review skill includes judge agent pass', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'skills', 'aam-self-review.md'), 'utf-8'
    );
    assert.ok(content.includes('Judge'), 'self-review should include judge agent pass');
    assert.ok(content.includes('Step 3c'), 'self-review should have Step 3c for judge pass');
  });

  it('self-review skill does NOT have context: fork', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'skills', 'aam-self-review.md'), 'utf-8'
    );
    const endIdx = content.indexOf('---', 4);
    const frontmatter = content.substring(4, endIdx);
    assert.ok(!frontmatter.includes('context: fork'), 'self-review should NOT fork (it spawns subagents)');
  });
});

describe('customizeArchitectureFitness', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    // Copy the template architecture-fitness.md so there's something to customize
    const rulesDir = path.join(targetDir, '.claude', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.copyFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'rules', 'architecture-fitness.md'),
      path.join(rulesDir, 'architecture-fitness.md')
    );
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('uncomments the C# / .NET section when language is C#', () => {
    customizeArchitectureFitness(targetDir, 'C#');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    // C# section should be uncommented
    assert.ok(content.includes('### C# / .NET'));
    assert.ok(content.includes('- Controllers must not inject repositories directly'));
    // Should NOT still be wrapped in HTML comments
    assert.ok(!content.includes('<!-- ### C# / .NET'));

    // Other sections should remain commented
    assert.ok(content.includes('<!-- ### TypeScript / React'));
    assert.ok(content.includes('<!-- ### Python'));
    assert.ok(content.includes('<!-- ### Java / Spring'));
  });

  it('uncomments the TypeScript / React section when language is TypeScript', () => {
    customizeArchitectureFitness(targetDir, 'TypeScript');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    assert.ok(content.includes('### TypeScript / React'));
    assert.ok(content.includes('- No `any` type annotations'));
    assert.ok(!content.includes('<!-- ### TypeScript / React'));

    // Others stay commented
    assert.ok(content.includes('<!-- ### C# / .NET'));
    assert.ok(content.includes('<!-- ### Python'));
  });

  it('uncomments the TypeScript / React section when language is JavaScript', () => {
    customizeArchitectureFitness(targetDir, 'JavaScript');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    assert.ok(content.includes('### TypeScript / React'));
    assert.ok(!content.includes('<!-- ### TypeScript / React'));
  });

  it('uncomments the Python section when language is Python', () => {
    customizeArchitectureFitness(targetDir, 'Python');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    assert.ok(content.includes('### Python'));
    assert.ok(content.includes('- No raw SQL string concatenation'));
    assert.ok(!content.includes('<!-- ### Python'));

    assert.ok(content.includes('<!-- ### C# / .NET'));
    assert.ok(content.includes('<!-- ### Java / Spring'));
  });

  it('uncomments the Java / Spring section when language is Java', () => {
    customizeArchitectureFitness(targetDir, 'Java');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    assert.ok(content.includes('### Java / Spring'));
    assert.ok(content.includes('- @RequestBody parameters must have @Valid annotation'));
    assert.ok(!content.includes('<!-- ### Java / Spring'));

    assert.ok(content.includes('<!-- ### C# / .NET'));
    assert.ok(content.includes('<!-- ### TypeScript / React'));
  });

  it('does nothing when language is null', () => {
    const before = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );
    customizeArchitectureFitness(targetDir, null);
    const after = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );
    assert.equal(before, after);
  });

  it('does nothing when language has no matching section (e.g., Go)', () => {
    const before = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );
    customizeArchitectureFitness(targetDir, 'Go');
    const after = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );
    assert.equal(before, after);
  });

  it('does nothing when architecture-fitness.md does not exist', () => {
    // Remove the file
    fs.unlinkSync(path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'));
    // Should not throw
    customizeArchitectureFitness(targetDir, 'TypeScript');
  });

  it('preserves the rest of the file content', () => {
    customizeArchitectureFitness(targetDir, 'Python');
    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    // Universal rules still present
    assert.ok(content.includes('### File Size'));
    assert.ok(content.includes('### Secrets in Source'));
    assert.ok(content.includes('### Test Isolation'));
    assert.ok(content.includes('### Layer Boundaries'));
    assert.ok(content.includes('## Enforcement'));
  });
});

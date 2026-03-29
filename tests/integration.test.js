import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '..', 'bin', 'aam.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-integ-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('CLI integration: --help', () => {
  it('prints help text and exits 0', () => {
    const output = execFileSync('node', [BIN, '--help'], { encoding: 'utf-8' });
    assert.ok(output.includes('aiagentminder'));
    assert.ok(output.includes('Usage:'));
    assert.ok(output.includes('--all'));
    assert.ok(output.includes('--core'));
  });
});

describe('CLI integration: --version', () => {
  it('prints version and exits 0', () => {
    const output = execFileSync('node', [BIN, '--version'], { encoding: 'utf-8' });
    const pkg = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, '..', 'package.json'), 'utf-8'
    ));
    assert.equal(output.trim(), pkg.version);
  });
});

describe('CLI integration: init --core', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('copies core files without prompting', () => {
    const output = execFileSync('node', [BIN, 'init', '--core'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('Copying core files'));
    assert.ok(output.includes('--core: skipping optional features'));
    assert.ok(output.includes('Done!'));

    // Core files should exist
    assert.ok(fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'DECISIONS.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'git-workflow.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-brief.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'settings.json')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'context-monitor.sh')));

    // Skills directory should exist, commands directory should NOT
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'commands')),
      'should not create .claude/commands/ — skills replace commands');

    // Optional files should NOT exist
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'code-quality.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'sprint-workflow.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, 'SPRINT.md')));

    // Version stamp should exist
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'aiagentminder-version')));
  });

  it('skips files that already exist', () => {
    // Pre-create CLAUDE.md
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), 'my custom CLAUDE.md');

    const output = execFileSync('node', [BIN, 'init', '--core'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('CLAUDE.md (exists, skipped)'));

    // Should not have overwritten
    const content = fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8');
    assert.equal(content, 'my custom CLAUDE.md');
  });
});

describe('CLI integration: agents-md', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();

    // Set up a minimal AAM project
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), `
**Project:** test-project
**Description:** A test project
**Type:** cli-tool
**Stack:** Node.js
`);
    fs.mkdirSync(path.join(targetDir, '.claude', 'rules'), { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, '.claude', 'rules', 'git-workflow.md'),
      '# Git Workflow Rules\n'
    );
    fs.mkdirSync(path.join(targetDir, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, '.claude', 'skills', 'aam-brief.md'),
      '---\ndescription: Product brief and roadmap creation\nuser-invocable: true\n---\n\n# /aam-brief - Product Brief\n'
    );
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('generates AGENTS.md', () => {
    const output = execFileSync('node', [BIN, 'agents-md'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('Created:'));
    assert.ok(fs.existsSync(path.join(targetDir, 'AGENTS.md')));

    const content = fs.readFileSync(path.join(targetDir, 'AGENTS.md'), 'utf-8');
    assert.ok(content.includes('test-project'));
    assert.ok(content.includes('/aam-brief'));
  });

  it('skips when AGENTS.md exists without --force', () => {
    fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), 'existing');

    const output = execFileSync('node', [BIN, 'agents-md'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('already exists'));
    assert.equal(fs.readFileSync(path.join(targetDir, 'AGENTS.md'), 'utf-8'), 'existing');
  });

  it('overwrites with --force', () => {
    fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), 'old');

    const output = execFileSync('node', [BIN, 'agents-md', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('Created:'));
    const content = fs.readFileSync(path.join(targetDir, 'AGENTS.md'), 'utf-8');
    assert.ok(content.includes('test-project'));
  });
});

describe('CLI integration: init --all', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('copies core and all optional files', () => {
    const output = execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('--all: enabling all optional features'));
    assert.ok(output.includes('Done!'));

    // Core files
    assert.ok(fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'git-workflow.md')));

    // Optional files
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'code-quality.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'sprint-workflow.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md')));
    assert.ok(fs.existsSync(path.join(targetDir, 'SPRINT.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-sync-issues.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-pr-pipeline.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.pr-pipeline.json')));

    // Version stamp
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'aiagentminder-version')));
  });

  it('includes crossModelReview config in .pr-pipeline.json', () => {
    execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    const config = JSON.parse(fs.readFileSync(path.join(targetDir, '.pr-pipeline.json'), 'utf-8'));
    assert.ok('crossModelReview' in config, '.pr-pipeline.json should contain crossModelReview field');
    assert.equal(config.crossModelReview.enabled, false, 'crossModelReview should be disabled by default');
    assert.equal(typeof config.crossModelReview.model, 'string', 'crossModelReview.model should be a string');
  });

  it('uncomments stack-specific architecture fitness rules when language detected', () => {
    // Simulate a TypeScript project
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));
    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), '{}');

    const output = execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('Stack-specific rules enabled for TypeScript'));

    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    // TypeScript section should be uncommented
    assert.ok(content.includes('### TypeScript / React'));
    assert.ok(!content.includes('<!-- ### TypeScript / React'));

    // Other sections should remain commented
    assert.ok(content.includes('<!-- ### C# / .NET'));
    assert.ok(content.includes('<!-- ### Python'));
    assert.ok(content.includes('<!-- ### Java / Spring'));
  });

  it('leaves architecture fitness rules unchanged when no language detected', () => {
    const output = execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(!output.includes('Stack-specific rules enabled'));

    const content = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md'), 'utf-8'
    );

    // All sections should remain commented
    assert.ok(content.includes('<!-- ### C# / .NET'));
    assert.ok(content.includes('<!-- ### TypeScript / React'));
    assert.ok(content.includes('<!-- ### Python'));
    assert.ok(content.includes('<!-- ### Java / Spring'));
  });
});

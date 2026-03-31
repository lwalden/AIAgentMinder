import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '..', 'bin', 'aam.js');
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

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

    // Agents directory should exist with session profiles
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'sprint-executor.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'dev.md')));

    // Optional files should NOT exist
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
    assert.ok(fs.existsSync(path.join(targetDir, 'SPRINT.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-sync-issues.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-pr-pipeline.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.pr-pipeline.json')));

    // Session profile agents (core, not optional)
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'sprint-executor.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'dev.md')));

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

  it('includes negativeTestEnforcement config in .pr-pipeline.json', () => {
    execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    const config = JSON.parse(fs.readFileSync(path.join(targetDir, '.pr-pipeline.json'), 'utf-8'));
    assert.ok('negativeTestEnforcement' in config, '.pr-pipeline.json should contain negativeTestEnforcement field');
    assert.equal(config.negativeTestEnforcement.enabled, true, 'negativeTestEnforcement should be enabled by default');
    assert.ok(Array.isArray(config.negativeTestEnforcement.patterns), 'negativeTestEnforcement.patterns should be an array');
    assert.ok(config.negativeTestEnforcement.patterns.length > 0, 'negativeTestEnforcement.patterns should have default patterns');
  });

  it('installs BACKLOG.md and backlog-capture.sh as core files', () => {
    execFileSync('node', [BIN, 'init', '--core'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(fs.existsSync(path.join(targetDir, 'BACKLOG.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'backlog-capture.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-backlog.md')));
  });
});

describe('CLI integration: existing install detection', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('warns when existing AIAgentMinder version stamp is found', () => {
    // Pre-seed a version stamp
    fs.mkdirSync(path.join(targetDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.2.0');

    const output = execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(output.includes('Existing AIAgentMinder installation detected'), 'should warn about existing install');
    assert.ok(output.includes('3.2.0'), 'should show existing version');
  });

  it('still copies files when existing install detected with --all', () => {
    fs.mkdirSync(path.join(targetDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.2.0');

    execFileSync('node', [BIN, 'init', '--all'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    // Should still install (--all proceeds)
    assert.ok(fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
  });
});

describe('CLI integration: v3.x to v4.1 migration', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    // Simulate a v3.3 installation with old rule files
    const rulesDir = path.join(targetDir, '.claude', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.3.0');
    // Old rules that should NOT be re-created by v4.1 init
    fs.writeFileSync(path.join(rulesDir, 'scope-guardian.md'), '# old scope guardian');
    fs.writeFileSync(path.join(rulesDir, 'approach-first.md'), '# old approach-first');
    fs.writeFileSync(path.join(rulesDir, 'debug-checkpoint.md'), '# old debug-checkpoint');
    fs.writeFileSync(path.join(rulesDir, 'code-quality.md'), '# old code-quality');
    fs.writeFileSync(path.join(rulesDir, 'sprint-workflow.md'), '# old sprint-workflow');
    fs.writeFileSync(path.join(rulesDir, 'architecture-fitness.md'), '# old architecture-fitness');
    // Existing universal rules
    fs.writeFileSync(path.join(rulesDir, 'git-workflow.md'), '# old git-workflow');
    fs.writeFileSync(path.join(rulesDir, 'tool-first.md'), '# old tool-first');
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('installs agents when upgrading from v3.3 with --force', () => {
    execFileSync('node', [BIN, 'init', '--core', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    // New agent files should exist
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'sprint-executor.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'dev.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'debug.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'hotfix.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'qa.md')));
  });

  it('does not re-create old relocated rules', () => {
    execFileSync('node', [BIN, 'init', '--core', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    // getCoreFiles() should NOT include these — init should not copy them
    // The old files still exist (init doesn't delete), but no NEW copies from template
    // Verify by checking that template does NOT have these files (so init can't copy them)
    const templateDir = path.resolve(__dirname, '..', 'project');
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'scope-guardian.md')));
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'approach-first.md')));
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'sprint-workflow.md')));
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'code-quality.md')));
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'architecture-fitness.md')));
    assert.ok(!fs.existsSync(path.join(templateDir, '.claude', 'rules', 'debug-checkpoint.md')));
  });

  it('installs context-cycling.md as new universal rule', () => {
    execFileSync('node', [BIN, 'init', '--core', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'context-cycling.md')));
  });

  it('installs BACKLOG.md and backlog-capture.sh', () => {
    execFileSync('node', [BIN, 'init', '--core', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    assert.ok(fs.existsSync(path.join(targetDir, 'BACKLOG.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'backlog-capture.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-backlog.md')));
  });

  it('updates version stamp to current template version', () => {
    execFileSync('node', [BIN, 'init', '--core', '--force'], {
      encoding: 'utf-8',
      cwd: targetDir,
    });

    const version = fs.readFileSync(
      path.join(targetDir, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    const templateVersion = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    assert.equal(version, templateVersion);
  });
});

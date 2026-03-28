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
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-brief.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'settings.json')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'context-monitor.sh')));

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
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-sync-issues.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-pr-pipeline.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.pr-pipeline.json')));

    // Version stamp
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'aiagentminder-version')));
  });
});

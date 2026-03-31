import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, '..', 'bin', 'aam.js');
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-sync-cli-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function run(args, cwd) {
  return execFileSync('node', [BIN, ...args], {
    cwd: cwd || __dirname,
    encoding: 'utf-8',
    timeout: 10000,
  });
}

describe('CLI: sync --dry-run', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    // Simulate a v3.3.0 installation with some files
    fs.mkdirSync(path.join(targetDir, '.claude', 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'rules'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'commands'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(targetDir, '.claude', 'scripts', 'context-monitor.sh'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'rules', 'git-workflow.md'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'rules', 'scope-guardian.md'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'commands', 'aam-handoff.md'), 'old');
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), 'user content');
    fs.writeFileSync(path.join(targetDir, 'DECISIONS.md'), 'user decisions');
    fs.writeFileSync(path.join(targetDir, '.claude', 'settings.json'), JSON.stringify({
      env: { MY_KEY: 'value' },
    }));
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('shows version info', () => {
    const output = run(['sync', targetDir, '--dry-run']);
    assert.ok(output.includes('3.3.0'), 'should show installed version');
    assert.ok(output.includes('Sync plan'), 'should show plan header');
  });

  it('identifies files to add', () => {
    const output = run(['sync', targetDir, '--dry-run']);
    // Agents don't exist in target, should be adds
    assert.ok(output.includes('Add:'), 'should have files to add');
  });

  it('identifies files to update', () => {
    const output = run(['sync', targetDir, '--dry-run']);
    assert.ok(output.includes('Update:'), 'should have files to update');
  });

  it('identifies migrations', () => {
    const output = run(['sync', targetDir, '--dry-run']);
    // v4.0 and v4.1 migrations should be listed
    assert.ok(output.includes('Migration'), 'should show migrations');
  });

  it('does not modify files in dry-run', () => {
    run(['sync', targetDir, '--dry-run']);
    // Version stamp should still be 3.3.0
    const version = fs.readFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), 'utf-8').trim();
    assert.equal(version, '3.3.0', 'should not modify files in dry-run');
    // Old commands should still exist
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-handoff.md')));
  });
});

describe('CLI: sync --apply', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    fs.mkdirSync(path.join(targetDir, '.claude', 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'rules'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, '.claude', 'commands'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(targetDir, '.claude', 'scripts', 'context-monitor.sh'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'rules', 'git-workflow.md'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'rules', 'scope-guardian.md'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'rules', 'approach-first.md'), 'old');
    fs.writeFileSync(path.join(targetDir, '.claude', 'commands', 'aam-handoff.md'), 'old');
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), 'user content');
    fs.writeFileSync(path.join(targetDir, 'DECISIONS.md'), 'user decisions');
    fs.writeFileSync(path.join(targetDir, '.claude', 'settings.json'), JSON.stringify({
      env: { MY_KEY: 'value' },
    }));
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('copies aam-owned files to target', () => {
    run(['sync', targetDir, '--apply']);
    // Agent files should now exist
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'dev.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'sprint-executor.md')));
  });

  it('updates version stamp', () => {
    run(['sync', targetDir, '--apply']);
    const templateVersion = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    const targetVersion = fs.readFileSync(
      path.join(targetDir, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    assert.equal(targetVersion, templateVersion);
  });

  it('applies migration deletions', () => {
    run(['sync', targetDir, '--apply']);
    // v4.1 migration should delete scope-guardian.md and approach-first.md
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'scope-guardian.md')),
      'scope-guardian.md should be deleted by v4.1 migration');
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'approach-first.md')),
      'approach-first.md should be deleted by v4.1 migration');
  });

  it('applies migration renames (commands → skills)', () => {
    run(['sync', targetDir, '--apply']);
    // v4.0 migration: commands/aam-handoff.md → skills/aam-handoff.md
    // The old file should be gone (deleted by rename migration)
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-handoff.md')),
      'old command file should be removed');
    // New skill file should exist (from sync copy)
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-handoff.md')),
      'new skill file should exist');
  });

  it('merges settings.json preserving user config', () => {
    run(['sync', targetDir, '--apply']);
    const settings = JSON.parse(fs.readFileSync(
      path.join(targetDir, '.claude', 'settings.json'), 'utf-8'
    ));
    assert.equal(settings.env.MY_KEY, 'value', 'should preserve user env');
    assert.ok(settings.statusLine, 'should have statusLine');
    assert.ok(settings.hooks.PreToolUse, 'should have PreToolUse hook');
    assert.ok(settings.hooks.SessionStart, 'should have SessionStart hook');
  });

  it('does not overwrite user-owned files', () => {
    run(['sync', targetDir, '--apply']);
    const decisions = fs.readFileSync(path.join(targetDir, 'DECISIONS.md'), 'utf-8');
    assert.equal(decisions, 'user decisions', 'should not overwrite DECISIONS.md');
  });

  it('skips CLAUDE.md (hybrid — needs manual merge)', () => {
    run(['sync', targetDir, '--apply']);
    const claude = fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8');
    assert.equal(claude, 'user content', 'should not overwrite CLAUDE.md');
  });
});

describe('CLI: sync jq dependency check', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('sync --dry-run output mentions jq dependency', () => {
    // Set up a minimal installation so sync has something to analyze
    fs.mkdirSync(path.join(targetDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    const output = run(['sync', targetDir, '--dry-run']);
    assert.ok(output.includes('jq'), 'sync output should mention jq dependency');
  });

  it('sync --apply output mentions jq dependency', () => {
    fs.mkdirSync(path.join(targetDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(targetDir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    const output = run(['sync', targetDir, '--apply']);
    assert.ok(output.includes('jq'), 'sync apply output should mention jq dependency');
  });
});

describe('CLI: sync parse args', () => {
  it('recognizes sync command', () => {
    // Just check that help mentions sync
    const output = run(['--help']);
    assert.ok(output.includes('sync'), 'help should mention sync command');
  });
});

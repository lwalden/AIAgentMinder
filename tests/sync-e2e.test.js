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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-e2e-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Simulate a v3.3 installation: commands (not skills), old rules, old settings,
 * no agents, no new scripts.
 */
function createV33Installation(dir) {
  // Version stamp
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');

  // Commands (pre-v4.0, before skills migration)
  const commands = ['aam-handoff', 'aam-brief', 'aam-quality-gate',
    'aam-self-review', 'aam-milestone', 'aam-retrospective', 'aam-revise',
    'aam-scope-check', 'aam-tdd', 'aam-triage', 'aam-grill'];
  fs.mkdirSync(path.join(dir, '.claude', 'commands'), { recursive: true });
  for (const cmd of commands) {
    fs.writeFileSync(path.join(dir, '.claude', 'commands', `${cmd}.md`), `# ${cmd}\nold v3.3 content`);
  }

  // Old rules (v3.3 had these as always-active rules, not in agents)
  fs.mkdirSync(path.join(dir, '.claude', 'rules'), { recursive: true });
  const rules = ['git-workflow', 'tool-first', 'scope-guardian', 'approach-first',
    'debug-checkpoint', 'code-quality', 'sprint-workflow', 'architecture-fitness',
    'correction-capture'];
  for (const rule of rules) {
    fs.writeFileSync(path.join(dir, '.claude', 'rules', `${rule}.md`), `# ${rule}\nold content`);
  }

  // Old scripts (v3.3 had fewer scripts)
  fs.mkdirSync(path.join(dir, '.claude', 'scripts'), { recursive: true });
  const scripts = ['context-monitor.sh', 'context-cycle.sh', 'context-cycle-hook.sh',
    'sprint-update.sh', 'install-profile-hook.ps1', 'install-profile-hook.sh',
    'sprint-runner.ps1', 'sprint-runner.sh'];
  for (const script of scripts) {
    fs.writeFileSync(path.join(dir, '.claude', 'scripts', script), '#!/bin/bash\n# old v3.3');
  }

  // Old settings (v3.3 had only PreToolUse hook)
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify({
    env: { ANTHROPIC_API_KEY: 'user-key' },
    statusLine: { type: 'command', command: 'bash .claude/scripts/context-monitor.sh' },
    hooks: {
      PreToolUse: [{
        matcher: '',
        hooks: [{ type: 'command', command: 'bash .claude/scripts/context-cycle-hook.sh' }],
      }],
    },
  }, null, 2));

  // User-owned files
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# My Project\nUser content here');
  fs.writeFileSync(path.join(dir, 'DECISIONS.md'), '# My Decisions\nUser decisions');
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'strategy-roadmap.md'), '# My Roadmap');
}

describe('E2E: sync --apply on v3.3 installation', () => {
  let targetDir;

  beforeEach(() => {
    targetDir = makeTempDir();
    createV33Installation(targetDir);
  });

  afterEach(() => {
    cleanTempDir(targetDir);
  });

  it('upgrades version stamp to current', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    const version = fs.readFileSync(
      path.join(targetDir, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    const templateVersion = fs.readFileSync(
      path.join(TEMPLATE_DIR, '.claude', 'aiagentminder-version'), 'utf-8'
    ).trim();
    assert.equal(version, templateVersion);
  });

  it('removes old commands (v4.0 migration)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-handoff.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'commands', 'aam-brief.md')));
  });

  it('creates skills directory with current skills', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-handoff.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-brief.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'skills', 'aam-backlog.md')));
  });

  it('removes obsolete rules (v4.1 migration)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'scope-guardian.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'approach-first.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'sprint-workflow.md')));
    assert.ok(!fs.existsSync(path.join(targetDir, '.claude', 'rules', 'architecture-fitness.md')));
  });

  it('preserves universal rules with updated content', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    const gitWorkflow = fs.readFileSync(
      path.join(targetDir, '.claude', 'rules', 'git-workflow.md'), 'utf-8'
    );
    assert.ok(!gitWorkflow.includes('old content'), 'should be overwritten with current content');
    assert.ok(gitWorkflow.includes('type(scope)'), 'should have current git-workflow content');
  });

  it('creates agents directory (new in v4.1)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'dev.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'sprint-master.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'debug.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'hotfix.md')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'qa.md')));
  });

  it('adds missing scripts', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'correction-capture-hook.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'decisions-log.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'sprint-stop-guard.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'version-bump.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'session-start-hook.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'stop-failure-hook.sh')));
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'scripts', 'backlog-capture.sh')));
  });

  it('merges settings.json adding new hooks while preserving user config', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    const settings = JSON.parse(
      fs.readFileSync(path.join(targetDir, '.claude', 'settings.json'), 'utf-8')
    );
    // User config preserved
    assert.equal(settings.env.ANTHROPIC_API_KEY, 'user-key');
    // New hooks added
    assert.ok(settings.hooks.PostToolUse, 'should have PostToolUse');
    assert.ok(settings.hooks.Stop, 'should have Stop');
    assert.ok(settings.hooks.SessionStart, 'should have SessionStart');
    assert.ok(settings.hooks.StopFailure, 'should have StopFailure');
    // Existing hook preserved
    assert.ok(settings.hooks.PreToolUse.some(e =>
      e.hooks.some(h => h.command.includes('context-cycle-hook'))));
  });

  it('does not overwrite user-owned files', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.equal(
      fs.readFileSync(path.join(targetDir, 'DECISIONS.md'), 'utf-8'),
      '# My Decisions\nUser decisions'
    );
    assert.equal(
      fs.readFileSync(path.join(targetDir, 'docs', 'strategy-roadmap.md'), 'utf-8'),
      '# My Roadmap'
    );
  });

  it('skips CLAUDE.md (hybrid)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.equal(
      fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf-8'),
      '# My Project\nUser content here'
    );
  });

  it('adds context-cycling.md rule (new in v4.1)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'rules', 'context-cycling.md')));
  });

  it('creates BACKLOG.md if missing (new in v4.1)', () => {
    execFileSync('node', [BIN, 'sync', targetDir, '--apply'], { encoding: 'utf-8' });
    assert.ok(fs.existsSync(path.join(targetDir, 'BACKLOG.md')));
  });
});

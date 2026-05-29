import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Raw path, matching the existing bash-script test convention (see
// sprint-update.test.js). Runs green on Linux CI; Windows-local runs require a
// POSIX bash where the repo path resolves (the whole suite shares this trait).
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'strip-retired-hooks.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-strip-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Run the strip script against a settings file given by RELATIVE path, with
// cwd set to the temp dir — avoids absolute Windows-path mangling in Git Bash.
function strip(relPath, cwd) {
  return execFileSync('bash', [SCRIPT, relPath], {
    encoding: 'utf-8',
    cwd,
    env: { ...process.env },
  });
}

function writeSettings(dir, name, obj) {
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  const p = path.join(dir, '.claude', name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

function readSettings(dir, name) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.claude', name), 'utf-8'));
}

// A pre-5.0 install that wired the retired cycle hooks into the project's
// own settings.json, alongside still-valid hooks and unrelated config.
function legacySettings() {
  return {
    statusLine: { type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"' },
    permissions: { allow: ['Bash(npm test)'] },
    hooks: {
      PreToolUse: [
        {
          matcher: 'Edit|Write|MultiEdit',
          hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/context-cycle-hook.sh"' }],
        },
        {
          matcher: '*',
          hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/sprint-phase-guard.sh"' }],
        },
      ],
      SessionStart: [
        { hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/session-start-continuation.sh"' }] },
      ],
      SessionEnd: [
        { hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/session-end-cycle.sh"' }] },
      ],
    },
  };
}

describe('strip-retired-hooks.sh: removes retired auto-cycle hooks', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('removes the context-cycle-hook.sh PreToolUse entry', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const raw = fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf-8');
    assert.ok(!raw.includes('context-cycle-hook.sh'), 'context-cycle-hook.sh reference must be gone');
  });

  it('preserves sibling PreToolUse hooks (sprint-phase-guard.sh)', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    const cmds = (s.hooks?.PreToolUse ?? []).flatMap((g) => (g.hooks ?? []).map((h) => h.command));
    assert.ok(cmds.some((c) => c.includes('sprint-phase-guard.sh')), 'valid hook must survive');
    assert.equal(cmds.length, 1, 'only the retired PreToolUse hook is removed');
  });

  it('removes session-start-continuation.sh and session-end-cycle.sh', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const raw = fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf-8');
    assert.ok(!raw.includes('session-start-continuation.sh'), 'SessionStart cycle hook gone');
    assert.ok(!raw.includes('session-end-cycle.sh'), 'SessionEnd cycle hook gone');
  });

  it('prunes emptied event arrays and leaves no empty groups', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    // SessionStart and SessionEnd contained ONLY retired hooks → keys removed entirely.
    assert.ok(!('SessionStart' in (s.hooks ?? {})), 'empty SessionStart array removed');
    assert.ok(!('SessionEnd' in (s.hooks ?? {})), 'empty SessionEnd array removed');
    // No group should have an empty hooks array.
    for (const groups of Object.values(s.hooks ?? {})) {
      for (const g of groups) {
        assert.ok((g.hooks ?? []).length > 0, 'no empty hook groups left behind');
      }
    }
  });

  it('preserves unrelated top-level settings (statusLine, permissions)', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    assert.ok(s.statusLine, 'statusLine preserved');
    assert.ok(s.statusLine.command.includes('context-monitor.sh'), 'statusLine command intact');
    assert.deepEqual(s.permissions, { allow: ['Bash(npm test)'] }, 'permissions preserved');
  });

  it('removes only the retired inner hook from a mixed group, keeping the group', () => {
    writeSettings(dir, 'settings.json', {
      hooks: {
        PreToolUse: [
          {
            matcher: '*',
            hooks: [
              { type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/context-cycle-hook.sh"' },
              { type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/sprint-phase-guard.sh"' },
            ],
          },
        ],
      },
    });
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    const group = s.hooks.PreToolUse[0];
    assert.equal(group.hooks.length, 1, 'retired inner hook removed, valid one kept');
    assert.ok(group.hooks[0].command.includes('sprint-phase-guard.sh'));
    assert.equal(group.matcher, '*', 'group matcher preserved');
  });

  it('leaves a clean settings file unchanged', () => {
    const clean = {
      statusLine: { type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"' },
      hooks: { PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/sprint-phase-guard.sh"' }] }] },
    };
    writeSettings(dir, 'settings.json', clean);
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    assert.deepEqual(s, clean, 'no retired hooks → content semantically unchanged');
  });

  it('is idempotent (second run is a no-op)', () => {
    writeSettings(dir, 'settings.json', legacySettings());
    strip('.claude/settings.json', dir);
    const first = readSettings(dir, 'settings.json');
    strip('.claude/settings.json', dir);
    const second = readSettings(dir, 'settings.json');
    assert.deepEqual(second, first, 'running twice yields the same result');
  });

  it('no-ops (exit 0) when the settings file is absent', () => {
    // Should not throw and should not create the file.
    const out = strip('.claude/settings.json', dir);
    assert.equal(typeof out, 'string');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'settings.json')), 'absent file is not created');
  });

  it('handles settings with no hooks key at all', () => {
    writeSettings(dir, 'settings.json', { statusLine: { type: 'command', command: 'x' } });
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    assert.deepEqual(s, { statusLine: { type: 'command', command: 'x' } });
  });

  it('exits non-zero when no file argument is given', () => {
    assert.throws(() => {
      execFileSync('bash', [SCRIPT], { encoding: 'utf-8', cwd: dir, env: { ...process.env } });
    }, /usage/i);
  });
});

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

  it('removes the retired correction-capture-hook.sh (v4.6 retirement)', () => {
    writeSettings(dir, 'settings.json', {
      hooks: {
        PostToolUse: [
          { hooks: [{ type: 'command', command: 'bash .claude/scripts/correction-capture-hook.sh' }] },
        ],
        Stop: [
          { hooks: [{ type: 'command', command: 'bash .claude/scripts/my-own-hook.sh' }] },
        ],
      },
    });
    strip('.claude/settings.json', dir);
    const s = readSettings(dir, 'settings.json');
    assert.ok(!('PostToolUse' in s.hooks), 'correction-capture-hook.sh entry removed and group pruned');
    assert.ok(s.hooks.Stop[0].hooks[0].command.includes('my-own-hook.sh'), 'user hook preserved');
  });
});

// ---------------------------------------------------------------------------
// migrate mode (legacy-migrate.sh, also reachable as strip-retired-hooks.sh
// migrate): manifest-driven retirement of pre-5.0 file copies + hook de-dup.
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
// Forward slashes so Git Bash on Windows accepts the path in env vars.
const PLUGIN_ROOT_POSIX = REPO_ROOT.replace(/\\/g, '/');

function migrate(cwd, ...args) {
  return execFileSync('bash', [SCRIPT, 'migrate', ...args], {
    encoding: 'utf-8',
    cwd,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT_POSIX },
  });
}

function repoFile(...segs) {
  return fs.readFileSync(path.join(REPO_ROOT, ...segs), 'utf-8');
}

// A realistic pre-5.0 hybrid install (modeled on a real field example):
// stale agent/script copies plus duplicate + retired hook registrations.
function makeLegacyProject(dir) {
  fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'scripts'), { recursive: true });
  const w = (rel, content) => fs.writeFileSync(path.join(dir, rel), content, 'utf-8');

  // Agents: one exact plugin copy, one divergent (local customization), one user-owned.
  w('.claude/agents/dev.md', repoFile('agents', 'dev.md'));
  w('.claude/agents/sprint-master.md', repoFile('agents', 'sprint-master.md') + '\nLOCAL CUSTOMIZATION\n');
  w('.claude/agents/my-custom-agent.md', '# My custom agent\nNot AAM\'s.\n');

  // Scripts: retired (no current counterpart), CRLF-only difference,
  // exact copy (context-monitor, referenced by legacy statusLine),
  // exact copy referenced by a USER hook, and a user-owned runner.
  w('.claude/scripts/context-cycle-hook.sh', '#!/bin/bash\necho retired cycle protocol\n');
  w('.claude/scripts/sprint-update.sh', repoFile('bin', 'sprint-update.sh').replace(/\n/g, '\r\n'));
  w('.claude/scripts/context-monitor.sh', repoFile('bin', 'context-monitor.sh'));
  w('.claude/scripts/backlog-capture.sh', repoFile('bin', 'backlog-capture.sh'));
  w('.claude/scripts/run-mystack-tests.ps1', 'param()\n# user-owned canonical test runner\n');

  writeSettings(dir, 'settings.json', {
    statusLine: { type: 'command', command: 'bash .claude/scripts/context-monitor.sh' },
    permissions: { allow: ['Bash(npm test)'] },
    hooks: {
      PreToolUse: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/context-cycle-hook.sh' }] },
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/sprint-phase-guard.sh' }] },
      ],
      PostToolUse: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/correction-capture-hook.sh' }] },
      ],
      SessionEnd: [
        { hooks: [{ type: 'command', command: 'bash .claude/scripts/hlpm-ping.sh session_end' }] },
      ],
      Stop: [
        {
          hooks: [
            { type: 'command', command: 'bash .claude/scripts/sprint-stop-guard.sh' },
            { type: 'command', command: 'bash .claude/scripts/my-own-hook.sh' },
            { type: 'command', command: 'bash .claude/scripts/backlog-capture.sh add "user wired this"' },
          ],
        },
      ],
    },
  });
}

function retiredDir(dir) {
  const entries = fs.readdirSync(path.join(dir, '.claude'))
    .filter((e) => e.startsWith('legacy-retired-'));
  return entries.length ? path.join(dir, '.claude', entries[0]) : null;
}

describe('legacy migration (strip-retired-hooks.sh migrate)', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); makeLegacyProject(dir); });
  afterEach(() => { cleanTempDir(dir); });

  it('dry-run by default: reports the plan but changes nothing', () => {
    const before = readSettings(dir, 'settings.json');
    const out = migrate(dir);
    assert.match(out, /DRY-RUN/, 'must announce dry-run mode');
    assert.match(out, /--apply/, 'must point at --apply');
    assert.deepEqual(readSettings(dir, 'settings.json'), before, 'settings untouched');
    assert.ok(fs.existsSync(path.join(dir, '.claude', 'agents', 'dev.md')), 'no file moved');
    assert.equal(retiredDir(dir), null, 'no backup dir created in dry-run');
    const leftovers = fs.readdirSync(path.join(dir, '.claude')).filter((e) => e.endsWith('.migrate.tmp'));
    assert.equal(leftovers.length, 0, 'no temp files left behind');
  });

  it('--apply retires exact plugin-copy matches into .claude/legacy-retired-<ts>/', () => {
    migrate(dir, '--apply');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'agents', 'dev.md')), 'stale agent copy moved out');
    const rd = retiredDir(dir);
    assert.ok(rd, 'backup dir created');
    assert.ok(fs.existsSync(path.join(rd, 'agents', 'dev.md')), 'moved (not deleted) — recoverable backup');
  });

  it('--apply retires known-retired scripts that have no current plugin counterpart', () => {
    migrate(dir, '--apply');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'scripts', 'context-cycle-hook.sh')));
    assert.ok(fs.existsSync(path.join(retiredDir(dir), 'scripts', 'context-cycle-hook.sh')));
  });

  it('treats CRLF/whitespace-only differences as a match (still retires)', () => {
    migrate(dir, '--apply');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'scripts', 'sprint-update.sh')),
      'CRLF-only difference must not count as divergence');
  });

  it('skips divergent candidates by default (customization-safe)', () => {
    const out = migrate(dir, '--apply');
    assert.ok(fs.existsSync(path.join(dir, '.claude', 'agents', 'sprint-master.md')),
      'divergent file preserved');
    assert.match(out, /DIVERGES/, 'must explain why it was skipped');
    assert.match(out, /--force-divergent/, 'must mention the override');
  });

  it('--force-divergent retires divergent candidates too', () => {
    migrate(dir, '--apply', '--force-divergent');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'agents', 'sprint-master.md')));
    assert.ok(fs.existsSync(path.join(retiredDir(dir), 'agents', 'sprint-master.md')),
      'divergent file still backed up, never deleted');
  });

  it('never touches files AAM did not ship (user property)', () => {
    const out = migrate(dir, '--apply', '--force-divergent');
    assert.ok(fs.existsSync(path.join(dir, '.claude', 'agents', 'my-custom-agent.md')), 'user agent kept');
    assert.ok(fs.existsSync(path.join(dir, '.claude', 'scripts', 'run-mystack-tests.ps1')), 'user test runner kept');
    assert.match(out, /not an AAM-shipped file/, 'must report user files as kept');
  });

  it('--apply de-dups hooks the plugin registers via hooks.json, preserving user hooks', () => {
    migrate(dir, '--apply');
    const raw = fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf-8');
    assert.ok(!raw.includes('sprint-phase-guard.sh'), 'plugin-registered duplicate removed');
    assert.ok(!raw.includes('hlpm-ping.sh'), 'plugin-registered duplicate removed');
    assert.ok(!raw.includes('sprint-stop-guard.sh'), 'plugin-registered duplicate removed');
    assert.ok(!raw.includes('context-cycle-hook.sh'), 'retired hook removed');
    assert.ok(!raw.includes('correction-capture-hook.sh'), 'retired hook removed');
    const s = readSettings(dir, 'settings.json');
    const stopCmds = s.hooks.Stop.flatMap((g) => g.hooks.map((h) => h.command));
    assert.ok(stopCmds.some((c) => c.includes('my-own-hook.sh')), 'user hook preserved');
    assert.ok(stopCmds.some((c) => c.includes('backlog-capture.sh')), 'user-wired AAM-script hook preserved');
    assert.deepEqual(s.permissions, { allow: ['Bash(npm test)'] }, 'unrelated settings preserved');
  });

  it('--apply repoints a legacy statusLine at the plugin copy and retires the local script', () => {
    migrate(dir, '--apply');
    const s = readSettings(dir, 'settings.json');
    assert.equal(
      s.statusLine.command,
      'bash "${CLAUDE_PLUGIN_ROOT}/bin/context-monitor.sh"',
      'statusLine kept (intentionally project-level) but repointed at the plugin'
    );
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'scripts', 'context-monitor.sh')),
      'local copy retired once nothing references it');
  });

  it('keeps a script that surviving project settings still reference', () => {
    const out = migrate(dir, '--apply');
    assert.ok(fs.existsSync(path.join(dir, '.claude', 'scripts', 'backlog-capture.sh')),
      'user hook still points at .claude/scripts/backlog-capture.sh — retiring it would break the hook');
    assert.match(out, /still referenced/, 'must report the kept-referenced reason');
  });

  it('--apply is idempotent (second run finds nothing to do)', () => {
    migrate(dir, '--apply');
    const after = readSettings(dir, 'settings.json');
    const out = migrate(dir, '--apply');
    assert.match(out, /retired=0/, 'second run retires nothing');
    assert.match(out, /hooks-deduped=0/, 'second run de-dups nothing');
    assert.deepEqual(readSettings(dir, 'settings.json'), after, 'settings stable across runs');
  });

  it('prints a category summary in both modes', () => {
    const dry = migrate(dir);
    assert.match(dry, /retired=\d+ skipped-divergent=\d+ kept-not-ours=\d+ kept-referenced=\d+ hooks-deduped=\d+/);
    const applied = migrate(dir, '--apply');
    assert.match(applied, /retired=\d+ skipped-divergent=\d+ kept-not-ours=\d+ kept-referenced=\d+ hooks-deduped=\d+/);
  });

  it('rejects unknown flags with a usage error', () => {
    assert.throws(() => migrate(dir, '--nuke'), /usage/i);
  });
});

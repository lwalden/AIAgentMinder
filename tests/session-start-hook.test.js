import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'session-start-hook.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-session-start-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runHook(hookInput, cwd) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: JSON.stringify(hookInput),
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}

function sessionStartInput() {
  return {
    hook_event_name: 'SessionStart',
    session_id: 'test-session-123',
    cwd: '/tmp/test',
  };
}

describe('session-start-hook.sh', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('exits 0 with no output when no continuation signal exists', () => {
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    // No continuation file and no in-progress sprint => CONTEXT stays empty and
    // the hook prints nothing. Assert truly-empty output so a regression that
    // emits a spurious envelope on every session start is caught.
    assert.equal(result.stdout.trim(), '');
  });

  it('does not inject anything for a stale .sprint-continuation.md (cycle protocol retired)', () => {
    fs.writeFileSync(path.join(dir, '.sprint-continuation.md'), '# stale leftover\n');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const trimmed = result.stdout.trim();
    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      const ctx = parsed.hookSpecificOutput?.additionalContext || '';
      assert.ok(!ctx.includes('CONTEXT CYCLE'), 'CONTEXT CYCLE protocol should no longer fire');
    }
  });

  it('injects sprint reminder when SPRINT.md has in-progress sprint', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), '**Status:** in-progress\n| S2-003 | Test | feature | | todo | n/a |');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.ok(parsed.hookSpecificOutput?.additionalContext?.includes('sprint'),
      'should mention active sprint');
    assert.equal(parsed.hookSpecificOutput?.hookEventName, 'SessionStart',
      'output envelope must include hookEventName: SessionStart (Claude Code rejects it otherwise)');
  });

  it('emits hookEventName "SessionStart" in the output envelope when injecting context', () => {
    // Regression: a missing hookEventName makes Claude Code reject the hook
    // output with "hookSpecificOutput is missing required field hookEventName",
    // silently dropping the active-sprint reminder. See issue #170.
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), '**Status:** in-progress\n');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.equal(parsed.hookSpecificOutput?.hookEventName, 'SessionStart');
  });

  it('does not inject sprint reminder when no active sprint', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), '**Status:** proposed\n');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const trimmed = result.stdout.trim();
    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      const ctx = parsed.hookSpecificOutput?.additionalContext || '';
      assert.ok(!ctx.includes('sprint'), 'should not mention sprint when not in-progress');
    }
  });
});

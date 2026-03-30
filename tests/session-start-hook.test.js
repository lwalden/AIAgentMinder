import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'session-start-hook.sh');

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
    const trimmed = result.stdout.trim();
    // Either empty or valid JSON with no additionalContext
    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      assert.ok(!parsed.hookSpecificOutput?.additionalContext ||
        parsed.hookSpecificOutput.additionalContext === '');
    }
  });

  it('injects continuation context when .sprint-continuation.md exists', () => {
    fs.writeFileSync(path.join(dir, '.sprint-continuation.md'), '# Sprint Continuation State\n**Sprint:** S2\n');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.ok(parsed.hookSpecificOutput?.additionalContext?.includes('CONTEXT CYCLE'),
      'should inject CONTEXT CYCLE instruction');
  });

  it('injects sprint reminder when SPRINT.md has in-progress sprint', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), '**Status:** in-progress\n| S2-003 | Test | feature | | todo | n/a |');
    const result = runHook(sessionStartInput(), dir);
    assert.equal(result.exitCode, 0);
    const parsed = JSON.parse(result.stdout.trim());
    assert.ok(parsed.hookSpecificOutput?.additionalContext?.includes('sprint'),
      'should mention active sprint');
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

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'stop-failure-hook.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-stop-failure-'));
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

function stopFailureInput(errorMessage = 'API rate limit exceeded') {
  return {
    hook_event_name: 'StopFailure',
    error_message: errorMessage,
    session_id: 'test-session-123',
  };
}

describe('stop-failure-hook.sh', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('exits 0 (observation hook, never blocks)', () => {
    const result = runHook(stopFailureInput(), dir);
    assert.equal(result.exitCode, 0);
  });

  it('writes continuation signal when sprint is in-progress', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'),
      '**Status:** in-progress\n| S2-003 | Test | feature | | in-progress | n/a |');
    const result = runHook(stopFailureInput(), dir);
    assert.equal(result.exitCode, 0);
    assert.ok(fs.existsSync(path.join(dir, '.sprint-continue-signal')),
      'should create continuation signal');
  });

  it('does not write continuation signal when no active sprint', () => {
    const result = runHook(stopFailureInput(), dir);
    assert.equal(result.exitCode, 0);
    assert.ok(!fs.existsSync(path.join(dir, '.sprint-continue-signal')),
      'should not create signal without active sprint');
  });

  it('logs error to .sprint-errors.log', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'),
      '**Status:** in-progress\n| S2-003 | Test | feature | | in-progress | n/a |');
    runHook(stopFailureInput('Connection timeout'), dir);
    const log = fs.readFileSync(path.join(dir, '.sprint-errors.log'), 'utf-8');
    assert.ok(log.includes('Connection timeout'), 'should log the error message');
  });
});

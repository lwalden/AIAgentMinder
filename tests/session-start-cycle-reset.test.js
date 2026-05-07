import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(
  __dirname,
  '..',
  'project',
  '.claude',
  'scripts',
  'session-start-cycle-reset.sh'
);

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-cycle-reset-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runHook(cwd, input = {}) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: JSON.stringify(input),
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status };
  }
}

describe('session-start-cycle-reset.sh — F1 fix', () => {
  let dir;
  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    cleanTempDir(dir);
  });

  it('exits 0 cleanly when no stale files exist', () => {
    const result = runHook(dir);
    assert.equal(result.exitCode, 0);
  });

  it('removes stale .context-usage on session start', () => {
    const usagePath = path.join(dir, '.context-usage');
    fs.writeFileSync(
      usagePath,
      JSON.stringify({
        should_cycle: true,
        used_tokens: 900000,
        threshold: 580000,
        used_pct: 90,
        window_size: 1000000,
        total_input: 900000,
        total_output: 0,
        exceeds_200k: true,
        model: 'claude-opus',
      })
    );
    assert.ok(fs.existsSync(usagePath), 'precondition: file exists');

    const result = runHook(dir);
    assert.equal(result.exitCode, 0);
    assert.ok(!fs.existsSync(usagePath), '.context-usage should be removed');
  });

  it('resets stale .sprint-tool-count on session start', () => {
    const counterPath = path.join(dir, '.sprint-tool-count');
    fs.writeFileSync(counterPath, '247');
    assert.ok(fs.existsSync(counterPath), 'precondition: file exists');

    const result = runHook(dir);
    assert.equal(result.exitCode, 0);
    assert.ok(!fs.existsSync(counterPath), '.sprint-tool-count should be removed');
  });

  it('removes both stale files in a single invocation', () => {
    const usagePath = path.join(dir, '.context-usage');
    const counterPath = path.join(dir, '.sprint-tool-count');
    fs.writeFileSync(usagePath, JSON.stringify({ should_cycle: true }));
    fs.writeFileSync(counterPath, '300');

    const result = runHook(dir);
    assert.equal(result.exitCode, 0);
    assert.ok(!fs.existsSync(usagePath), '.context-usage should be removed');
    assert.ok(!fs.existsSync(counterPath), '.sprint-tool-count should be removed');
  });

  it('is idempotent — second invocation also exits 0 with files already gone', () => {
    fs.writeFileSync(path.join(dir, '.context-usage'), JSON.stringify({ should_cycle: true }));
    runHook(dir);
    const result = runHook(dir);
    assert.equal(result.exitCode, 0);
  });

  it('does not touch unrelated dot-files', () => {
    const sprintMd = path.join(dir, 'SPRINT.md');
    const continuation = path.join(dir, '.sprint-continuation.md');
    const signal = path.join(dir, '.sprint-continue-signal');
    fs.writeFileSync(sprintMd, '**Status:** in-progress');
    fs.writeFileSync(continuation, 'continuation content');
    fs.writeFileSync(signal, '');
    fs.writeFileSync(path.join(dir, '.context-usage'), JSON.stringify({ should_cycle: true }));

    runHook(dir);

    assert.ok(fs.existsSync(sprintMd), 'SPRINT.md must not be touched');
    assert.ok(fs.existsSync(continuation), '.sprint-continuation.md must not be touched');
    assert.ok(fs.existsSync(signal), '.sprint-continue-signal must not be touched');
  });

  it('consumes stdin without erroring on empty input', () => {
    const result = runHook(dir, '');
    assert.equal(result.exitCode, 0);
  });

  it('script is executable and has a shebang', () => {
    const content = fs.readFileSync(SCRIPT, 'utf-8');
    assert.ok(content.startsWith('#!'), 'script must start with shebang');
  });
});

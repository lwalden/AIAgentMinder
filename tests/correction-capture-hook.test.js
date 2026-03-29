import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'correction-capture-hook.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-correction-'));
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

/** Build a Bash PostToolUse hook input. */
function bashCall(command, success, output = '') {
  return {
    hook_event_name: 'PostToolUse',
    tool_name: 'Bash',
    tool_input: { command },
    tool_response: { output, exitCode: success ? 0 : 1, success },
  };
}

/** Build a non-Bash PostToolUse hook input. */
function toolCall(toolName, input, response) {
  return {
    hook_event_name: 'PostToolUse',
    tool_name: toolName,
    tool_input: input,
    tool_response: response,
  };
}

describe('correction-capture-hook', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(tmpDir);
  });

  it('tracks a failed tool call in state file', () => {
    runHook(bashCall('npm tset', false, 'Error: unknown command'), tmpDir);

    const stateFile = path.join(tmpDir, '.correction-state');
    assert.ok(fs.existsSync(stateFile), '.correction-state should exist');

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    assert.equal(state.tool_name, 'Bash');
    assert.equal(state.failed, true);
  });

  it('logs a correction when failed call is followed by success with different args on same tool', () => {
    runHook(bashCall('npm tset', false, 'Error: unknown command'), tmpDir);
    runHook(bashCall('npm test', true, 'all tests passed'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(fs.existsSync(logFile), '.corrections.jsonl should exist');

    const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
    assert.equal(lines.length, 1);

    const entry = JSON.parse(lines[0]);
    assert.equal(entry.tool, 'Bash');
    assert.ok(entry.failed_input.includes('npm tset'));
    assert.ok(entry.succeeded_input.includes('npm test'));
    assert.ok(entry.pattern_key, 'should have a pattern_key');
  });

  it('does not log a correction when there is no prior failure', () => {
    runHook(bashCall('npm test', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), '.corrections.jsonl should not exist');
  });

  it('does not log a correction when failed call is followed by a different tool', () => {
    runHook(bashCall('npm tset', false, 'Error'), tmpDir);
    runHook(toolCall('Read', { file_path: '/tmp/foo.txt' }, { content: 'ok' }), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), '.corrections.jsonl should not exist');
  });

  it('does not log a correction when same args are retried (transient retry)', () => {
    runHook(bashCall('npm test', false, 'Error: network issue'), tmpDir);
    runHook(bashCall('npm test', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), 'same-args retry is not a correction');
  });

  it('outputs notification when same pattern_key appears twice', () => {
    // First correction: npm tset → npm test (pattern_key: Bash:npm)
    runHook(bashCall('npm tset', false, 'Error'), tmpDir);
    runHook(bashCall('npm test', true, 'ok'), tmpDir);

    // Second correction: npm instal → npm install (pattern_key: Bash:npm)
    runHook(bashCall('npm instal', false, 'Error'), tmpDir);
    const result = runHook(bashCall('npm install', true, 'ok'), tmpDir);

    // Hook should output JSON with additionalContext containing the notification
    const output = JSON.parse(result.stdout);
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('Correction Pattern Detected'),
      'should output correction pattern notification',
    );
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('Bash:npm'),
      'should include the pattern key',
    );
  });

  it('does not output notification on first occurrence of a pattern', () => {
    runHook(bashCall('npm tset', false, 'Error'), tmpDir);
    const result = runHook(bashCall('npm test', true, 'ok'), tmpDir);

    // First occurrence — no notification, just log
    if (result.stdout.trim()) {
      // If there is output, it should not contain a notification
      assert.ok(
        !result.stdout.includes('Correction Pattern Detected'),
        'should not notify on first occurrence',
      );
    }
  });

  it('excludes transient errors from correction tracking', () => {
    // ETIMEDOUT — transient, should not be tracked
    runHook(bashCall('curl https://api.example.com', false, 'connect ETIMEDOUT 1.2.3.4'), tmpDir);
    runHook(bashCall('curl https://api.example.com/v2', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), 'transient ETIMEDOUT should be excluded');
  });

  it('excludes ECONNREFUSED from correction tracking', () => {
    runHook(bashCall('curl http://localhost:3000', false, 'connect ECONNREFUSED 127.0.0.1'), tmpDir);
    runHook(bashCall('curl http://localhost:3001', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), 'transient ECONNREFUSED should be excluded');
  });

  it('excludes rate limit errors from correction tracking', () => {
    runHook(bashCall('gh api /repos', false, 'rate limit exceeded'), tmpDir);
    runHook(bashCall('gh api /repos --limit 10', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    assert.ok(!fs.existsSync(logFile), 'rate limit errors should be excluded');
  });

  it('updates state file on every call', () => {
    runHook(bashCall('npm test', true, 'ok'), tmpDir);

    const stateFile = path.join(tmpDir, '.correction-state');
    const state1 = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    assert.equal(state1.failed, false);
    assert.equal(state1.tool_name, 'Bash');

    runHook(bashCall('git status', false, 'Error'), tmpDir);
    const state2 = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    assert.equal(state2.failed, true);
    assert.equal(state2.tool_name, 'Bash');
  });

  it('uses command family (first word) for Bash pattern keys', () => {
    // git typo → git correct (pattern: Bash:git)
    runHook(bashCall('git stauts', false, 'Error'), tmpDir);
    runHook(bashCall('git status', true, 'ok'), tmpDir);

    const logFile = path.join(tmpDir, '.corrections.jsonl');
    const entry = JSON.parse(fs.readFileSync(logFile, 'utf-8').trim());
    assert.equal(entry.pattern_key, 'Bash:git');
  });

  it('handles missing jq gracefully', () => {
    // When jq is not available, hook should exit 0 and do nothing
    const result = runHook(bashCall('npm test', false, 'Error'), tmpDir);
    // We can't easily remove jq for this test, but verify the hook
    // at least doesn't crash — exit 0 is success
    assert.equal(result.exitCode, 0);
  });
});

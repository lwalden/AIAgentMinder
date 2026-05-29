import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'context-warning-hook.sh');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-ctxwarn-'));
}
function run(cwd, input = {}) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: JSON.stringify(input),
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}
function writeUsage(dir, obj) {
  fs.writeFileSync(path.join(dir, '.context-usage'), JSON.stringify(obj));
}

describe('context-warning-hook.sh', () => {
  let dir;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('exits 0 silently when .context-usage is absent (web / no status line)', () => {
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('exits 0 silently when should_cycle=false', () => {
    writeUsage(dir, { should_cycle: false, used_tokens: 100, threshold: 580000, used_pct: 1 });
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('emits a systemMessage warning when should_cycle=true', () => {
    writeUsage(dir, { should_cycle: true, used_tokens: 700000, threshold: 580000, used_pct: 70 });
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    const parsed = JSON.parse(r.stdout.trim());
    const ctx = parsed.systemMessage || '';
    assert.match(ctx, /Context over threshold/);
    assert.match(ctx, /700000/);
    assert.match(ctx, /580000/);
  });

  it('warning text recommends /aiagentminder:handoff', () => {
    writeUsage(dir, { should_cycle: true, used_tokens: 700000, threshold: 580000, used_pct: 70 });
    const r = run(dir);
    const parsed = JSON.parse(r.stdout.trim());
    assert.match(parsed.systemMessage, /\/aiagentminder:handoff/);
  });

  it('warning text does NOT prescribe an auto-cycle protocol (no BLOCKED, no .sprint-continuation.md)', () => {
    writeUsage(dir, { should_cycle: true, used_tokens: 700000, threshold: 580000, used_pct: 70 });
    const r = run(dir);
    const parsed = JSON.parse(r.stdout.trim());
    const ctx = parsed.systemMessage;
    assert.doesNotMatch(ctx, /BLOCKED/);
    assert.doesNotMatch(ctx, /sprint-continuation/);
    assert.doesNotMatch(ctx, /CONTEXT CYCLE/);
  });

  it('emits a valid Stop-hook payload (systemMessage, no hookSpecificOutput)', () => {
    writeUsage(dir, { should_cycle: true, used_tokens: 700000, threshold: 580000, used_pct: 70 });
    const r = run(dir);
    let parsed;
    assert.doesNotThrow(() => { parsed = JSON.parse(r.stdout.trim()); });
    // Stop-hook contract: warning rides on top-level systemMessage, never
    // hookSpecificOutput.additionalContext (invalid for the Stop event).
    assert.ok(parsed.systemMessage, 'must emit systemMessage');
    assert.equal(parsed.hookSpecificOutput, undefined, 'must not emit hookSpecificOutput on a Stop hook');
    // Regression guard: any hookSpecificOutput, if present, must carry hookEventName.
    if (parsed.hookSpecificOutput !== undefined) {
      assert.ok(parsed.hookSpecificOutput.hookEventName, 'hookSpecificOutput requires hookEventName');
    }
  });
});

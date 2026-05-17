import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'sprint-phase-reminder.sh');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-phaserem-'));
}
function run(cwd) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: '{}',
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}
function writeSprint(dir, status, phase, inProgressItem = '') {
  const item = inProgressItem
    ? `| ${inProgressItem} | Test | feature | | in-progress | n/a |`
    : '';
  fs.writeFileSync(
    path.join(dir, 'SPRINT.md'),
    `**Status:** ${status}\n**Phase:** ${phase}\n\n| ID | Title | Type | Risk | Status | Post-Merge |\n|---|---|---|---|---|---|\n${item}\n`
  );
}

describe('sprint-phase-reminder.sh', () => {
  let dir;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('silent when SPRINT.md is absent', () => {
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('silent when sprint status is not in-progress', () => {
    writeSprint(dir, 'proposed', 'EXECUTE');
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('silent when no Phase line is present', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), '**Status:** in-progress\n');
    const r = run(dir);
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('emits PLAN reminder', () => {
    writeSprint(dir, 'in-progress', 'PLAN');
    const r = run(dir);
    const parsed = JSON.parse(r.stdout.trim());
    assert.match(parsed.hookSpecificOutput.additionalContext, /PLAN phase/);
  });

  it('emits EXECUTE reminder with current item id', () => {
    writeSprint(dir, 'in-progress', 'EXECUTE', 'S9-005');
    const r = run(dir);
    const parsed = JSON.parse(r.stdout.trim());
    const ctx = parsed.hookSpecificOutput.additionalContext;
    assert.match(ctx, /EXECUTE phase/);
    assert.match(ctx, /TDD/);
    assert.match(ctx, /S9-005/);
  });

  it('emits valid JSON for every supported phase', () => {
    for (const phase of ['PLAN', 'SPEC', 'EXECUTE', 'TEST', 'REVIEW', 'COMPLETE']) {
      writeSprint(dir, 'in-progress', phase);
      const r = run(dir);
      assert.equal(r.exitCode, 0, `phase ${phase} should exit 0`);
      assert.doesNotThrow(
        () => JSON.parse(r.stdout.trim()),
        `phase ${phase} should produce valid JSON`
      );
    }
  });
});

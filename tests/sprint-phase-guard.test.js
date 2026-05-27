import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'sprint-phase-guard.sh');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-phaseguard-'));
}
function run(cwd, subagentType) {
  const input = JSON.stringify({
    tool_name: 'Agent',
    tool_input: { subagent_type: subagentType },
  });
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input,
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}
function writeSprint(dir, status, phase) {
  fs.writeFileSync(
    path.join(dir, 'SPRINT.md'),
    `**Status:** ${status}\n**Phase:** ${phase}\n`
  );
}

describe('sprint-phase-guard.sh', () => {
  let dir;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('silent when SPRINT.md is absent', () => {
    const r = run(dir, 'item-executor');
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('allows the matching agent by bare name', () => {
    writeSprint(dir, 'in-progress', 'EXECUTE');
    const r = run(dir, 'item-executor');
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('allows the matching agent dispatched with the plugin namespace', () => {
    writeSprint(dir, 'in-progress', 'EXECUTE');
    const r = run(dir, 'aiagentminder:item-executor');
    assert.equal(r.exitCode, 0, 'namespaced agent should not be blocked');
    assert.equal(r.stdout.trim(), '');
  });

  it('blocks an out-of-phase agent dispatched with the plugin namespace', () => {
    writeSprint(dir, 'in-progress', 'EXECUTE');
    const r = run(dir, 'aiagentminder:sprint-planner');
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /Sprint phase violation/);
  });

  it('allows utility agents dispatched with the plugin namespace', () => {
    writeSprint(dir, 'in-progress', 'EXECUTE');
    const r = run(dir, 'aiagentminder:dev');
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('blocks a non-matching agent by bare name', () => {
    writeSprint(dir, 'in-progress', 'PLAN');
    const r = run(dir, 'item-executor');
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /Sprint phase violation/);
  });
});

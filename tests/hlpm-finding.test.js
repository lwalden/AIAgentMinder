import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'hlpm-finding.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-finding-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function run(args, envOverrides = {}, cwd = undefined) {
  return execFileSync('bash', [SCRIPT, ...args], {
    encoding: 'utf-8',
    cwd,
    env: { ...process.env, ...envOverrides },
  });
}

function runExpectFail(args, envOverrides = {}) {
  try {
    run(args, envOverrides);
    return null;
  } catch (err) {
    return err;
  }
}

const VALID_ARGS = ['defect', 'high', 'Bash hangs on Windows', 'WSL bash vs git-bash; sed -i stalls', 'S9'];

describe('hlpm-finding.sh: opt-in gating', () => {
  it('exits 0 silently when HLPM_DIR is unset', () => {
    const out = run(VALID_ARGS, { HLPM_DIR: '' });
    assert.equal(out, '');
  });

  it('exits 0 silently when HLPM_DIR does not exist', () => {
    const out = run(VALID_ARGS, { HLPM_DIR: '/nonexistent/hlpm/path' });
    assert.equal(out, '');
  });

  it('exits 0 silently when HLPM_PING_DISABLED=1', () => {
    const dir = makeTempDir();
    try {
      const out = run(VALID_ARGS, { HLPM_DIR: dir, HLPM_PING_DISABLED: '1' });
      assert.equal(out, '');
      assert.ok(!fs.existsSync(path.join(dir, 'tooling-findings.jsonl')));
    } finally {
      cleanTempDir(dir);
    }
  });
});

describe('hlpm-finding.sh: capture', () => {
  let dir;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  function inbox() {
    return fs.readFileSync(path.join(dir, 'tooling-findings.jsonl'), 'utf-8');
  }

  it('appends a JSONL record with all fields', () => {
    run(VALID_ARGS, { HLPM_DIR: dir });
    const lines = inbox().trim().split('\n');
    assert.equal(lines.length, 1);
    const rec = JSON.parse(lines[0]);
    assert.equal(rec.type, 'defect');
    assert.equal(rec.severity, 'high');
    assert.equal(rec.summary, 'Bash hangs on Windows');
    assert.equal(rec.detail, 'WSL bash vs git-bash; sed -i stalls');
    assert.equal(rec.sprint, 'S9');
    assert.ok(rec.ts, 'must stamp a timestamp');
    assert.ok(rec.repo, 'must record the originating repo');
    assert.ok(rec.aam_version && rec.aam_version !== 'unknown',
      'must resolve the plugin version from package.json');
  });

  it('accumulates findings without trimming', () => {
    run(VALID_ARGS, { HLPM_DIR: dir });
    run(['friction', 'low', 'Second finding'], { HLPM_DIR: dir });
    const lines = inbox().trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[1]).summary, 'Second finding');
  });

  it('detail and sprint are optional', () => {
    run(['feature', 'medium', 'Just a summary'], { HLPM_DIR: dir });
    const rec = JSON.parse(inbox().trim());
    assert.equal(rec.detail, '');
    assert.equal(rec.sprint, '');
  });

  it('summary with quotes and special characters survives as valid JSON', () => {
    run(['defect', 'low', 'It said "fail" \\ and $HOME broke', 'line1\tline2'], { HLPM_DIR: dir });
    const rec = JSON.parse(inbox().trim());
    assert.equal(rec.summary, 'It said "fail" \\ and $HOME broke');
  });
});

describe('hlpm-finding.sh: validation (loud failures once channel exists)', () => {
  let dir;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('rejects an invalid type', () => {
    const err = runExpectFail(['bogus', 'high', 'x'], { HLPM_DIR: dir });
    assert.ok(err, 'must exit non-zero');
    assert.match(err.stderr, /invalid type/);
  });

  it('rejects an invalid severity', () => {
    const err = runExpectFail(['defect', 'urgent', 'x'], { HLPM_DIR: dir });
    assert.ok(err, 'must exit non-zero');
    assert.match(err.stderr, /invalid severity/);
  });

  it('rejects a missing summary', () => {
    const err = runExpectFail(['defect', 'high', ''], { HLPM_DIR: dir });
    assert.ok(err, 'must exit non-zero');
    assert.match(err.stderr, /summary is required/);
  });

  it('writes nothing to the inbox on validation failure', () => {
    runExpectFail(['bogus', 'high', 'x'], { HLPM_DIR: dir });
    assert.ok(!fs.existsSync(path.join(dir, 'tooling-findings.jsonl')));
  });
});

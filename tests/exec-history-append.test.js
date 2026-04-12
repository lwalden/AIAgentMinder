import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'exec-history-append.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-exec-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function run(args, cwd) {
  return execFileSync('bash', [SCRIPT, ...args], {
    encoding: 'utf-8',
    cwd,
    env: { ...process.env },
  });
}

const SAMPLE_STATUS = `---
schema_version: 1
status: running
directive_id: 2026-04-11-001
started_at: 2026-04-11T17:30:00-07:00
last_updated: 2026-04-11T18:45:00-07:00
current_phase: EXECUTE
current_item: S39-003
context_remaining_pct: 67
heartbeat_ttl_minutes: 15
---

# Summary

2 of 3 items complete, working on item 3.

# Completed

- S39-001 (PR #344, merged)
- S39-002 (PR #345, merged)
`;

describe('exec-history-append.sh', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.exec'));
  });

  afterEach(() => {
    cleanTempDir(tmpDir);
  });

  it('appends status snapshot to history with auto-generated label', () => {
    fs.writeFileSync(path.join(tmpDir, '.exec', 'status.md'), SAMPLE_STATUS);
    run([], tmpDir);

    const history = fs.readFileSync(path.join(tmpDir, '.exec', 'history.md'), 'utf-8');
    assert.ok(history.includes('status: running, phase: EXECUTE'));
    assert.ok(history.includes('2 of 3 items complete'));
    assert.ok(history.includes('S39-001 (PR #344, merged)'));
  });

  it('appends status snapshot with custom label', () => {
    fs.writeFileSync(path.join(tmpDir, '.exec', 'status.md'), SAMPLE_STATUS);
    run(['directive dispatched (id 2026-04-11-001)'], tmpDir);

    const history = fs.readFileSync(path.join(tmpDir, '.exec', 'history.md'), 'utf-8');
    assert.ok(history.includes('directive dispatched (id 2026-04-11-001)'));
  });

  it('appends multiple snapshots without overwriting', () => {
    fs.writeFileSync(path.join(tmpDir, '.exec', 'status.md'), SAMPLE_STATUS);
    run([], tmpDir);

    const updated = SAMPLE_STATUS.replace('status: running', 'status: blocked');
    fs.writeFileSync(path.join(tmpDir, '.exec', 'status.md'), updated);
    run([], tmpDir);

    const history = fs.readFileSync(path.join(tmpDir, '.exec', 'history.md'), 'utf-8');
    assert.ok(history.includes('status: running'));
    assert.ok(history.includes('status: blocked'));
  });

  it('exits silently if no .exec directory', () => {
    fs.rmSync(path.join(tmpDir, '.exec'), { recursive: true });
    run([], tmpDir);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.exec', 'history.md')));
  });

  it('exits silently if no status.md', () => {
    run([], tmpDir);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.exec', 'history.md')));
  });

  it('includes timestamp in ISO 8601 format', () => {
    fs.writeFileSync(path.join(tmpDir, '.exec', 'status.md'), SAMPLE_STATUS);
    run([], tmpDir);

    const history = fs.readFileSync(path.join(tmpDir, '.exec', 'history.md'), 'utf-8');
    assert.match(history, /## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });
});

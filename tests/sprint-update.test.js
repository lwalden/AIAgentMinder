import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'sprint-update.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-sprint-'));
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

const SAMPLE_SPRINT = `# SPRINT.md - Sprint Header

> Sprint scope and status.

**Sprint:** S1 — Core features
**Status:** proposed
**Phase:** Phase 1
**Issues:** 3 proposed

| ID | Title | Type | Risk | Status | Post-Merge |
|---|---|---|---|---|---|
| S1-001 | Add user auth | feature |  | todo | n/a |
| S1-002 | Fix login bug [risk] | fix | ⚠ | todo | n/a |
| S1-003 | Update docs | chore |  | todo | pending: verify deploy |
`;

describe('sprint-update.sh: status subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), SAMPLE_SPRINT);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('updates a row status from todo to in-progress', () => {
    run(['status', 'S1-001', 'in-progress'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-001 | Add user auth | feature |  | in-progress | n/a |'));
  });

  it('updates a row status from todo to done', () => {
    run(['status', 'S1-002', 'done'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-002 | Fix login bug [risk] | fix | ⚠ | done | n/a |'));
  });

  it('updates a row status to blocked', () => {
    run(['status', 'S1-001', 'blocked'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-001 | Add user auth | feature |  | blocked | n/a |'));
  });

  it('does not affect other rows', () => {
    run(['status', 'S1-001', 'in-progress'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    // Other rows unchanged
    assert.ok(content.includes('| S1-002 | Fix login bug [risk] | fix | ⚠ | todo | n/a |'));
    assert.ok(content.includes('| S1-003 | Update docs | chore |  | todo | pending: verify deploy |'));
  });

  it('exits non-zero for unknown issue ID', () => {
    assert.throws(() => {
      run(['status', 'S1-999', 'done'], dir);
    }, /not found/i);
  });

  it('preserves non-table content', () => {
    run(['status', 'S1-001', 'done'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('**Sprint:** S1 — Core features'));
    assert.ok(content.includes('**Phase:** Phase 1'));
  });
});

describe('sprint-update.sh: postmerge subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), SAMPLE_SPRINT);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('updates post-merge from n/a to pass', () => {
    run(['postmerge', 'S1-001', 'pass'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-001 | Add user auth | feature |  | todo | pass |'));
  });

  it('updates post-merge from pending to fail', () => {
    run(['postmerge', 'S1-003', 'fail'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-003 | Update docs | chore |  | todo | fail |'));
  });

  it('updates post-merge to pending with description', () => {
    run(['postmerge', 'S1-001', 'pending: check staging'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('| S1-001 | Add user auth | feature |  | todo | pending: check staging |'));
  });

  it('does not affect status column', () => {
    run(['postmerge', 'S1-002', 'pass'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    // Status column should still be 'todo'
    assert.ok(content.includes('| S1-002 | Fix login bug [risk] | fix | ⚠ | todo | pass |'));
  });

  it('exits non-zero for unknown issue ID', () => {
    assert.throws(() => {
      run(['postmerge', 'S1-999', 'pass'], dir);
    }, /not found/i);
  });
});

describe('sprint-update.sh: sprint-status subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), SAMPLE_SPRINT);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('updates sprint-level status from proposed to in-progress', () => {
    run(['sprint-status', 'in-progress'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('**Status:** in-progress'));
    assert.ok(!content.includes('**Status:** proposed'));
  });

  it('updates sprint-level status to complete', () => {
    run(['sprint-status', 'complete'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('**Status:** complete'));
  });

  it('preserves other sprint metadata', () => {
    run(['sprint-status', 'in-progress'], dir);
    const content = fs.readFileSync(path.join(dir, 'SPRINT.md'), 'utf-8');
    assert.ok(content.includes('**Sprint:** S1 — Core features'));
    assert.ok(content.includes('**Phase:** Phase 1'));
    assert.ok(content.includes('**Issues:** 3 proposed'));
  });
});

describe('sprint-update.sh: error handling', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('exits non-zero when SPRINT.md does not exist', () => {
    assert.throws(() => {
      run(['status', 'S1-001', 'done'], dir);
    }, /not found|no such file/i);
  });

  it('exits non-zero with no arguments', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), SAMPLE_SPRINT);
    assert.throws(() => {
      run([], dir);
    }, /usage/i);
  });

  it('exits non-zero with unknown subcommand', () => {
    fs.writeFileSync(path.join(dir, 'SPRINT.md'), SAMPLE_SPRINT);
    assert.throws(() => {
      run(['bogus', 'S1-001', 'done'], dir);
    }, /usage|unknown/i);
  });
});

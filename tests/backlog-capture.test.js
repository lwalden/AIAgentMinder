import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'backlog-capture.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-backlog-'));
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

const EMPTY_BACKLOG = `# BACKLOG.md - Work Inbox

> Quick capture for future work. Items here are unscheduled and unrefined.
> Promote items to docs/strategy-roadmap.md during planning, or pull directly into sprints.

| ID | Type | Title | Source | Added |
|---|---|---|---|---|
`;

const POPULATED_BACKLOG = `# BACKLOG.md - Work Inbox

> Quick capture for future work. Items here are unscheduled and unrefined.
> Promote items to docs/strategy-roadmap.md during planning, or pull directly into sprints.

| ID | Type | Title | Source | Added |
|---|---|---|---|---|
| B-001 | defect | Error message unclear when config missing | session | 2026-03-30 |
| B-002 | feature | Auto-detect monorepo structure | spike research | 2026-03-30 |
| B-003 | spike | Evaluate hook replacement for rule X | review | 2026-03-30 |
`;

// === add subcommand ===

describe('backlog-capture.sh: add subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('creates first item as B-001 in empty BACKLOG.md', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    run(['add', 'feature', 'Auto-detect monorepo structure', 'spike research'], dir);
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(content.includes('| B-001 | feature | Auto-detect monorepo structure | spike research |'));
  });

  it('auto-increments to B-004 when B-003 exists', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    run(['add', 'chore', 'Clean up test fixtures', 'session'], dir);
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(content.includes('| B-004 | chore | Clean up test fixtures | session |'));
  });

  it('rejects invalid type', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    assert.throws(() => {
      run(['add', 'invalid-type', 'Some title', 'session'], dir);
    }, /invalid type/i);
  });

  it('sets date to today ISO date', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    run(['add', 'defect', 'Something broken', 'session'], dir);
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(content.includes(`| ${today} |`));
  });

  it('defaults source to "session" when omitted', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    run(['add', 'feature', 'Some feature'], dir);
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(content.includes('| session |'));
  });

  it('exits non-zero when BACKLOG.md does not exist', () => {
    assert.throws(() => {
      run(['add', 'feature', 'Something'], dir);
    }, /not found/i);
  });

  it('requires at least type and title', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    assert.throws(() => {
      run(['add', 'feature'], dir);
    }, /usage/i);
  });
});

// === list subcommand ===

describe('backlog-capture.sh: list subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('outputs all items from a populated BACKLOG.md', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    const output = run(['list'], dir);
    assert.ok(output.includes('B-001'));
    assert.ok(output.includes('B-002'));
    assert.ok(output.includes('B-003'));
  });

  it('filters by type with --type flag', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    const output = run(['list', '--type=defect'], dir);
    assert.ok(output.includes('B-001'));
    assert.ok(!output.includes('B-002'));
    assert.ok(!output.includes('B-003'));
  });

  it('outputs nothing on empty backlog (exit 0)', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    const output = run(['list'], dir);
    assert.equal(output.trim(), '');
  });
});

// === promote subcommand ===

describe('backlog-capture.sh: promote subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('removes row and prints it to stdout', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    const output = run(['promote', 'B-002'], dir);
    assert.ok(output.includes('B-002'));
    assert.ok(output.includes('feature'));
    assert.ok(output.includes('Auto-detect monorepo structure'));
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(!content.includes('B-002'));
    // Other rows preserved
    assert.ok(content.includes('B-001'));
    assert.ok(content.includes('B-003'));
  });

  it('exits non-zero for unknown ID', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    assert.throws(() => {
      run(['promote', 'B-999'], dir);
    }, /not found/i);
  });

  it('works when promoting the only item', () => {
    const singleItem = EMPTY_BACKLOG + '| B-001 | defect | Only item | session | 2026-03-30 |\n';
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), singleItem);
    const output = run(['promote', 'B-001'], dir);
    assert.ok(output.includes('B-001'));
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(!content.includes('B-001'));
    // Table header still present
    assert.ok(content.includes('| ID | Type | Title | Source | Added |'));
  });
});

// === detail subcommand ===

describe('backlog-capture.sh: detail subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('appends a detail section below the table', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    run(['detail', 'B-002', 'Spike research showed 3 repos with workspaces.'], dir);
    const content = fs.readFileSync(path.join(dir, 'BACKLOG.md'), 'utf-8');
    assert.ok(content.includes('### B-002: Auto-detect monorepo structure'));
    assert.ok(content.includes('Spike research showed 3 repos with workspaces.'));
  });

  it('exits non-zero for unknown ID', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    assert.throws(() => {
      run(['detail', 'B-999', 'Some detail'], dir);
    }, /not found/i);
  });
});

// === count subcommand ===

describe('backlog-capture.sh: count subcommand', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('returns correct total count', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    const output = run(['count'], dir);
    assert.equal(output.trim(), '3');
  });

  it('returns filtered count with --type flag', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), POPULATED_BACKLOG);
    const output = run(['count', '--type=feature'], dir);
    assert.equal(output.trim(), '1');
  });

  it('returns 0 for empty backlog', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    const output = run(['count'], dir);
    assert.equal(output.trim(), '0');
  });
});

// === error handling ===

describe('backlog-capture.sh: error handling', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => { cleanTempDir(dir); });

  it('exits non-zero with no arguments', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    assert.throws(() => {
      run([], dir);
    }, /usage/i);
  });

  it('exits non-zero with unknown subcommand', () => {
    fs.writeFileSync(path.join(dir, 'BACKLOG.md'), EMPTY_BACKLOG);
    assert.throws(() => {
      run(['bogus'], dir);
    }, /usage|unknown/i);
  });
});

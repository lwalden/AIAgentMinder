import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'decisions-log.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-dec-'));
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

const SAMPLE_DECISIONS = `# DECISIONS.md - Architectural Decision Log

> Record significant decisions to prevent re-debating them later.

---

### Example decision | 2026-01 | Status: Active

Chose: X over Y. Why: reason. Tradeoff: cost.

---

## Known Debt

> Record shortcuts, workarounds, and deferred quality work here.

| ID | Description | Impact | Logged | Sprint |
|---|---|---|---|---|
<!-- Debt entries go here -->
`;

describe('decisions-log.sh: appends decision entry', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'DECISIONS.md'), SAMPLE_DECISIONS);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('appends a new decision before Known Debt section', () => {
    run(['Use Redis over Memcached', 'Redis over Memcached', 'Better data structures', 'Higher memory usage'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('### Use Redis over Memcached'));
    assert.ok(content.includes('Chose: Redis over Memcached'));
    assert.ok(content.includes('Why: Better data structures'));
    assert.ok(content.includes('Tradeoff: Higher memory usage'));
  });

  it('includes current date in YYYY-MM format', () => {
    run(['Test decision', 'A over B', 'reason', 'none'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    assert.ok(content.includes(yearMonth));
  });

  it('marks new entries as Active', () => {
    run(['Test decision', 'A over B', 'reason', 'none'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('Status: Active'));
  });

  it('preserves existing decisions', () => {
    run(['New decision', 'A over B', 'reason', 'none'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('### Example decision'));
  });

  it('preserves Known Debt section', () => {
    run(['New decision', 'A over B', 'reason', 'none'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('## Known Debt'));
    assert.ok(content.includes('<!-- Debt entries go here -->'));
  });

  it('inserts decision above Known Debt, not below', () => {
    run(['New decision', 'A over B', 'reason', 'none'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    const newDecIdx = content.indexOf('### New decision');
    const knownDebtIdx = content.indexOf('## Known Debt');
    assert.ok(newDecIdx < knownDebtIdx, 'New decision should appear before Known Debt');
  });

  it('is silent on success (no stdout)', () => {
    const output = run(['Test decision', 'A over B', 'reason', 'none'], dir);
    assert.equal(output.trim(), '');
  });
});

describe('decisions-log.sh: validation', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'DECISIONS.md'), SAMPLE_DECISIONS);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('exits non-zero when DECISIONS.md does not exist', () => {
    fs.unlinkSync(path.join(dir, 'DECISIONS.md'));
    assert.throws(() => {
      run(['Test', 'A', 'B', 'C'], dir);
    }, /not found/i);
  });

  it('exits non-zero with fewer than 4 arguments', () => {
    assert.throws(() => {
      run(['only', 'three', 'args'], dir);
    }, /usage/i);
  });

  it('exits non-zero with no arguments', () => {
    assert.throws(() => {
      run([], dir);
    }, /usage/i);
  });
});

describe('decisions-log.sh: edge cases', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'DECISIONS.md'), SAMPLE_DECISIONS);
  });

  afterEach(() => { cleanTempDir(dir); });

  it('handles special characters in values', () => {
    run(['Use "quotes" & pipes', 'A | B over C & D', "It's better", 'None (really)'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('Use "quotes" & pipes'));
  });

  it('handles backslashes without awk escape interpretation', () => {
    run(['Use C:\\new\\path style', 'Windows paths over Unix', 'target platform', 'portability'], dir);
    const content = fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf-8');
    assert.ok(content.includes('C:\\new\\path'), 'Backslashes should be preserved literally');
  });
});

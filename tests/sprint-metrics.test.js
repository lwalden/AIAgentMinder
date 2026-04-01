import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'sprint-metrics.sh');

function run(args, cwd) {
  return execSync(`bash "${SCRIPT}" ${args}`, {
    cwd,
    encoding: 'utf-8',
    timeout: 5000,
  }).trim();
}

function readMetrics(cwd) {
  return JSON.parse(fs.readFileSync(path.join(cwd, '.sprint-metrics.json'), 'utf-8'));
}

describe('sprint-metrics.sh', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aam-metrics-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('init creates valid .sprint-metrics.json', () => {
    run('init S8', tmpDir);
    const metrics = readMetrics(tmpDir);
    assert.equal(metrics.sprintId, 'S8');
    assert.ok(metrics.startedAt, 'must have startedAt timestamp');
    assert.ok(Array.isArray(metrics.items), 'must have items array');
    assert.equal(metrics.items.length, 0);
    assert.ok(metrics.totals, 'must have totals object');
  });

  it('item-start records timestamp', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    const metrics = readMetrics(tmpDir);
    const item = metrics.items.find(i => i.id === 'S8-001');
    assert.ok(item, 'item must exist');
    assert.ok(item.startedAt, 'item must have startedAt');
  });

  it('item-complete records timestamp', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('item-complete S8-001', tmpDir);
    const metrics = readMetrics(tmpDir);
    const item = metrics.items.find(i => i.id === 'S8-001');
    assert.ok(item.completedAt, 'item must have completedAt');
  });

  it('cycle increments context cycle count', () => {
    run('init S8', tmpDir);
    run('item-start S8-003', tmpDir);
    run('cycle S8-003', tmpDir);
    run('cycle S8-003', tmpDir);
    const metrics = readMetrics(tmpDir);
    const item = metrics.items.find(i => i.id === 'S8-003');
    assert.equal(item.contextCycles, 2);
  });

  it('finalize writes totals', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('item-complete S8-001', tmpDir);
    run('item-start S8-002', tmpDir);
    run('item-complete S8-002', tmpDir);
    run('finalize', tmpDir);
    const metrics = readMetrics(tmpDir);
    assert.ok(metrics.completedAt, 'must have completedAt');
    assert.equal(metrics.totals.completed, 2);
  });

  it('.sprint-metrics.json matches defined schema', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('item-complete S8-001', tmpDir);
    run('finalize', tmpDir);
    const metrics = readMetrics(tmpDir);

    // Top-level fields
    assert.equal(typeof metrics.sprintId, 'string');
    assert.equal(typeof metrics.startedAt, 'string');
    assert.equal(typeof metrics.completedAt, 'string');
    assert.ok(Array.isArray(metrics.items));

    // Item fields
    const item = metrics.items[0];
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.startedAt, 'string');
    assert.equal(typeof item.completedAt, 'string');
    assert.equal(typeof item.contextCycles, 'number');
    assert.equal(typeof item.reworkCount, 'number');

    // Totals fields
    assert.equal(typeof metrics.totals.planned, 'number');
    assert.equal(typeof metrics.totals.completed, 'number');
    assert.equal(typeof metrics.totals.rework, 'number');
    assert.equal(typeof metrics.totals.blocked, 'number');
    assert.equal(typeof metrics.totals.contextCycles, 'number');
  });

  it('rework increments rework count', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('rework S8-001', tmpDir);
    const metrics = readMetrics(tmpDir);
    const item = metrics.items.find(i => i.id === 'S8-001');
    assert.equal(item.reworkCount, 1);
  });

  it('item-complete on nonexistent item does not corrupt totals', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('item-complete NONEXISTENT', tmpDir);
    const metrics = readMetrics(tmpDir);
    assert.equal(metrics.totals.completed, 0, 'completed count must not increment for nonexistent item');
    assert.equal(metrics.totals.planned, 1, 'planned count must be unchanged');
  });

  it('cycle on nonexistent item does not corrupt totals', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('cycle NONEXISTENT', tmpDir);
    const metrics = readMetrics(tmpDir);
    assert.equal(metrics.totals.contextCycles, 0, 'cycle count must not increment for nonexistent item');
  });

  it('rework on nonexistent item does not corrupt totals', () => {
    run('init S8', tmpDir);
    run('item-start S8-001', tmpDir);
    run('rework NONEXISTENT', tmpDir);
    const metrics = readMetrics(tmpDir);
    assert.equal(metrics.totals.rework, 0, 'rework count must not increment for nonexistent item');
  });

  it('errors on missing metrics file for non-init commands', () => {
    assert.throws(
      () => run('item-start S8-001', tmpDir),
      /not found|No such file/i,
      'should error when metrics file does not exist'
    );
  });
});

describe('aam-retrospective reads metrics', () => {
  const RETRO_PATH = path.resolve(__dirname, '..', 'project', '.claude', 'skills', 'aam-retrospective.md');

  it('references .sprint-metrics.json when present', () => {
    const content = fs.readFileSync(RETRO_PATH, 'utf-8');
    assert.ok(
      content.includes('.sprint-metrics.json') || content.includes('sprint-metrics'),
      'retrospective must reference metrics file'
    );
  });

  it('defines fallback when metrics file absent', () => {
    const content = fs.readFileSync(RETRO_PATH, 'utf-8');
    assert.ok(
      content.includes('fall back') || content.includes('fallback') ||
      content.includes('git log') || content.includes('absent'),
      'must define fallback behavior'
    );
  });
});

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-ctxmon-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const SCRIPT_PATH = path.resolve(import.meta.dirname, '..', 'project', '.claude', 'scripts', 'context-monitor.sh');

function runMonitor(inputJson, cwd) {
  const tmpInput = path.join(cwd, '.ctx-test-input.json');
  fs.writeFileSync(tmpInput, JSON.stringify(inputJson), 'utf-8');
  try {
    execSync(`bash -c 'cat "${tmpInput.replace(/\\/g, '/')}" | bash "${SCRIPT_PATH.replace(/\\/g, '/')}"'`, {
      encoding: 'utf-8',
      cwd,
    });
  } finally {
    fs.unlinkSync(tmpInput);
  }
  const usageFile = path.join(cwd, '.context-usage');
  if (!fs.existsSync(usageFile)) return null;
  return JSON.parse(fs.readFileSync(usageFile, 'utf-8'));
}

function makeInput(overrides = {}) {
  return {
    model: { id: overrides.modelId || 'claude-sonnet-4-6', display_name: 'Sonnet 4.6' },
    context_window: {
      total_input_tokens: overrides.totalInput || 100000,
      total_output_tokens: overrides.totalOutput || 50000,
      context_window_size: overrides.windowSize || 1048576,
      used_percentage: overrides.usedPct || 10,
    },
    cwd: overrides.cwd || '.',
  };
}

// Pre-seed an existing .context-usage with a specific session_floor — simulates
// a session that has been running long enough for the status line to have
// already established its floor on a prior tick.
function seedUsage(cwd, sessionFloor) {
  const seed = {
    should_cycle: false,
    model: 'claude-sonnet-4-6',
    used_tokens: sessionFloor,
    threshold: 500000,
    used_pct: 0,
    window_size: 1048576,
    total_input: 0,
    total_output: 0,
    exceeds_200k: false,
    session_floor: sessionFloor,
  };
  fs.writeFileSync(path.join(cwd, '.context-usage'), JSON.stringify(seed), 'utf-8');
}

describe('context-monitor.sh: warmup hysteresis (S9-003, F2)', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { cleanTempDir(tmpDir); });

  it('first invocation in a fresh session establishes session_floor and never cycles', () => {
    // Simulates a resumed session at 800k tokens — far above the 500k Sonnet
    // threshold. Without hysteresis this would immediately cycle (F2 bug).
    // With hysteresis, first run records floor=800k, delta=0, should_cycle=false.
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 76, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, false,
      'first invocation must not cycle even when conversation tokens already exceed threshold');
    assert.ok('session_floor' in result, 'session_floor field must be present');
    assert.equal(result.session_floor, result.used_tokens,
      'first-run session_floor equals current used_tokens (zero delta)');
  });

  it('second invocation at same token count still does not cycle (delta still 0)', () => {
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 76, windowSize: 1048576, cwd: tmpDir });
    runMonitor(input, tmpDir);
    const result = runMonitor(input, tmpDir);
    assert.equal(result.should_cycle, false, 'no growth = no cycle');
  });

  it('cycles only when delta from session_floor crosses threshold', () => {
    // Establish floor at 200k tokens.
    seedUsage(tmpDir, 200000);
    // Now status line reports 700k tokens (delta = 500k). Sonnet threshold = 500k.
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 67, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.should_cycle, true,
      'delta 500k crosses Sonnet 500k threshold → should cycle');
  });

  it('does not cycle when delta is below threshold even at high absolute tokens', () => {
    // Floor at 600k. Current 800k. Delta = 200k. Below 500k Sonnet threshold.
    seedUsage(tmpDir, 600000);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 76, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.should_cycle, false,
      'absolute tokens high but delta only 200k → no cycle');
  });

  it('preserves session_floor across invocations', () => {
    seedUsage(tmpDir, 150000);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 30, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.session_floor, 150000, 'session_floor must not change after initial set');
  });

  it('backward compatibility: legacy .context-usage without session_floor is treated as floor=0', () => {
    // Legacy file (pre-S9-003) lacks session_floor.
    const legacy = {
      should_cycle: false,
      model: 'claude-sonnet-4-6',
      used_tokens: 0,
      threshold: 500000,
      used_pct: 0,
      window_size: 1048576,
      total_input: 0,
      total_output: 0,
      exceeds_200k: false,
    };
    fs.writeFileSync(path.join(tmpDir, '.context-usage'), JSON.stringify(legacy), 'utf-8');
    // Status line runs at 600k tokens — delta from floor=0 is 600k > 500k.
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 57, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.should_cycle, true,
      'legacy file (no session_floor) treated as floor=0 → cycles per old behavior');
  });

  it('after SessionStart cycle reset removes the file, next monitor run re-establishes floor', () => {
    // S9-002 deletes .context-usage on session start. Simulate that.
    const usagePath = path.join(tmpDir, '.context-usage');
    fs.writeFileSync(usagePath, JSON.stringify({ session_floor: 100000, used_tokens: 100000 }));
    fs.unlinkSync(usagePath);

    // Now first monitor run at 700k tokens.
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 67, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.should_cycle, false, 'fresh start after reset → no cycle');
    assert.equal(result.session_floor, result.used_tokens, 'floor re-established at current value');
  });
});

describe('context-monitor.sh: 1M context thresholds', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { cleanTempDir(tmpDir); });

  it('should_cycle is false for Sonnet below 500k delta from floor', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 40, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, false, 'should not cycle at 40% of 1M (419k delta < 500k)');
  });

  it('should_cycle is true for Sonnet at 500k+ delta from floor', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 50, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 50% of 1M (524k delta >= 500k)');
  });

  it('should_cycle is false for Opus below 580k delta from floor', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-opus-4-6', usedPct: 50, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, false, 'should not cycle at 50% of 1M for Opus (524k delta < 580k)');
  });

  it('should_cycle is true for Opus at 580k+ delta from floor', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-opus-4-6', usedPct: 60, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 60% of 1M for Opus (629k delta >= 580k)');
  });

  it('35% fallback still works for unknown models (delta-based)', () => {
    seedUsage(tmpDir, 0);
    // 36% of 200k = 72k delta. Fallback compares used_pct directly (not delta).
    // For unknown models we use absolute used_pct; warmup hysteresis only
    // applies to threshold-based check, so the 35% fallback retains old behavior.
    const input = makeInput({ modelId: 'some-future-model', usedPct: 36, windowSize: 200000, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 36% for unknown model');
  });

  it('output includes exceeds_200k field', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 25, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.ok('exceeds_200k' in result, 'should include exceeds_200k field');
  });

  it('exceeds_200k is true when used tokens exceed 200k', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 25, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.exceeds_200k, true, '262k tokens should exceed 200k');
  });

  it('exceeds_200k is false when used tokens are below 200k', () => {
    seedUsage(tmpDir, 0);
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 10, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.exceeds_200k, false, '104k tokens should not exceed 200k');
  });
});

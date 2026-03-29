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
  // Write JSON to a temp file and pipe it — avoids shell quoting issues on Windows
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

describe('context-monitor.sh: 1M context thresholds', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(tmpDir);
  });

  it('should_cycle is false for Sonnet below 500k tokens', () => {
    // 40% of 1M = ~419k tokens — below 500k threshold
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 40, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, false, 'should not cycle at 40% of 1M (419k < 500k)');
  });

  it('should_cycle is true for Sonnet at 500k+ tokens', () => {
    // 50% of 1M = ~524k tokens — above 500k threshold
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 50, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 50% of 1M (524k >= 500k)');
  });

  it('should_cycle is false for Opus below 580k tokens', () => {
    // 50% of 1M = ~524k tokens — below 580k threshold
    const input = makeInput({ modelId: 'claude-opus-4-6', usedPct: 50, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, false, 'should not cycle at 50% of 1M for Opus (524k < 580k)');
  });

  it('should_cycle is true for Opus at 580k+ tokens', () => {
    // 60% of 1M = ~629k tokens — above 580k threshold
    const input = makeInput({ modelId: 'claude-opus-4-6', usedPct: 60, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 60% of 1M for Opus (629k >= 580k)');
  });

  it('35% fallback still works for unknown models', () => {
    // 36% of 200k = 72k — above 35% fallback
    const input = makeInput({ modelId: 'some-future-model', usedPct: 36, windowSize: 200000, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.equal(result.should_cycle, true, 'should cycle at 36% for unknown model');
  });

  it('output includes exceeds_200k field', () => {
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 25, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.ok(result, '.context-usage should be written');
    assert.ok('exceeds_200k' in result, 'should include exceeds_200k field');
  });

  it('exceeds_200k is true when used tokens exceed 200k', () => {
    // 25% of 1M = ~262k > 200k
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 25, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.exceeds_200k, true, '262k tokens should exceed 200k');
  });

  it('exceeds_200k is false when used tokens are below 200k', () => {
    // 10% of 1M = ~104k < 200k
    const input = makeInput({ modelId: 'claude-sonnet-4-6', usedPct: 10, windowSize: 1048576, cwd: tmpDir });
    const result = runMonitor(input, tmpDir);
    assert.equal(result.exceeds_200k, false, '104k tokens should not exceed 200k');
  });
});

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'sprint-stop-guard.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-stop-guard-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Run the Stop hook script.
 * Exit 0 = block the stop (hook wants to prevent ending).
 * Exit 2 = allow the stop (hook permits ending).
 * The hook outputs JSON to stdout when blocking.
 */
function runHook(hookInput, cwd) {
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: JSON.stringify(hookInput),
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}

/** Minimal Stop hook input. */
function stopInput(lastMessage = '') {
  return {
    hook_event_name: 'Stop',
    stop_hook_active: true,
    last_assistant_message: lastMessage,
  };
}

/** Write a SPRINT.md with given status and rows. */
function writeSprint(dir, sprintStatus, rows) {
  const header = `# SPRINT.md

**Sprint:** S1 — Test Sprint
**Status:** ${sprintStatus}
**Phase:** Phase 1
**Issues:** ${rows.length} proposed

| ID | Title | Type | Risk | Status | Post-Merge |
|---|---|---|---|---|---|
`;
  const rowLines = rows.map(
    (r) => `| ${r.id} | ${r.title} | ${r.type} | ${r.risk || ''} | ${r.status} | ${r.postMerge || 'n/a'} |`,
  );
  fs.writeFileSync(path.join(dir, 'SPRINT.md'), header + rowLines.join('\n') + '\n');
}

describe('sprint-stop-guard', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(tmpDir);
  });

  it('blocks stop when sprint is in-progress with todo items', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done item', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Next item', type: 'feature', status: 'todo' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 0, 'should block stop (exit 0)');

    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, 'block');
    assert.ok(output.reason.includes('S1-002'), 'reason should reference next todo item');
  });

  it('allows stop when all items are done (COMPLETE phase)', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done item', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Also done', type: 'feature', status: 'done' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop (exit 2)');
  });

  it('allows stop when an item is blocked', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done item', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Blocked item', type: 'feature', status: 'blocked' },
      { id: 'S1-003', title: 'Next item', type: 'feature', status: 'todo' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop when item is blocked');
  });

  it('allows stop when no SPRINT.md exists', () => {
    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop with no sprint file');
  });

  it('allows stop when sprint status is proposed (PLAN/SPEC phase)', () => {
    writeSprint(tmpDir, 'proposed', [
      { id: 'S1-001', title: 'Planned item', type: 'feature', status: 'todo' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop during planning');
  });

  it('allows stop when .sprint-human-checkpoint exists', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done item', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Rework item', type: 'fix', status: 'todo' },
    ]);
    fs.writeFileSync(path.join(tmpDir, '.sprint-human-checkpoint'), '');

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop at human checkpoint');
  });

  it('allows stop when context cycling is needed', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done item', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Next item', type: 'feature', status: 'todo' },
    ]);
    fs.writeFileSync(
      path.join(tmpDir, '.context-usage'),
      JSON.stringify({ should_cycle: true, used_tokens: 300000, threshold: 250000 }),
    );

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop for context cycling');
  });

  it('blocks stop and includes next item ID in reason', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Done too', type: 'chore', status: 'done' },
      { id: 'S1-003', title: 'The next one', type: 'feature', status: 'todo' },
      { id: 'S1-004', title: 'After that', type: 'feature', status: 'todo' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 0, 'should block');

    const output = JSON.parse(result.stdout);
    assert.ok(output.reason.includes('S1-003'), 'reason should reference the FIRST todo item');
  });

  it('allows stop when sprint status is completed', () => {
    writeSprint(tmpDir, 'completed', [
      { id: 'S1-001', title: 'Done', type: 'feature', status: 'done' },
    ]);

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop when sprint is completed');
  });

  it('does not block when context-usage file has should_cycle false', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Next', type: 'feature', status: 'todo' },
    ]);
    fs.writeFileSync(
      path.join(tmpDir, '.context-usage'),
      JSON.stringify({ should_cycle: false }),
    );

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 0, 'should still block — cycling not needed');
  });

  it('allows stop when .sprint-continue-signal exists (cycling in progress)', () => {
    writeSprint(tmpDir, 'in-progress', [
      { id: 'S1-001', title: 'Done', type: 'feature', status: 'done' },
      { id: 'S1-002', title: 'Next', type: 'feature', status: 'todo' },
    ]);
    fs.writeFileSync(path.join(tmpDir, '.sprint-continue-signal'), '');

    const result = runHook(stopInput(), tmpDir);
    assert.equal(result.exitCode, 2, 'should allow stop when cycling is in progress');
  });
});

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(
  __dirname,
  '..',
  'bin',
  'context-cycle-hook.sh'
);

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-cycle-hook-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runHook(toolName, cwd) {
  const input = { tool_name: toolName, tool_input: {} };
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input: JSON.stringify(input),
      env: { ...process.env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status };
  }
}

function writeUsage(cwd, shouldCycle) {
  fs.writeFileSync(
    path.join(cwd, '.context-usage'),
    JSON.stringify({
      should_cycle: shouldCycle,
      model: 'claude-opus',
      used_tokens: 700000,
      threshold: 580000,
      used_pct: 70,
      window_size: 1000000,
      total_input: 700000,
      total_output: 0,
      exceeds_200k: true,
      session_floor: 0,
    })
  );
}

function writeSprint(cwd, status) {
  const content =
    `# SPRINT.md\n\n` +
    `**Sprint:** S9 — Test\n` +
    `**Status:** ${status}\n` +
    `**Phase:** test\n\n` +
    `| ID | Title | Type | Risk | Status | Post-Merge |\n` +
    `|---|---|---|---|---|---|\n` +
    `| S9-001 | test | feature |  | todo | n/a |\n`;
  fs.writeFileSync(path.join(cwd, 'SPRINT.md'), content);
}

describe('context-cycle-hook.sh — F5: Edit allowed during sprint cycle', () => {
  let dir;
  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    cleanTempDir(dir);
  });

  it('allows Edit when sprint is in-progress and should_cycle=true', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'in-progress');
    const result = runHook('Edit', dir);
    assert.equal(result.exitCode, 0, 'Edit should be allowed during cycle');
    assert.match(
      result.stdout,
      /CONTEXT CYCLE OVERDUE/,
      'should emit warning even though allowed'
    );
  });

  it('continues to allow Bash, Write, Read when sprint is in-progress and should_cycle=true', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'in-progress');
    for (const tool of ['Bash', 'Write', 'Read']) {
      const result = runHook(tool, dir);
      assert.equal(result.exitCode, 0, `${tool} should be allowed during cycle`);
    }
  });

  it('still blocks non-allowed tools when sprint is in-progress and should_cycle=true', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'in-progress');
    const result = runHook('WebFetch', dir);
    assert.equal(result.exitCode, 2, 'WebFetch should be blocked during cycle');
    assert.match(
      result.stdout,
      /BLOCKED — CONTEXT CYCLE REQUIRED/,
      'should emit block message'
    );
  });
});

describe('context-cycle-hook.sh — F4: sprint-state gating on normal path', () => {
  let dir;
  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    cleanTempDir(dir);
  });

  it('does NOT block when SPRINT.md status is "proposed" even if should_cycle=true', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'proposed');
    const result = runHook('WebFetch', dir);
    assert.equal(
      result.exitCode,
      0,
      'non-sprint session should not be blocked even with should_cycle=true'
    );
  });

  it('emits a soft warning (not block message) when sprint not in-progress', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'proposed');
    const result = runHook('WebFetch', dir);
    assert.equal(result.exitCode, 0);
    assert.doesNotMatch(
      result.stdout,
      /BLOCKED — CONTEXT CYCLE REQUIRED/,
      'should not emit hard-block message'
    );
  });

  it('does NOT block when no SPRINT.md exists (non-aiagentminder consumer)', () => {
    writeUsage(dir, true);
    const result = runHook('Edit', dir);
    assert.equal(
      result.exitCode,
      0,
      'project without SPRINT.md should not be blocked'
    );
  });

  it('emits no output when should_cycle=false regardless of sprint state', () => {
    writeUsage(dir, false);
    writeSprint(dir, 'in-progress');
    const result = runHook('Edit', dir);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'silent when no cycle pressure');
  });

  it('blocks normally when sprint IS in-progress and should_cycle=true', () => {
    writeUsage(dir, true);
    writeSprint(dir, 'in-progress');
    const result = runHook('Glob', dir);
    assert.equal(result.exitCode, 2, 'sprint-active session retains hard block');
  });

  it('handles SPRINT.md with archive-only content (no active sprint section)', () => {
    fs.writeFileSync(
      path.join(dir, 'SPRINT.md'),
      `# SPRINT.md\n\n## Archive\n\nS1 archived (...): 5/5 done.\n<!-- sizing: 5-7 -->\n`
    );
    writeUsage(dir, true);
    const result = runHook('Edit', dir);
    assert.equal(
      result.exitCode,
      0,
      'archive-only SPRINT.md (no Status: in-progress) should not block'
    );
  });
});

describe('context-cycle-hook.sh — fallback path (no .context-usage)', () => {
  let dir;
  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    cleanTempDir(dir);
  });

  it('exits 0 silently when no .context-usage and no SPRINT.md', () => {
    const result = runHook('Edit', dir);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'silent in clean state');
  });

  it('exits 0 silently when no .context-usage and sprint not in-progress', () => {
    writeSprint(dir, 'proposed');
    const result = runHook('Edit', dir);
    assert.equal(result.exitCode, 0);
  });

  it('does not block tools below fallback counter threshold (sprint in-progress)', () => {
    writeSprint(dir, 'in-progress');
    fs.writeFileSync(path.join(dir, '.sprint-tool-count'), '50');
    const result = runHook('Edit', dir);
    assert.equal(result.exitCode, 0, 'below 150-call threshold should not block');
  });
});

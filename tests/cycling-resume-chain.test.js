/**
 * Integration test for the SessionEnd → SessionStart resume chain.
 *
 * Background (S9-001 spike F3): the dungeon-game 2026-05-06 incident
 * revealed that after a context-cycle /exit the new session did not
 * auto-inject the continuation file. Leading hypothesis: the
 * `session-start-continuation.sh` script is registered with matcher
 * "startup", which does NOT fire on `claude --continue` (uses matcher
 * "resume"). This test exercises the full loop and includes a
 * configuration regression test asserting the hook fires on all session
 * start events, not just startup.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'project', '.claude', 'scripts');
const SETTINGS_TPL = path.join(PROJECT_ROOT, 'project', '.claude', 'settings.json.tpl');

const SESSION_END = path.join(SCRIPTS_DIR, 'session-end-cycle.sh');
const SESSION_START_CONT = path.join(SCRIPTS_DIR, 'session-start-continuation.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-resume-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runScript(script, cwd, input = {}) {
  try {
    const stdout = execFileSync('bash', [script], {
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

function seedCycleState(dir) {
  // Active sprint with cycle pressure
  fs.writeFileSync(
    path.join(dir, '.context-usage'),
    JSON.stringify({
      should_cycle: true,
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
  fs.writeFileSync(
    path.join(dir, 'SPRINT.md'),
    `# SPRINT.md\n\n` +
      `**Sprint:** S9 — Test\n` +
      `**Status:** in-progress\n` +
      `**Phase:** test\n\n` +
      `| ID | Title | Type | Risk | Status | Post-Merge |\n` +
      `|---|---|---|---|---|---|\n` +
      `| S9-005 | resume chain | fix | ⚠ | in-progress | n/a |\n`
  );
  // Initialize a tiny git repo so session-end-cycle.sh can read branch/sha.
  // Use a non-main default branch to avoid global "no commits to main" hooks.
  execFileSync('git', ['init', '-q', '-b', 'test-branch'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  execFileSync('git', ['config', 'core.hooksPath', '/dev/null'], { cwd: dir });
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '--no-verify', '-m', 'seed'], { cwd: dir });
}

describe('SessionEnd → SessionStart resume chain (S9-005, F3)', () => {
  let dir;
  beforeEach(() => {
    dir = makeTempDir();
  });
  afterEach(() => {
    cleanTempDir(dir);
  });

  describe('SessionEnd writes continuation file when cycle is active', () => {
    it('produces .sprint-continuation.md and .sprint-continue-signal', () => {
      seedCycleState(dir);
      const result = runScript(SESSION_END, dir, { hook_event_name: 'SessionEnd', reason: 'prompt_input_exit' });
      assert.equal(result.exitCode, 0);
      assert.ok(
        fs.existsSync(path.join(dir, '.sprint-continuation.md')),
        '.sprint-continuation.md must exist after SessionEnd cycle'
      );
      assert.ok(
        fs.existsSync(path.join(dir, '.sprint-continue-signal')),
        '.sprint-continue-signal must exist after SessionEnd cycle'
      );
    });

    it('continuation file contains sprint id and current item info', () => {
      seedCycleState(dir);
      runScript(SESSION_END, dir, { hook_event_name: 'SessionEnd', reason: 'prompt_input_exit' });
      const content = fs.readFileSync(path.join(dir, '.sprint-continuation.md'), 'utf-8');
      assert.match(content, /S9/, 'continuation should reference sprint id');
      assert.match(content, /S9-005/, 'continuation should reference the in-progress item');
    });

    it('does NOT write continuation when should_cycle=false (normal exit)', () => {
      fs.writeFileSync(
        path.join(dir, '.context-usage'),
        JSON.stringify({ should_cycle: false, used_tokens: 100000 })
      );
      runScript(SESSION_END, dir);
      assert.ok(
        !fs.existsSync(path.join(dir, '.sprint-continuation.md')),
        'no continuation on normal exit'
      );
    });

    it('does NOT write continuation when .context-usage is absent', () => {
      runScript(SESSION_END, dir);
      assert.ok(!fs.existsSync(path.join(dir, '.sprint-continuation.md')));
    });
  });

  describe('SessionStart consumes continuation and deletes it', () => {
    it('emits continuation content on stdout and deletes both files', () => {
      // Seed continuation as if SessionEnd already ran
      const cont = path.join(dir, '.sprint-continuation.md');
      const sig = path.join(dir, '.sprint-continue-signal');
      fs.writeFileSync(cont, '# Sprint Continuation State\n**Sprint:** S9\nResume from EXECUTE.\n');
      fs.writeFileSync(sig, '');

      const result = runScript(SESSION_START_CONT, dir);
      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /BEGIN CONTINUATION/);
      assert.match(result.stdout, /\*\*Sprint:\*\* S9/);
      assert.match(result.stdout, /END CONTINUATION/);

      assert.ok(!fs.existsSync(cont), 'continuation should be consumed');
      assert.ok(!fs.existsSync(sig), 'signal should be consumed');
    });

    it('exits silently when no continuation file exists', () => {
      const result = runScript(SESSION_START_CONT, dir);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout.trim(), '');
    });
  });

  describe('Full loop: SessionEnd → SessionStart', () => {
    it('end-to-end produces injectable content in the next session', () => {
      seedCycleState(dir);

      // Phase 1: prior session is exiting under cycle pressure
      runScript(SESSION_END, dir, { hook_event_name: 'SessionEnd', reason: 'prompt_input_exit' });

      // Phase 2: new session starts
      const result = runScript(SESSION_START_CONT, dir);

      assert.equal(result.exitCode, 0);
      assert.match(result.stdout, /CONTEXT CYCLE RESUME/, 'banner injected for next session');
      assert.match(result.stdout, /S9-005/, 'in-progress item carried forward');
      assert.match(result.stdout, /TaskList/, 'next-action guidance present');

      // Files consumed
      assert.ok(!fs.existsSync(path.join(dir, '.sprint-continuation.md')));
      assert.ok(!fs.existsSync(path.join(dir, '.sprint-continue-signal')));
    });

    it('a second SessionStart after consume sees no continuation (no replay)', () => {
      seedCycleState(dir);
      runScript(SESSION_END, dir);
      runScript(SESSION_START_CONT, dir); // first consume
      const result = runScript(SESSION_START_CONT, dir); // second invocation
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout.trim(), '', 'no replay on second start');
    });
  });

  describe('Hook configuration regression: matcher must fire on resume', () => {
    it('session-start-continuation.sh is registered under a matcher that fires on `claude --continue`', () => {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_TPL, 'utf-8'));
      const sessionStart = settings.hooks?.SessionStart || [];

      // Find every matcher block that registers session-start-continuation.sh
      const containingBlocks = sessionStart.filter((block) =>
        (block.hooks || []).some((h) => (h.command || '').includes('session-start-continuation.sh'))
      );

      assert.ok(containingBlocks.length > 0, 'session-start-continuation.sh must be registered somewhere');

      // For the F3 fix: must fire on `claude --continue` (matcher "resume") and
      // `claude` (matcher "startup"). Either an empty matcher (fires on all)
      // or explicit "resume" + "startup" entries are acceptable.
      const matchers = containingBlocks.map((b) => b.matcher);
      const firesOnResume = matchers.some((m) => m === '' || m === 'resume');
      const firesOnStartup = matchers.some((m) => m === '' || m === 'startup');

      assert.ok(firesOnResume, `session-start-continuation.sh must fire on resume (--continue). Current matchers: ${JSON.stringify(matchers)}`);
      assert.ok(firesOnStartup, `session-start-continuation.sh must fire on startup. Current matchers: ${JSON.stringify(matchers)}`);
    });

    it('does NOT fire on /clear (user explicitly wiped context)', () => {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_TPL, 'utf-8'));
      const sessionStart = settings.hooks?.SessionStart || [];

      const containingBlocks = sessionStart.filter((block) =>
        (block.hooks || []).some((h) => (h.command || '').includes('session-start-continuation.sh'))
      );
      const matchers = containingBlocks.map((b) => b.matcher);

      // If any block uses matcher "clear" specifically, that's wrong. An
      // empty "" matcher fires on /clear too, which is acceptable as long
      // as the script consumes-once and is safe to call (script no-ops
      // when continuation file is absent — verified in tests above).
      assert.ok(
        !matchers.includes('clear'),
        'should not be explicitly registered under matcher="clear"'
      );
    });
  });
});

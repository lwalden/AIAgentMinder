import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'bin', 'pre-pr-gate-hook.sh');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-prgate-'));
}

function run(cwd, { toolName = 'Bash', command = '', env = {} } = {}) {
  const input = JSON.stringify({
    tool_name: toolName,
    tool_input: { command },
  });
  try {
    const stdout = execFileSync('bash', [SCRIPT], {
      encoding: 'utf-8',
      cwd,
      input,
      env: { ...process.env, ...env },
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', exitCode: err.status };
  }
}

function passMarker(dir, ageSeconds = 0) {
  const p = path.join(dir, '.quality-gate-pass');
  fs.writeFileSync(p, new Date().toISOString());
  if (ageSeconds > 0) {
    const t = (Date.now() - ageSeconds * 1000) / 1000;
    fs.utimesSync(p, t, t);
  }
}

describe('pre-pr-gate-hook.sh', () => {
  let dir;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('allows non-PR Bash commands without a marker', () => {
    const r = run(dir, { command: 'npm test' });
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('ignores non-Bash tools', () => {
    const r = run(dir, { toolName: 'Write', command: 'gh pr create' });
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });

  it('blocks gh pr create when the quality-gate marker is absent', () => {
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /Quality gate has not passed/);
  });

  it('allows gh pr create when a fresh marker is present', () => {
    passMarker(dir);
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 0, r.stdout);
    assert.equal(r.stdout.trim(), '');
  });

  it('blocks when the marker is stale beyond the TTL', () => {
    passMarker(dir, 4000); // older than default 3600s
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /stale/);
  });

  it('honors a configurable TTL via AAM_PR_GATE_TTL_SECONDS', () => {
    passMarker(dir, 120);
    const r = run(dir, { command: 'gh pr create', env: { AAM_PR_GATE_TTL_SECONDS: '60' } });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /stale/);
  });

  it('blocks when the review result says block, even with a fresh marker', () => {
    passMarker(dir);
    fs.writeFileSync(
      path.join(dir, '.quality-review-result.json'),
      JSON.stringify({ decision: 'block', critical: 1, high: 2 })
    );
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /1 critical, 2 high/);
  });

  it('allows when the review result says pass', () => {
    passMarker(dir);
    fs.writeFileSync(
      path.join(dir, '.quality-review-result.json'),
      JSON.stringify({ decision: 'pass', critical: 0, high: 0 })
    );
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 0, r.stdout);
  });

  it('also gates the MCP github PR-creation tool referenced in a command', () => {
    const r = run(dir, { command: 'echo mcp__github__create_pull_request' });
    assert.equal(r.exitCode, 2);
    assert.match(r.stdout, /Quality gate/);
  });

  it('bypasses entirely when AAM_PR_GATE_BYPASS=1', () => {
    const r = run(dir, { command: 'gh pr create --fill', env: { AAM_PR_GATE_BYPASS: '1' } });
    assert.equal(r.exitCode, 0);
    assert.equal(r.stdout.trim(), '');
  });
});

function git(cwd, args) {
  // Disable commit/tag signing and user-config dependence so the helper works
  // in any environment (CI, sandboxes with global signing enabled, etc.).
  const cfg = [
    '-c', 'commit.gpgsign=false',
    '-c', 'tag.gpgsign=false',
    '-c', 'user.email=t@t',
    '-c', 'user.name=t',
  ];
  execFileSync('git', [...cfg, ...args], { cwd, stdio: 'pipe', env: { ...process.env } });
}

// Repo with a `main` base commit and a `feature` branch that adds `featureContent`.
function repoWithFeature(dir, featureContent) {
  git(dir, ['init', '-b', 'main', '-q']);
  fs.writeFileSync(path.join(dir, 'README.md'), 'base\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-q', '-m', 'base']);
  git(dir, ['checkout', '-q', '-b', 'feature']);
  fs.writeFileSync(path.join(dir, 'config.txt'), featureContent);
  git(dir, ['add', '.']);
  git(dir, ['commit', '-q', '-m', 'feature']);
}

describe('pre-pr-gate-hook.sh secret scan', () => {
  let dir;
  beforeEach(() => { dir = tmp(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('blocks a PR whose diff adds a high-confidence secret', () => {
    repoWithFeature(dir, 'aws_key = AKIAABCDEFGHIJKLMNOP\n');
    passMarker(dir);
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 2, r.stdout);
    assert.match(r.stdout, /secret/i);
  });

  it('allows a PR whose diff has no secrets', () => {
    repoWithFeature(dir, 'log_level = debug\nretries = 3\n');
    passMarker(dir);
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 0, r.stdout);
  });

  it('skips the secret scan when AAM_PR_GATE_SECRETS=0', () => {
    repoWithFeature(dir, 'aws_key = AKIAABCDEFGHIJKLMNOP\n');
    passMarker(dir);
    const r = run(dir, { command: 'gh pr create', env: { AAM_PR_GATE_SECRETS: '0' } });
    assert.equal(r.exitCode, 0, r.stdout);
  });

  it('does not flag a secret that exists only in the base, not the diff', () => {
    // Secret committed on main BEFORE branching → not an added line in main...HEAD.
    git(dir, ['init', '-b', 'main', '-q']);
    fs.writeFileSync(path.join(dir, 'legacy.txt'), 'token = AKIAABCDEFGHIJKLMNOP\n');
    git(dir, ['add', '.']);
    git(dir, ['commit', '-q', '-m', 'base with legacy secret']);
    git(dir, ['checkout', '-q', '-b', 'feature']);
    fs.writeFileSync(path.join(dir, 'new.txt'), 'clean change\n');
    git(dir, ['add', '.']);
    git(dir, ['commit', '-q', '-m', 'clean feature']);
    passMarker(dir);
    const r = run(dir, { command: 'gh pr create --fill' });
    assert.equal(r.exitCode, 0, r.stdout);
  });
});

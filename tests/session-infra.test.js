import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

describe('sprint-runner.ps1: --agent parameter', () => {
  const filePath = path.join(REPO_ROOT, 'bin', 'sprint-runner.ps1');

  it('has Agent parameter in param block', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('[string]$Agent'), 'must have $Agent parameter');
  });

  it('defaults Agent to sprint-master', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('"sprint-master"'), 'Agent default must be sprint-master');
  });

  it('passes --agent to claude invocations', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('--agent'), 'must pass --agent flag to claude');
  });
});

describe('sprint-runner.sh: --agent parameter', () => {
  const filePath = path.join(REPO_ROOT, 'bin', 'sprint-runner.sh');

  it('documents --agent in usage comments', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('--agent'), 'must document --agent flag');
  });

  it('defaults agent to sprint-master', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('sprint-master'), 'must default to sprint-master');
  });
});

describe('session-start-hook.sh: active sprint detection', () => {
  const filePath = path.join(REPO_ROOT, 'bin', 'session-start-hook.sh');

  it('detects active sprints', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('in-progress'), 'must check for in-progress sprint');
  });

  it('no longer references the retired cycle continuation file', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(!content.includes('.sprint-continuation.md'),
      'session-start-hook should not reference the retired .sprint-continuation.md');
  });
});

describe('/aiagentminder:setup skill (v5.0)', () => {
  const filePath = path.join(REPO_ROOT, 'skills', 'setup', 'SKILL.md');

  it('exists in skills/setup/SKILL.md', () => {
    assert.ok(fs.existsSync(filePath), 'setup skill must exist at skills/setup/SKILL.md');
  });

  it('writes the version stamp to .claude/aiagentminder-version', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('aiagentminder-version'),
      'must reference the version stamp file');
  });

  it('invokes the bootstrap helper script', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('aam-bootstrap.sh'),
      'must reference the bin/aam-bootstrap.sh helper for mechanical file copies');
  });

  it('handles existing-install detection', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.toLowerCase().includes('existing install') || content.toLowerCase().includes('already installed'),
      'must detect existing installations and not blindly overwrite');
  });
});

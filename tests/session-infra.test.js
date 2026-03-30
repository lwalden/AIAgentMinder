import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..', 'project');
const COMMANDS_DIR = path.resolve(__dirname, '..', '.claude', 'commands');

describe('sprint-runner.ps1: --agent parameter', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'scripts', 'sprint-runner.ps1');

  it('has Agent parameter in param block', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('[string]$Agent'), 'must have $Agent parameter');
  });

  it('defaults Agent to sprint-executor', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('"sprint-executor"'), 'Agent default must be sprint-executor');
  });

  it('passes --agent to claude invocations', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('--agent'), 'must pass --agent flag to claude');
  });
});

describe('sprint-runner.sh: --agent parameter', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'scripts', 'sprint-runner.sh');

  it('documents --agent in usage comments', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('--agent'), 'must document --agent flag');
  });

  it('defaults agent to sprint-executor', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('sprint-executor'), 'must default to sprint-executor');
  });
});

describe('session-start-hook.sh: agent mismatch warning', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'scripts', 'session-start-hook.sh');

  it('still detects sprint continuation signals', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('.sprint-continuation.md'), 'must check for continuation file');
  });

  it('still detects active sprints', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('in-progress'), 'must check for in-progress sprint');
  });
});

describe('/aam-setup: installs session profile agents', () => {
  const filePath = path.join(COMMANDS_DIR, 'aam-setup.md');

  it('references .claude/agents/ directory', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('.claude/agents/'), 'must reference agents directory');
  });
});

describe('/aam-update: handles agent migration', () => {
  const filePath = path.join(COMMANDS_DIR, 'aam-update.md');

  it('lists agents as AIAgentMinder-owned files', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('.claude/agents/'), 'must reference agents directory');
  });

  it('lists relocated rules as obsolete', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('scope-guardian') || content.includes('sprint-workflow'),
      'must list relocated rules for removal');
  });
});

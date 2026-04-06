import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..', 'project');

describe('backlog integration: sprint-planner agent', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'agents', 'sprint-planner.md');

  it('PLAN phase references backlog-capture.sh list', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('backlog-capture.sh list'), 'PLAN should read backlog via script');
  });

  it('scope guardian offers backlog capture option', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('backlog-capture.sh add'), 'scope guardian should offer backlog capture');
  });
});

describe('backlog integration: dev agent', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'agents', 'dev.md');

  it('scope guardian offers backlog capture option', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('backlog-capture.sh add'), 'scope guardian should offer backlog capture');
  });
});

describe('backlog integration: /aam-revise skill', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'skills', 'aam-revise.md');

  it('includes backlog deferral option', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('backlog') || content.includes('BACKLOG'), 'must reference backlog');
    assert.ok(content.includes('backlog-capture.sh'), 'must reference script for deferral');
  });
});

describe('backlog integration: roadmap template', () => {
  const filePath = path.join(PROJECT_DIR, 'docs', 'strategy-roadmap.md');

  it('does NOT contain "Backlog (unscheduled)" section', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(!content.includes('## Backlog (unscheduled)'), 'should not have old Backlog section');
  });

  it('contains pointer to BACKLOG.md', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('BACKLOG.md'), 'must reference BACKLOG.md');
  });
});

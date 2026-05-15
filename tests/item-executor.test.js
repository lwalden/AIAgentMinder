import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_PATH = path.resolve(__dirname, '..', 'project', '.claude', 'agents', 'item-executor.md');

function readAgent() {
  return fs.readFileSync(AGENT_PATH, 'utf-8');
}

describe('item-executor agent', () => {
  it('file exists', () => {
    assert.ok(fs.existsSync(AGENT_PATH));
  });

  it('has valid YAML frontmatter with name and description', () => {
    const content = readAgent();
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(fmMatch, 'must have YAML frontmatter');
    const fm = fmMatch[1];
    assert.ok(fm.includes('name:'), 'must have name');
    assert.ok(fm.includes('description:'), 'must have description');
    const nameMatch = fm.match(/name:\s*(.+)/);
    assert.equal(nameMatch[1].trim(), 'item-executor');
  });

  it('includes TDD cycle instructions', () => {
    const content = readAgent();
    assert.ok(
      content.includes('TDD') || content.includes('test-driven'),
      'must include TDD cycle instructions'
    );
    assert.ok(
      content.includes('failing test') || content.includes('RED'),
      'must reference writing failing tests first'
    );
  });

  it('includes architecture fitness constraints', () => {
    const content = readAgent();
    // Rules auto-load, so this should reference them, not duplicate
    assert.ok(
      content.includes('architecture') || content.includes('fitness') || content.includes('300 line'),
      'must reference architecture fitness'
    );
  });

  it('includes debug checkpoint protocol', () => {
    const content = readAgent();
    assert.ok(
      content.includes('debug checkpoint') || content.includes('Debug Checkpoint') || content.includes('3 failed'),
      'must include debug checkpoint protocol'
    );
  });

  it('defines done/blocked output contract', () => {
    const content = readAgent();
    assert.ok(
      content.includes('done') || content.includes('Done'),
      'must define done output'
    );
    assert.ok(
      content.includes('blocked') || content.includes('Blocked'),
      'must define blocked output'
    );
  });

  it('defines context-limit graceful degradation behavior', () => {
    const content = readAgent();
    assert.ok(
      content.includes('context') && (content.includes('limit') || content.includes('pressure') || content.includes('partial')),
      'must define context-limit graceful degradation'
    );
  });

  it('documents worktree isolation', () => {
    const content = readAgent();
    assert.ok(content.includes('Worktree') || content.includes('worktree'),
      'must mention worktree isolation');
    assert.ok(content.includes('isolation') || content.includes('isolated'),
      'must reference the isolation contract');
  });

  it('output contract includes branch name on done', () => {
    const content = readAgent();
    assert.ok(content.includes('branch=') || content.includes('branch_name'),
      'done contract must return the branch name so sprint-master can pass it to pr-pipeliner');
  });

  it('requires pushing the branch before returning done', () => {
    const content = readAgent();
    assert.ok(content.includes('git push') || content.includes('push the branch') || content.includes('push to origin'),
      'item-executor must push its branch to origin since pr-pipeliner runs in the main worktree');
  });

  it('no longer references the retired correction-capture hook', () => {
    const content = readAgent();
    assert.ok(!content.includes('Correction Capture'),
      'correction-capture was retired in v4.6.0 — Auto Memory supersedes it');
    assert.ok(!content.includes('Correction Pattern Detected'),
      'correction-capture alert references must be removed');
  });
});

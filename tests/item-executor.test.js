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
});

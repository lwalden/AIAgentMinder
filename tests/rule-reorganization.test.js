import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'rules');

const KEPT_RULES = [
  'git-workflow.md',
  'tool-first.md',
  'correction-capture.md',
  'context-cycling.md',
  'README.md',
];

const REMOVED_RULES = [
  'sprint-workflow.md',
  'approach-first.md',
  'debug-checkpoint.md',
  'code-quality.md',
  'architecture-fitness.md',
  'scope-guardian.md',
];

describe('rule reorganization: kept rules exist', () => {
  for (const file of KEPT_RULES) {
    it(`${file} exists in project/.claude/rules/`, () => {
      assert.ok(fs.existsSync(path.join(RULES_DIR, file)), `${file} must exist`);
    });
  }
});

describe('rule reorganization: removed rules do not exist', () => {
  for (const file of REMOVED_RULES) {
    it(`${file} does NOT exist in project/.claude/rules/`, () => {
      assert.ok(!fs.existsSync(path.join(RULES_DIR, file)), `${file} must be removed`);
    });
  }
});

describe('rule reorganization: context-cycling.md content', () => {
  it('contains key context cycling markers', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'context-cycling.md'), 'utf-8');
    assert.ok(content.includes('.context-usage'), 'must reference .context-usage file');
    assert.ok(content.includes('should_cycle'), 'must reference should_cycle flag');
    assert.ok(content.includes('context-cycle.sh'), 'must reference context-cycle.sh script');
  });

  it('is concise (under 30 lines)', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'context-cycling.md'), 'utf-8');
    const lines = content.split('\n').length;
    assert.ok(lines <= 30, `context-cycling.md is ${lines} lines, expected <= 30`);
  });
});

describe('rule reorganization: README.md updated', () => {
  it('lists the 4 active universal rules', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'README.md'), 'utf-8');
    assert.ok(content.includes('git-workflow.md'), 'must list git-workflow');
    assert.ok(content.includes('tool-first.md'), 'must list tool-first');
    assert.ok(content.includes('correction-capture.md'), 'must list correction-capture');
    assert.ok(content.includes('context-cycling.md'), 'must list context-cycling');
  });

  it('does not list removed rules as active', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'README.md'), 'utf-8');
    // Should not have table rows for removed rules
    for (const removed of REMOVED_RULES) {
      // Check it's not in a table row (| filename |)
      const tablePattern = `| \`${removed}\``;
      assert.ok(!content.includes(tablePattern), `README must not list ${removed} in active rules table`);
    }
  });
});

describe('rule reorganization: correction-capture.md preserved', () => {
  it('still references PostToolUse hook', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'correction-capture.md'), 'utf-8');
    assert.ok(content.includes('PostToolUse'), 'must reference PostToolUse hook');
  });
});

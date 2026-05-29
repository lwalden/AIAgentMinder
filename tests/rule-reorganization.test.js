import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_DIR = path.resolve(__dirname, '..', 'templates', '.claude', 'rules');

const KEPT_RULES = [
  'git-workflow.md',
  'tool-first.md',
  'shell-and-files.md',
  'context-warnings.md',
  'README.md',
];

const REMOVED_RULES = [
  'sprint-workflow.md',
  'approach-first.md',
  'debug-checkpoint.md',
  'code-quality.md',
  'architecture-fitness.md',
  'scope-guardian.md',
  // Retired — Claude Code's native Auto Memory now handles correction capture.
  'correction-capture.md',
  // Retired in v5.1.0 — auto-cycle protocol replaced by a passive
  // context-usage warning hook; rule renamed to context-warnings.md.
  'context-cycling.md',
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

describe('rule reorganization: context-warnings.md content', () => {
  it('contains key context-warning markers', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'context-warnings.md'), 'utf-8');
    assert.ok(content.includes('.context-usage'), 'must reference .context-usage file');
    assert.ok(content.includes('should_cycle'), 'must reference should_cycle flag (status-line contract)');
    assert.ok(content.includes('/aiagentminder:handoff'), 'must point users at the handoff skill');
    assert.ok(content.includes('Stop hook'), 'must explain the hook event that fires the warning');
  });

  it('describes the new behavior, not the retired auto-cycle protocol', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'context-warnings.md'), 'utf-8');
    assert.ok(!content.includes('BLOCKED'),
      'context-warnings rule should not describe a blocking protocol');
    assert.ok(!content.includes('.sprint-continuation.md'),
      'context-warnings rule should not reference the retired continuation file');
  });
});

describe('rule reorganization: shell-and-files.md content', () => {
  it('steers file ops to Write/Edit and shell choice to the platform', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'shell-and-files.md'), 'utf-8');
    assert.ok(/Write and Edit tools/i.test(content), 'must point file ops at the Write/Edit tools');
    assert.ok(content.includes('PowerShell'), 'must name PowerShell as the Windows shell');
    assert.ok(/heredoc|cat >|touch|bash -c/i.test(content),
      'must call out the shell file-write patterns to avoid');
  });
});

describe('rule reorganization: README.md updated', () => {
  it('lists the active universal rules', () => {
    const content = fs.readFileSync(path.join(RULES_DIR, 'README.md'), 'utf-8');
    assert.ok(content.includes('git-workflow.md'), 'must list git-workflow');
    assert.ok(content.includes('tool-first.md'), 'must list tool-first');
    assert.ok(content.includes('shell-and-files.md'), 'must list shell-and-files');
    assert.ok(content.includes('context-warnings.md'), 'must list context-warnings');
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


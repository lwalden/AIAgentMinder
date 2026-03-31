import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(__dirname, '..', 'project', '.claude', 'skills', 'aam-self-review.md');

describe('self-review skill: agent-based architecture', () => {
  it('references reviewer agent names', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    assert.ok(content.includes('security-reviewer'), 'must reference security-reviewer');
    assert.ok(content.includes('performance-reviewer'), 'must reference performance-reviewer');
    assert.ok(content.includes('api-reviewer'), 'must reference api-reviewer');
    assert.ok(content.includes('cost-reviewer'), 'must reference cost-reviewer');
    assert.ok(content.includes('ux-reviewer'), 'must reference ux-reviewer');
  });

  it('does not contain inline diff placeholder', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    assert.ok(!content.includes('[paste diff here]'), 'must not contain inline diff placeholder');
  });

  it('does not reference old rule file paths', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    assert.ok(!content.includes('.claude/rules/architecture-fitness.md'), 'must not reference old architecture-fitness path');
    assert.ok(!content.includes('.claude/rules/code-quality.md'), 'must not reference old code-quality path');
  });

  it('still contains judge pass (Step 3c)', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    assert.ok(content.includes('Judge') || content.includes('judge'), 'must contain judge pass');
  });

  it('still contains cross-model review (Step 3b)', () => {
    const content = fs.readFileSync(SKILL_PATH, 'utf-8');
    assert.ok(content.includes('cross-model') || content.includes('Cross-Model'), 'must contain cross-model review');
  });
});

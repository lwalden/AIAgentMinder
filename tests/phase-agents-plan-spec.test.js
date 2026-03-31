import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');

function readAgent(name) {
  return fs.readFileSync(path.join(AGENTS_DIR, `${name}.md`), 'utf-8');
}

describe('sprint-planner agent', () => {
  const AGENT = 'sprint-planner';

  it('file exists', () => {
    assert.ok(fs.existsSync(path.join(AGENTS_DIR, `${AGENT}.md`)));
  });

  it('has valid YAML frontmatter with name and description', () => {
    const content = readAgent(AGENT);
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(fmMatch, 'must have YAML frontmatter');
    const fm = fmMatch[1];
    assert.ok(fm.includes('name:'), 'must have name');
    assert.ok(fm.includes('description:'), 'must have description');
    const nameMatch = fm.match(/name:\s*(.+)/);
    assert.equal(nameMatch[1].trim(), AGENT);
  });

  it('references strategy roadmap', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('strategy-roadmap') || content.includes('roadmap'),
      'must reference roadmap'
    );
  });

  it('references DECISIONS.md', () => {
    const content = readAgent(AGENT);
    assert.ok(content.includes('DECISIONS.md'), 'must reference DECISIONS.md');
  });

  it('references BACKLOG.md or backlog-capture', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('BACKLOG') || content.includes('backlog'),
      'must reference backlog'
    );
  });

  it('references archive sizing hints', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('sizing') || content.includes('<!-- sizing'),
      'must reference sizing hints from sprint archives'
    );
  });

  it('is under 80 lines', () => {
    const content = readAgent(AGENT);
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 80, `must be under 80 lines, got ${lineCount}`);
  });
});

describe('sprint-speccer agent', () => {
  const AGENT = 'sprint-speccer';

  it('file exists', () => {
    assert.ok(fs.existsSync(path.join(AGENTS_DIR, `${AGENT}.md`)));
  });

  it('has valid YAML frontmatter with name and description', () => {
    const content = readAgent(AGENT);
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(fmMatch, 'must have YAML frontmatter');
    const fm = fmMatch[1];
    assert.ok(fm.includes('name:'), 'must have name');
    assert.ok(fm.includes('description:'), 'must have description');
    const nameMatch = fm.match(/name:\s*(.+)/);
    assert.equal(nameMatch[1].trim(), AGENT);
  });

  it('defines the spec template format', () => {
    const content = readAgent(AGENT);
    // Must include the spec fields from the sprint-workflow SPEC phase
    const requiredFields = ['Approach', 'Test Plan', 'Files', 'Dependencies'];
    for (const field of requiredFields) {
      assert.ok(
        content.includes(field),
        `spec template must include field: ${field}`
      );
    }
  });

  it('includes Upgrade Impact field', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('Upgrade Impact'),
      'spec template must include Upgrade Impact field'
    );
  });

  it('is under 80 lines', () => {
    const content = readAgent(AGENT);
    const lineCount = content.split('\n').length;
    assert.ok(lineCount <= 80, `must be under 80 lines, got ${lineCount}`);
  });
});

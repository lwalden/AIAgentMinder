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

describe('pr-pipeliner agent', () => {
  const AGENT = 'pr-pipeliner';

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

  it('references .pr-pipeline.json config', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('.pr-pipeline.json') || content.includes('pr-pipeline'),
      'must reference PR pipeline config'
    );
  });

  it('defines escalation conditions', () => {
    const content = readAgent(AGENT);
    const escalationTerms = ['escalat', 'high-risk', 'cycle', 'CI fail', 'blocked'];
    const hasEscalation = escalationTerms.some(term =>
      content.toLowerCase().includes(term.toLowerCase())
    );
    assert.ok(hasEscalation, 'must define escalation conditions');
  });

  it('covers the review-fix-test-merge loop', () => {
    const content = readAgent(AGENT);
    assert.ok(content.includes('review') || content.includes('Review'), 'must include review');
    assert.ok(content.includes('fix') || content.includes('Fix'), 'must include fix');
    assert.ok(content.includes('test') || content.includes('Test'), 'must include test');
    assert.ok(content.includes('merge') || content.includes('Merge'), 'must include merge');
  });

  it('is the execution gate — includes build and lint steps', () => {
    const content = readAgent(AGENT);
    assert.ok(content.includes('Build') || content.includes('build'), 'must include build step');
    assert.ok(content.includes('Lint') || content.includes('lint'), 'must include lint step');
  });
});

describe('sprint-retro agent', () => {
  const AGENT = 'sprint-retro';

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

  it('references .sprint-metrics.json', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('.sprint-metrics.json') || content.includes('sprint-metrics'),
      'must reference metrics file'
    );
  });

  it('includes adaptive sizing logic', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('sizing') || content.includes('Sizing'),
      'must include adaptive sizing'
    );
  });

  it('produces retrospective report', () => {
    const content = readAgent(AGENT);
    assert.ok(
      content.includes('retrospective') || content.includes('Retrospective'),
      'must produce retrospective report'
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');
const AGENT_PATH = path.join(AGENTS_DIR, 'quality-reviewer.md');

function readAgent() {
  return fs.readFileSync(AGENT_PATH, 'utf-8');
}

describe('quality-reviewer agent', () => {
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
    assert.equal(nameMatch[1].trim(), 'quality-reviewer');
  });

  it('covers quality gate checklist (build, tests, lint, security)', () => {
    const content = readAgent();
    assert.ok(content.includes('build') || content.includes('Build'), 'must reference build');
    assert.ok(content.includes('test') || content.includes('Test'), 'must reference tests');
    assert.ok(content.includes('lint') || content.includes('Lint'), 'must reference lint');
    assert.ok(content.includes('security') || content.includes('Security'), 'must reference security');
  });

  it('covers judge pass criteria and severity classification', () => {
    const content = readAgent();
    assert.ok(
      content.includes('judge') || content.includes('Judge'),
      'must include judge pass'
    );
    assert.ok(
      content.includes('severity') || content.includes('Severity') || content.includes('High') || content.includes('Critical'),
      'must include severity classification'
    );
  });

  it('does NOT reference the Agent tool (sub-agent constraint)', () => {
    const content = readAgent();
    // Quality-reviewer is spawned as a sub-agent — it cannot use Agent tool
    assert.ok(
      !content.includes('Agent tool') && !content.includes('spawn.*agent'),
      'must not reference Agent tool (sub-sub-agents are blocked)'
    );
  });

  it('defines input contract for receiving lens findings from orchestrator', () => {
    const content = readAgent();
    assert.ok(
      content.includes('lens findings') || content.includes('Lens Findings') ||
      content.includes('review findings') || content.includes('Review Findings') ||
      (content.includes('findings') && content.includes('sprint-master')),
      'must define input contract for lens findings'
    );
  });

  it('design decision recorded in DECISIONS.md', () => {
    const decisions = fs.readFileSync(
      path.resolve(__dirname, '..', 'DECISIONS.md'), 'utf-8'
    );
    assert.ok(
      decisions.includes('quality-reviewer') || decisions.includes('sub-sub-agent'),
      'DECISIONS.md must record quality-reviewer design decision'
    );
  });
});

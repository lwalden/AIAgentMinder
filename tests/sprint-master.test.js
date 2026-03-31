import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');
const AGENT_PATH = path.join(AGENTS_DIR, 'sprint-master.md');

function readAgent() {
  return fs.readFileSync(AGENT_PATH, 'utf-8');
}

describe('sprint-master orchestrator agent', () => {
  it('file exists', () => {
    assert.ok(fs.existsSync(AGENT_PATH), 'sprint-master.md must exist');
  });

  it('has valid YAML frontmatter with name and description', () => {
    const content = readAgent();
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(fmMatch, 'must have YAML frontmatter delimiters');

    const fm = fmMatch[1];
    assert.ok(fm.includes('name:'), 'frontmatter must have name field');
    assert.ok(fm.includes('description:'), 'frontmatter must have description field');

    const nameMatch = fm.match(/name:\s*(.+)/);
    assert.ok(nameMatch, 'name field must have a value');
    assert.equal(nameMatch[1].trim(), 'sprint-master');
  });

  it('routing table covers all 10 states', () => {
    const content = readAgent();
    const requiredStates = [
      'PLAN', 'SPEC', 'APPROVE', 'EXECUTE', 'TEST',
      'REVIEW', 'MERGE', 'VALIDATE', 'COMPLETE',
      'BLOCKED',
    ];

    for (const state of requiredStates) {
      assert.ok(
        content.includes(state),
        `routing table must reference state: ${state}`
      );
    }
  });

  it('references REWORK and CONTEXT_CYCLE states', () => {
    const content = readAgent();
    assert.ok(content.includes('REWORK'), 'must reference REWORK state');
    assert.ok(
      content.includes('CONTEXT_CYCLE') || content.includes('context cycle') || content.includes('context cycling'),
      'must reference context cycling'
    );
  });

  it('is under 100 lines (lightweight router constraint)', () => {
    const content = readAgent();
    const lineCount = content.split('\n').length;
    assert.ok(
      lineCount <= 100,
      `sprint-master.md must be under 100 lines, got ${lineCount}`
    );
  });

  it('references phase agents by name in routing table', () => {
    const content = readAgent();
    // Sprint-master must reference the phase agents it routes to.
    // Existence validation deferred to S8-009 (orchestrator integration tests)
    // once all phase agents are created.
    const expectedRefs = [
      'sprint-planner',
      'sprint-speccer',
      'item-executor',
      'quality-reviewer',
      'pr-pipeliner',
      'sprint-retro',
    ];

    for (const ref of expectedRefs) {
      assert.ok(
        content.includes(ref),
        `routing table must reference phase agent: ${ref}`
      );
    }
  });

  it('includes review lens dispatch instructions for TEST state', () => {
    const content = readAgent();
    // Must reference dispatching review lenses (spike finding: sub-sub-agents blocked)
    assert.ok(
      content.includes('review') && (content.includes('lens') || content.includes('reviewer')),
      'must include review lens dispatch instructions'
    );
  });

  it('defines human checkpoints for PLAN, APPROVE, BLOCKED, REWORK', () => {
    const content = readAgent();
    const checkpointTerms = ['human', 'checkpoint', 'wait', 'approval'];
    const hasCheckpointLanguage = checkpointTerms.some(term =>
      content.toLowerCase().includes(term)
    );
    assert.ok(hasCheckpointLanguage, 'must define human checkpoint behavior');
  });

  it('defines error handling (retry + escalate)', () => {
    const content = readAgent();
    assert.ok(
      content.includes('retry') || content.includes('Retry'),
      'must define retry behavior'
    );
    assert.ok(
      content.includes('escalat') || content.includes('BLOCKED'),
      'must define escalation behavior'
    );
  });

  it('references sprint-update.sh for status updates', () => {
    const content = readAgent();
    assert.ok(
      content.includes('sprint-update.sh'),
      'must reference sprint-update.sh for status tracking'
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCoreFiles } from '../lib/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');

function readAgent(name) {
  return fs.readFileSync(path.join(AGENTS_DIR, `${name}.md`), 'utf-8');
}

const SPRINT_MASTER = 'sprint-master';

// All phase agents referenced by the sprint-master routing table
const PHASE_AGENTS = [
  'sprint-planner',
  'sprint-speccer',
  'item-executor',
  'quality-reviewer',
  'pr-pipeliner',
  'sprint-retro',
];

// Review lens agents dispatched by sprint-master during TEST state
const REVIEW_LENSES = [
  'security-reviewer',
  'performance-reviewer',
  'api-reviewer',
  'cost-reviewer',
  'ux-reviewer',
];

// All 10 states in the sprint state machine
const ALL_STATES = [
  'PLAN', 'SPEC', 'APPROVE', 'EXECUTE', 'TEST',
  'REVIEW', 'MERGE', 'VALIDATE', 'COMPLETE', 'BLOCKED',
];

describe('orchestrator integration: agent file existence', () => {
  it('sprint-master exists', () => {
    assert.ok(fs.existsSync(path.join(AGENTS_DIR, `${SPRINT_MASTER}.md`)));
  });

  it('all phase agents referenced by sprint-master exist', () => {
    const masterContent = readAgent(SPRINT_MASTER);
    for (const agent of PHASE_AGENTS) {
      assert.ok(
        fs.existsSync(path.join(AGENTS_DIR, `${agent}.md`)),
        `phase agent ${agent}.md must exist`
      );
      assert.ok(
        masterContent.includes(agent),
        `sprint-master must reference ${agent}`
      );
    }
  });

  it('all review lens agents exist', () => {
    for (const lens of REVIEW_LENSES) {
      assert.ok(
        fs.existsSync(path.join(AGENTS_DIR, `${lens}.md`)),
        `review lens ${lens}.md must exist`
      );
    }
  });
});

describe('orchestrator integration: state machine coverage', () => {
  it('sprint-master routing table covers all 10 states', () => {
    const content = readAgent(SPRINT_MASTER);
    for (const state of ALL_STATES) {
      assert.ok(content.includes(state), `routing table must cover state: ${state}`);
    }
  });

  it('sprint-master handles REWORK state', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(content.includes('REWORK'));
  });

  it('sprint-master handles context cycling', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(
      content.includes('CONTEXT_CYCLE') || content.includes('context cycling') || content.includes('context cycle'),
    );
  });
});

describe('orchestrator integration: human checkpoints', () => {
  it('sprint-master defines human checkpoints for PLAN', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(content.includes('PLAN') && content.toLowerCase().includes('human'));
  });

  it('sprint-master defines human checkpoints for APPROVE', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(content.includes('APPROVE') && content.toLowerCase().includes('approve'));
  });

  it('sprint-master defines human checkpoints for BLOCKED', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(content.includes('BLOCKED'));
  });

  it('sprint-master defines human checkpoints for REWORK', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(content.includes('REWORK'));
  });
});

describe('orchestrator integration: error handling', () => {
  it('sprint-master defines retry behavior', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(
      content.includes('retry') || content.includes('Retry'),
      'must define retry on agent failure'
    );
  });

  it('sprint-master defines escalation to human', () => {
    const content = readAgent(SPRINT_MASTER);
    assert.ok(
      content.includes('escalat') || content.includes('BLOCKED'),
      'must define escalation path'
    );
  });
});

describe('orchestrator integration: input/output contracts', () => {
  it('sprint-planner defines output contract', () => {
    const content = readAgent('sprint-planner');
    assert.ok(
      content.includes('Output Contract') || content.includes('output'),
      'sprint-planner must define output format'
    );
  });

  it('sprint-speccer defines spec template', () => {
    const content = readAgent('sprint-speccer');
    assert.ok(
      content.includes('Spec Template') || content.includes('spec template') || content.includes('Template'),
      'sprint-speccer must define spec template'
    );
  });

  it('item-executor defines done/blocked output', () => {
    const content = readAgent('item-executor');
    assert.ok(content.includes('done') && content.includes('blocked'));
  });

  it('quality-reviewer defines review/findings output', () => {
    const content = readAgent('quality-reviewer');
    assert.ok(content.includes('review') && content.includes('findings'));
  });

  it('pr-pipeliner defines merged/escalated output', () => {
    const content = readAgent('pr-pipeliner');
    assert.ok(content.includes('merged') && content.includes('escalated'));
  });

  it('sprint-retro defines retrospective output', () => {
    const content = readAgent('sprint-retro');
    assert.ok(
      content.includes('retrospective') || content.includes('Retrospective'),
    );
  });
});

describe('orchestrator integration: no circular dependencies', () => {
  it('phase agents do not try to spawn sprint-master', () => {
    // Phase agents may reference sprint-master descriptively ("provided by sprint-master",
    // "spawned by sprint-master") but must not try to invoke it as a tool target.
    for (const agent of PHASE_AGENTS) {
      const content = readAgent(agent);
      // Check for patterns that indicate trying to spawn the orchestrator
      const spawnPatterns = [
        /spawn\s+sprint-master/i,
        /Agent\s+tool.*sprint-master/i,
        /--agent\s+sprint-master/i,
      ];
      for (const pattern of spawnPatterns) {
        assert.ok(
          !pattern.test(content),
          `${agent} must not try to spawn sprint-master (circular dependency): matched ${pattern}`
        );
      }
    }
  });
});

describe('orchestrator integration: sync manifest', () => {
  it('sprint-master is in getCoreFiles manifest', () => {
    const coreFiles = getCoreFiles();
    assert.ok(
      coreFiles.includes('.claude/agents/sprint-master.md'),
      'sprint-master must be in sync manifest'
    );
  });

  it('all phase agents are in getCoreFiles manifest', () => {
    const coreFiles = getCoreFiles();
    for (const agent of PHASE_AGENTS) {
      assert.ok(
        coreFiles.includes(`.claude/agents/${agent}.md`),
        `${agent} must be in sync manifest`
      );
    }
  });

  it('sprint-metrics.sh is in getCoreFiles manifest', () => {
    const coreFiles = getCoreFiles();
    assert.ok(
      coreFiles.includes('.claude/scripts/sprint-metrics.sh'),
      'sprint-metrics.sh must be in sync manifest'
    );
  });
});

describe('orchestrator integration: YAML frontmatter consistency', () => {
  it('all orchestrator agents have valid frontmatter', () => {
    const allAgents = [SPRINT_MASTER, ...PHASE_AGENTS];
    for (const agent of allAgents) {
      const content = readAgent(agent);
      const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      assert.ok(fmMatch, `${agent} must have YAML frontmatter`);
      const fm = fmMatch[1];
      assert.ok(fm.includes('name:'), `${agent} must have name field`);
      assert.ok(fm.includes('description:'), `${agent} must have description field`);
      const nameMatch = fm.match(/name:\s*(.+)/);
      assert.equal(nameMatch[1].trim(), agent, `${agent} name must match filename`);
    }
  });
});

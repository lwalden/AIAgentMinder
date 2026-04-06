import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');

const AGENT_FILES = [
  'dev.md',
  'debug.md',
  'hotfix.md',
  'qa.md',
];

describe('session profile agents: file existence', () => {
  for (const file of AGENT_FILES) {
    it(`${file} exists in project/.claude/agents/`, () => {
      const filePath = path.join(AGENTS_DIR, file);
      assert.ok(fs.existsSync(filePath), `${file} not found`);
    });
  }
});

describe('session profile agents: frontmatter', () => {
  for (const file of AGENT_FILES) {
    it(`${file} has valid YAML frontmatter with name and description`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      // Must start with ---
      assert.ok(content.startsWith('---'), `${file} must start with YAML frontmatter`);
      // Must have closing ---
      const secondDash = content.indexOf('---', 3);
      assert.ok(secondDash > 3, `${file} must have closing frontmatter delimiter`);
      const frontmatter = content.slice(3, secondDash);
      // Must contain name and description fields
      assert.ok(/^name:/m.test(frontmatter), `${file} frontmatter must contain 'name:'`);
      assert.ok(/^description:/m.test(frontmatter), `${file} frontmatter must contain 'description:'`);
    });
  }
});

describe('session profile agents: sprint-master content', () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-master.md'), 'utf-8');

  it('contains sprint state machine routing table', () => {
    const states = ['PLAN', 'SPEC', 'APPROVE', 'EXECUTE', 'TEST', 'REVIEW', 'MERGE', 'VALIDATE', 'COMPLETE'];
    for (const state of states) {
      assert.ok(content.includes(state), `sprint-master must reference ${state} state`);
    }
  });

  it('contains human checkpoint protocol', () => {
    assert.ok(content.includes('.sprint-human-checkpoint'), 'must reference .sprint-human-checkpoint');
  });

  it('contains COMPLETE section with retro and archive PR', () => {
    assert.ok(content.includes('## COMPLETE'), 'must have COMPLETE section');
    assert.ok(content.includes('sprint-retro'), 'must spawn sprint-retro');
    assert.ok(content.includes('chore/sprint-'), 'must reference archive branch pattern');
  });
});

describe('session profile agents: dev content', () => {
  it('contains TDD and code quality', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('TDD'), 'must contain TDD');
    assert.ok(content.includes('test suite before every commit'), 'must contain build discipline');
  });

  it('contains architecture fitness', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('300 lines'), 'must contain file size constraint');
    assert.ok(content.includes('Layer boundaries') || content.includes('Layer Boundaries'), 'must contain layer boundaries');
  });

  it('contains approach-first', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('Approach-First'), 'must contain approach-first');
  });

  it('contains debug checkpoint', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('Debug Checkpoint'), 'must contain debug checkpoint');
  });

  it('contains scope guardian', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('strategy-roadmap.md'), 'must reference roadmap');
  });
});

describe('session profile agents: debug content', () => {
  it('contains debug checkpoint methodology', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'debug.md'), 'utf-8');
    assert.ok(content.includes('Debug Checkpoint'), 'must contain debug checkpoint');
    assert.ok(content.includes('Attempt 1'), 'must contain attempt progression');
    assert.ok(content.includes('Current hypothesis'), 'must contain hypothesis step');
  });
});

describe('session profile agents: hotfix content', () => {
  it('contains minimal-ceremony fast path', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'hotfix.md'), 'utf-8');
    assert.ok(content.includes('hotfix') || content.includes('Hotfix'), 'must reference hotfix');
    assert.ok(content.includes('branch'), 'must reference branching');
    assert.ok(content.includes('test'), 'must reference testing');
    assert.ok(content.includes('PR') || content.includes('pull request'), 'must reference PR creation');
  });
});

describe('session profile agents: qa content', () => {
  it('contains architecture fitness', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'qa.md'), 'utf-8');
    assert.ok(content.includes('300 lines') || content.includes('Architecture Fitness'), 'must contain architecture fitness');
  });

  it('references quality gate and self-review', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'qa.md'), 'utf-8');
    assert.ok(content.includes('/aam-quality-gate'), 'must reference quality gate');
    assert.ok(content.includes('/aam-self-review'), 'must reference self-review');
  });
});

describe('session profile agents: no rule file references to removed files', () => {
  const removedRules = [
    'sprint-workflow.md',
    'approach-first.md',
    'debug-checkpoint.md',
    'code-quality.md',
    'architecture-fitness.md',
    'scope-guardian.md',
  ];

  for (const file of AGENT_FILES) {
    it(`${file} does not reference removed rule files by path`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      for (const rule of removedRules) {
        // Should not contain ".claude/rules/sprint-workflow.md" style references
        // But can contain the rule NAME (e.g., "sprint workflow") in prose
        assert.ok(
          !content.includes(`.claude/rules/${rule}`),
          `${file} must not reference .claude/rules/${rule} (rule is being moved to agents)`
        );
      }
    });
  }
});

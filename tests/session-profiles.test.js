import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');

const AGENT_FILES = [
  'sprint-executor.md',
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

describe('session profile agents: sprint-executor content', () => {
  it('contains sprint state machine markers', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    const markers = ['PLAN', 'SPEC', 'APPROVE', 'EXECUTE', 'TEST', 'REVIEW', 'MERGE', 'VALIDATE', 'COMPLETE', 'BLOCKED', 'CONTEXT_CYCLE'];
    for (const marker of markers) {
      assert.ok(content.includes(`## ${marker}`), `sprint-executor must contain ## ${marker}`);
    }
  });

  it('contains quality checklist', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('Quality Checklist'), 'must contain Quality Checklist');
    assert.ok(content.includes('/aam-quality-gate'), 'must reference /aam-quality-gate');
    assert.ok(content.includes('/aam-self-review'), 'must reference /aam-self-review');
    assert.ok(content.includes('/aam-pr-pipeline'), 'must reference /aam-pr-pipeline');
  });

  it('contains scope guardian content', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('strategy-roadmap.md'), 'must reference strategy-roadmap.md');
    assert.ok(content.includes('Out of Scope'), 'must include out of scope handling');
  });

  it('contains approach-first content', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('Approach-First'), 'must contain approach-first protocol');
  });

  it('contains code quality content', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('TDD cycle'), 'must contain TDD cycle');
  });

  it('contains architecture fitness content', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('300 lines'), 'must contain file size constraint');
    assert.ok(content.includes('Secrets in Source'), 'must contain secrets constraint');
  });

  it('contains debug checkpoint content', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'sprint-executor.md'), 'utf-8');
    assert.ok(content.includes('Debug Checkpoint'), 'must contain debug checkpoint');
  });
});

describe('session profile agents: dev content', () => {
  it('contains TDD and code quality', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('TDD cycle'), 'must contain TDD');
    assert.ok(content.includes('Build and test before every commit'), 'must contain build discipline');
  });

  it('contains architecture fitness', () => {
    const content = fs.readFileSync(path.join(AGENTS_DIR, 'dev.md'), 'utf-8');
    assert.ok(content.includes('300 lines'), 'must contain file size constraint');
    assert.ok(content.includes('Layer Boundaries'), 'must contain layer boundaries');
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

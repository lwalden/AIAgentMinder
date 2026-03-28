import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  parseProjectIdentity,
  discoverRules,
  discoverCommands,
  generateAgentsMd,
  writeAgentsMd,
} from '../lib/agents-md.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-agents-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Set up a temp dir with a configured CLAUDE.md (identity filled in).
 */
function setupProjectDir() {
  const dir = makeTempDir();
  // Copy core structure
  const claudeMd = `# CLAUDE.md - Project Instructions

## Project Identity

**Project:** my-web-app
**Description:** A task management web application
**Type:** web-app
**Stack:** TypeScript / React / PostgreSQL

**Developer Profile:**

- Senior developer, 10 years experience
- medium autonomy
`;
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), claudeMd);

  // Create some rules
  fs.mkdirSync(path.join(dir, '.claude', 'rules'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.claude', 'rules', 'git-workflow.md'),
    '# Git Workflow Rules\n# AIAgentMinder-managed.\n\n## Commit Discipline\n\n- Never commit directly to main.\n'
  );
  fs.writeFileSync(
    path.join(dir, '.claude', 'rules', 'code-quality.md'),
    '# Code Quality Guidance\n# AIAgentMinder-managed.\n\n## Development Discipline\n\n**TDD cycle:** Write a failing test first.\n'
  );
  fs.writeFileSync(
    path.join(dir, '.claude', 'rules', 'README.md'),
    '# Rules README\n'
  );

  // Create some commands
  fs.mkdirSync(path.join(dir, '.claude', 'commands'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.claude', 'commands', 'aam-brief.md'),
    '# /aam-brief - Product Brief\n\nCreates a product brief.\n'
  );
  fs.writeFileSync(
    path.join(dir, '.claude', 'commands', 'aam-tdd.md'),
    '# /aam-tdd - TDD Workflow\n\nGuided TDD workflow.\n'
  );

  return dir;
}

describe('parseProjectIdentity', () => {
  it('extracts project name, description, type, and stack from configured CLAUDE.md', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), `
**Project:** my-app
**Description:** A REST API for widgets
**Type:** api
**Stack:** Go / PostgreSQL / Redis
`);

    const identity = parseProjectIdentity(dir);
    assert.equal(identity.name, 'my-app');
    assert.equal(identity.description, 'A REST API for widgets');
    assert.equal(identity.type, 'api');
    assert.equal(identity.stack, 'Go / PostgreSQL / Redis');

    cleanTempDir(dir);
  });

  it('returns null values for unconfigured placeholders', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), `
**Project:** [Project Name]
**Description:** [Brief description]
**Type:** [web-app | api | cli-tool | library | mobile-app | other]
**Stack:** [Language / Framework / Database / etc.]
`);

    const identity = parseProjectIdentity(dir);
    assert.equal(identity.name, null);
    assert.equal(identity.description, null);
    assert.equal(identity.type, null);
    assert.equal(identity.stack, null);

    cleanTempDir(dir);
  });

  it('returns empty identity when CLAUDE.md does not exist', () => {
    const dir = makeTempDir();
    const identity = parseProjectIdentity(dir);
    assert.equal(identity.name, null);
    assert.equal(identity.description, null);
    cleanTempDir(dir);
  });
});

describe('discoverRules', () => {
  let dir;

  beforeEach(() => {
    dir = setupProjectDir();
  });

  afterEach(() => {
    cleanTempDir(dir);
  });

  it('returns an array of rule objects', () => {
    const rules = discoverRules(dir);
    assert.ok(Array.isArray(rules));
    assert.ok(rules.length > 0);
  });

  it('extracts rule filename and first heading as title', () => {
    const rules = discoverRules(dir);
    const gitRule = rules.find(r => r.file === 'git-workflow.md');
    assert.ok(gitRule);
    assert.equal(gitRule.title, 'Git Workflow Rules');
  });

  it('excludes README.md from rules list', () => {
    const rules = discoverRules(dir);
    const readme = rules.find(r => r.file === 'README.md');
    assert.equal(readme, undefined);
  });

  it('returns empty array when rules directory does not exist', () => {
    const emptyDir = makeTempDir();
    const rules = discoverRules(emptyDir);
    assert.deepEqual(rules, []);
    cleanTempDir(emptyDir);
  });
});

describe('discoverCommands', () => {
  let dir;

  beforeEach(() => {
    dir = setupProjectDir();
  });

  afterEach(() => {
    cleanTempDir(dir);
  });

  it('returns an array of command objects', () => {
    const cmds = discoverCommands(dir);
    assert.ok(Array.isArray(cmds));
    assert.ok(cmds.length > 0);
  });

  it('extracts command name from filename and description from first heading', () => {
    const cmds = discoverCommands(dir);
    const brief = cmds.find(c => c.name === '/aam-brief');
    assert.ok(brief);
    assert.equal(brief.title, 'Product Brief');
  });

  it('returns empty array when commands directory does not exist', () => {
    const emptyDir = makeTempDir();
    const cmds = discoverCommands(emptyDir);
    assert.deepEqual(cmds, []);
    cleanTempDir(emptyDir);
  });
});

describe('generateAgentsMd', () => {
  let dir;

  beforeEach(() => {
    dir = setupProjectDir();
  });

  afterEach(() => {
    cleanTempDir(dir);
  });

  it('generates valid markdown content', () => {
    const content = generateAgentsMd(dir);
    assert.ok(typeof content === 'string');
    assert.ok(content.length > 0);
    assert.ok(content.startsWith('# AGENTS.md'));
  });

  it('includes project identity when configured', () => {
    const content = generateAgentsMd(dir);
    assert.ok(content.includes('my-web-app'));
    assert.ok(content.includes('A task management web application'));
    assert.ok(content.includes('TypeScript / React / PostgreSQL'));
  });

  it('includes discovered rules', () => {
    const content = generateAgentsMd(dir);
    assert.ok(content.includes('git-workflow.md'));
    assert.ok(content.includes('code-quality.md'));
  });

  it('includes discovered commands', () => {
    const content = generateAgentsMd(dir);
    assert.ok(content.includes('/aam-brief'));
    assert.ok(content.includes('/aam-tdd'));
  });

  it('includes AIAgentMinder attribution', () => {
    const content = generateAgentsMd(dir);
    assert.ok(content.includes('AIAgentMinder'));
  });

  it('works with unconfigured project (placeholders)', () => {
    const emptyDir = makeTempDir();
    fs.writeFileSync(path.join(emptyDir, 'CLAUDE.md'), `
**Project:** [Project Name]
**Description:** [Brief description]
`);
    const content = generateAgentsMd(emptyDir);
    assert.ok(content.startsWith('# AGENTS.md'));
    assert.ok(!content.includes('[Project Name]'));
    cleanTempDir(emptyDir);
  });

  it('works with no CLAUDE.md at all', () => {
    const emptyDir = makeTempDir();
    const content = generateAgentsMd(emptyDir);
    assert.ok(content.startsWith('# AGENTS.md'));
    cleanTempDir(emptyDir);
  });
});

describe('writeAgentsMd', () => {
  let dir;

  beforeEach(() => {
    dir = setupProjectDir();
  });

  afterEach(() => {
    cleanTempDir(dir);
  });

  it('writes AGENTS.md to the target directory', () => {
    const result = writeAgentsMd(dir);
    assert.equal(result.status, 'created');
    assert.ok(fs.existsSync(path.join(dir, 'AGENTS.md')));

    const content = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf-8');
    assert.ok(content.startsWith('# AGENTS.md'));
  });

  it('returns skipped when AGENTS.md already exists and force is false', () => {
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'existing content');
    const result = writeAgentsMd(dir);
    assert.equal(result.status, 'skipped');

    const content = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf-8');
    assert.equal(content, 'existing content');
  });

  it('overwrites when force is true', () => {
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'old content');
    const result = writeAgentsMd(dir, { force: true });
    assert.equal(result.status, 'created');

    const content = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf-8');
    assert.ok(content.startsWith('# AGENTS.md'));
    assert.ok(content !== 'old content');
  });
});

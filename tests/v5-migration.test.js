import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { MIGRATIONS, getMigrations } from '../lib/migrations.js';
import { getCoreFiles } from '../lib/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

// New agent files added in v5.0
const V5_AGENTS = [
  '.claude/agents/sprint-master.md',
  '.claude/agents/sprint-planner.md',
  '.claude/agents/sprint-speccer.md',
  '.claude/agents/item-executor.md',
  '.claude/agents/quality-reviewer.md',
  '.claude/agents/pr-pipeliner.md',
  '.claude/agents/sprint-retro.md',
];

const V5_SCRIPTS = [
  '.claude/scripts/sprint-metrics.sh',
];

describe('v4.2→v5.0 migration', () => {
  it('v5.0 migration is registered in migrations.js', () => {
    const v5 = MIGRATIONS.find(m => m.version === '5.0.0');
    assert.ok(v5, 'v5.0.0 migration must exist');
  });

  it('migration deletes sprint-executor.md', () => {
    const v5 = MIGRATIONS.find(m => m.version === '5.0.0');
    const deletesExecutor = v5.delete.some(f => f.includes('sprint-executor'));
    assert.ok(deletesExecutor, 'must delete sprint-executor.md (replaced by sprint-master)');
  });

  it('getMigrations from 4.2.0 to 5.0.0 includes v5 migration', () => {
    const migrations = getMigrations('4.2.0', '5.0.0');
    assert.ok(migrations.length >= 1);
    const v5 = migrations.find(m => m.version === '5.0.0');
    assert.ok(v5, 'v5.0.0 migration must be included');
  });
});

describe('sync includes new v5.0 files', () => {
  it('new agent files are in getCoreFiles manifest', () => {
    const coreFiles = getCoreFiles();
    for (const agent of V5_AGENTS) {
      assert.ok(
        coreFiles.includes(agent),
        `${agent} must be in getCoreFiles()`
      );
    }
  });

  it('new script files are in getCoreFiles manifest', () => {
    const coreFiles = getCoreFiles();
    for (const script of V5_SCRIPTS) {
      assert.ok(
        coreFiles.includes(script),
        `${script} must be in getCoreFiles()`
      );
    }
  });

  it('new agent files exist in template directory', () => {
    for (const agent of V5_AGENTS) {
      const fullPath = path.join(TEMPLATE_DIR, agent);
      assert.ok(
        fs.existsSync(fullPath),
        `${agent} must exist in project/`
      );
    }
  });

  it('sprint-executor.md does not exist (replaced by sprint-master)', () => {
    const fullPath = path.join(TEMPLATE_DIR, '.claude/agents/sprint-executor.md');
    assert.ok(!fs.existsSync(fullPath), 'sprint-executor.md must not exist — use sprint-master');
  });

  it('init includes new agents in fresh installation', () => {
    const coreFiles = getCoreFiles();
    // All v5 agents should be core files (installed on fresh init)
    for (const agent of V5_AGENTS) {
      assert.ok(
        coreFiles.includes(agent),
        `fresh install must include ${agent}`
      );
    }
  });
});

describe('sync --dry-run shows new v5.0 files', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aam-v5migration-'));
    // Simulate a v4.2 installation: copy existing agents + rules but not new v5 agents
    const dirs = ['.claude/agents', '.claude/rules', '.claude/scripts', '.claude/skills'];
    for (const d of dirs) {
      fs.mkdirSync(path.join(tmpDir, d), { recursive: true });
    }
    // Copy a CLAUDE.md with v4.2 stamp
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), `# CLAUDE.md
**Project:** test-project
<!-- aam-version: 4.2.0 -->
`);
    // Copy existing v4.2 agents (not new v5 ones)
    const v42Agents = ['dev.md', 'debug.md', 'hotfix.md', 'qa.md',
      'security-reviewer.md', 'performance-reviewer.md', 'api-reviewer.md',
      'cost-reviewer.md', 'ux-reviewer.md'];
    for (const a of v42Agents) {
      const src = path.join(TEMPLATE_DIR, '.claude/agents', a);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(tmpDir, '.claude/agents', a));
      }
    }
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('dry-run output includes new agent files', () => {
    const cliPath = path.resolve(__dirname, '..', 'bin', 'aam.js');
    let output;
    try {
      output = execSync(`node "${cliPath}" sync --dry-run --target "${tmpDir}"`, {
        encoding: 'utf-8',
        timeout: 10000,
      });
    } catch (e) {
      output = e.stdout || '';
    }
    // Should show the new agents as additions
    for (const agent of V5_AGENTS) {
      const basename = path.basename(agent);
      assert.ok(
        output.includes(basename) || output.includes(agent),
        `dry-run output must mention ${basename}`
      );
    }
  });
});

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { computeSyncPlan, classifyFile } from '../lib/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(REPO_ROOT, 'project');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-sync-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('classifyFile', () => {
  it('classifies scripts as aam-owned', () => {
    assert.equal(classifyFile('.claude/scripts/context-monitor.sh'), 'aam-owned');
  });

  it('classifies agents as aam-owned', () => {
    assert.equal(classifyFile('.claude/agents/dev.md'), 'aam-owned');
  });

  it('classifies universal rules as aam-owned', () => {
    assert.equal(classifyFile('.claude/rules/git-workflow.md'), 'aam-owned');
  });

  it('classifies skills as aam-owned', () => {
    assert.equal(classifyFile('.claude/skills/aam-handoff.md'), 'aam-owned');
  });

  it('classifies settings.json as aam-owned-merge', () => {
    assert.equal(classifyFile('.claude/settings.json'), 'aam-owned-merge');
  });

  it('classifies CLAUDE.md as hybrid', () => {
    assert.equal(classifyFile('CLAUDE.md'), 'hybrid');
  });

  it('classifies DECISIONS.md as user-owned', () => {
    assert.equal(classifyFile('DECISIONS.md'), 'user-owned');
  });

  it('classifies docs/strategy-roadmap.md as user-owned', () => {
    assert.equal(classifyFile('docs/strategy-roadmap.md'), 'user-owned');
  });

  it('classifies .gitignore as user-owned', () => {
    assert.equal(classifyFile('.gitignore'), 'user-owned');
  });

  it('classifies SPRINT.md as user-owned', () => {
    assert.equal(classifyFile('SPRINT.md'), 'user-owned');
  });

  it('classifies BACKLOG.md as user-owned', () => {
    assert.equal(classifyFile('BACKLOG.md'), 'user-owned');
  });

  it('classifies .pr-pipeline.json as user-owned', () => {
    assert.equal(classifyFile('.pr-pipeline.json'), 'user-owned');
  });

  it('classifies version stamp as aam-owned', () => {
    assert.equal(classifyFile('.claude/aiagentminder-version'), 'aam-owned');
  });
});

describe('computeSyncPlan', () => {
  it('returns adds for all aam-owned files when target is empty', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    // Should have adds for scripts, agents, rules, skills, version stamp
    assert.ok(plan.adds.length > 0, 'should have files to add');
    assert.ok(plan.adds.some(f => f.file === '.claude/scripts/context-monitor.sh'));
    assert.ok(plan.adds.some(f => f.file === '.claude/agents/dev.md'));
    assert.ok(plan.adds.some(f => f.file === '.claude/skills/aam-handoff.md'));

    cleanTempDir(dir);
  });

  it('returns updates for aam-owned files that already exist in target', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude', 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, '.claude', 'scripts', 'context-monitor.sh'), 'old content');
    fs.writeFileSync(path.join(dir, '.claude', 'rules', 'git-workflow.md'), 'old content');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.ok(plan.updates.some(f => f.file === '.claude/scripts/context-monitor.sh'));
    assert.ok(plan.updates.some(f => f.file === '.claude/rules/git-workflow.md'));

    cleanTempDir(dir);
  });

  it('does not include user-owned files in updates', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, 'DECISIONS.md'), 'user content');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.ok(!plan.updates.some(f => f.file === 'DECISIONS.md'));
    assert.ok(!plan.adds.some(f => f.file === 'DECISIONS.md'));

    cleanTempDir(dir);
  });

  it('includes user-owned files in adds when they do not exist', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    // DECISIONS.md should be offered as an add if missing
    assert.ok(plan.adds.some(f => f.file === 'DECISIONS.md'));

    cleanTempDir(dir);
  });

  it('marks CLAUDE.md as hybrid', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'existing user content');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.ok(plan.hybrid.some(f => f.file === 'CLAUDE.md'));
    assert.ok(!plan.adds.some(f => f.file === 'CLAUDE.md'));
    assert.ok(!plan.updates.some(f => f.file === 'CLAUDE.md'));

    cleanTempDir(dir);
  });

  it('marks settings.json as merge', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), '{}');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.ok(plan.merge.some(f => f.file === '.claude/settings.json'));

    cleanTempDir(dir);
  });

  it('reads installed version from target', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.equal(plan.installedVersion, '3.3.0');
    assert.ok(plan.templateVersion);

    cleanTempDir(dir);
  });

  it('handles missing version stamp', () => {
    const dir = makeTempDir();

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    assert.equal(plan.installedVersion, null);

    cleanTempDir(dir);
  });

  it('resolves SOURCE_OVERRIDES for settings.json.tpl', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'aiagentminder-version'), '3.3.0\n');

    const plan = computeSyncPlan(TEMPLATE_DIR, dir);

    // settings.json should appear in the plan (from settings.json.tpl source)
    const allFiles = [...plan.adds, ...plan.updates, ...plan.merge, ...plan.hybrid]
      .map(f => f.file);
    assert.ok(allFiles.includes('.claude/settings.json'),
      'settings.json should be in plan (sourced from settings.json.tpl)');

    cleanTempDir(dir);
  });
});

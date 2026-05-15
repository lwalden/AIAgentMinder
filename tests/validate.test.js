import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  validatePluginJson,
  validateVersionConsistency,
  validatePluginLayout,
  validateAll,
} from '../lib/validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-validate-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('validatePluginJson', () => {
  it('passes for a valid plugin.json', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      skills: './skills/',
    }));

    const result = validatePluginJson(dir);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    cleanTempDir(dir);
  });

  it('fails when plugin.json is missing', () => {
    const dir = makeTempDir();
    const result = validatePluginJson(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('not found')));
    cleanTempDir(dir);
  });

  it('fails when required fields are missing', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test',
    }));

    const result = validatePluginJson(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('version')));
    assert.ok(result.errors.some(e => e.includes('description')));
    cleanTempDir(dir);
  });

  it('fails when plugin.json is invalid JSON', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), 'not json');

    const result = validatePluginJson(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('parse')));
    cleanTempDir(dir);
  });
});

describe('validateVersionConsistency', () => {
  it('passes when plugin.json version matches template version', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test',
      version: '3.3.0',
      description: 'test',
    }));
    fs.mkdirSync(path.join(dir, 'templates', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'templates', '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '3.3.0' }));

    const result = validateVersionConsistency(dir);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    cleanTempDir(dir);
  });

  it('fails when versions are mismatched', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test',
      version: '2.0.0',
      description: 'test',
    }));
    fs.mkdirSync(path.join(dir, 'templates', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'templates', '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '3.3.0' }));

    const result = validateVersionConsistency(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('plugin.json') && e.includes('2.0.0')));

    cleanTempDir(dir);
  });

  it('fails when package.json version differs from template', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test',
      version: '3.3.0',
      description: 'test',
    }));
    fs.mkdirSync(path.join(dir, 'templates', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'templates', '.claude', 'aiagentminder-version'), '3.3.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));

    const result = validateVersionConsistency(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('package.json') && e.includes('1.0.0')));

    cleanTempDir(dir);
  });
});

describe('validatePluginLayout', () => {
  it('passes on the actual AIAgentMinder repo', () => {
    const result = validatePluginLayout(REPO_ROOT);
    assert.equal(result.valid, true, `layout errors: ${result.errors.join('\n')}`);
    assert.ok(result.summary.agents >= 15, `expected at least 15 agents, got ${result.summary.agents}`);
    assert.ok(result.summary.skills >= 14, `expected at least 14 skills, got ${result.summary.skills}`);
    assert.ok(result.summary.binScripts >= 15, `expected at least 15 bin scripts, got ${result.summary.binScripts}`);
    assert.ok(result.summary.hooksScripts >= 5, `expected at least 5 hook scripts referenced, got ${result.summary.hooksScripts}`);
  });

  it('flags a missing agents directory', () => {
    const dir = makeTempDir();
    try {
      // Build a minimal-but-broken plugin layout
      fs.mkdirSync(path.join(dir, 'skills'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'hooks'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'templates'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'hooks', 'hooks.json'), '{}');
      const result = validatePluginLayout(dir);
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('agents/')),
        `expected an agents/ error, got: ${result.errors.join(', ')}`);
    } finally {
      cleanTempDir(dir);
    }
  });

  it('flags a non-executable shell script in bin/', () => {
    const dir = makeTempDir();
    try {
      fs.mkdirSync(path.join(dir, 'agents'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'agents', 'foo.md'), '---\nname: foo\n---\n');
      fs.mkdirSync(path.join(dir, 'skills', 'foo'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'skills', 'foo', 'SKILL.md'), '---\ndescription: x\n---\n');
      fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
      const scriptPath = path.join(dir, 'bin', 'notexec.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho hi\n', { mode: 0o644 });
      fs.mkdirSync(path.join(dir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'hooks', 'hooks.json'), '{}');
      fs.mkdirSync(path.join(dir, 'templates'), { recursive: true });
      const result = validatePluginLayout(dir);
      assert.ok(result.errors.some(e => e.includes('notexec.sh') && e.includes('not executable')),
        `expected non-executable error, got: ${result.errors.join(', ')}`);
    } finally {
      cleanTempDir(dir);
    }
  });

  it('flags hooks.json referencing a missing script', () => {
    const dir = makeTempDir();
    try {
      fs.mkdirSync(path.join(dir, 'agents'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'agents', 'foo.md'), 'x');
      fs.mkdirSync(path.join(dir, 'skills'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'hooks', 'hooks.json'), JSON.stringify({
        hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/ghost.sh"' }] }] }
      }));
      fs.mkdirSync(path.join(dir, 'templates'), { recursive: true });
      const result = validatePluginLayout(dir);
      assert.ok(result.errors.some(e => e.includes('ghost.sh')),
        `expected missing-script error, got: ${result.errors.join(', ')}`);
    } finally {
      cleanTempDir(dir);
    }
  });
});

describe('validateAll', () => {
  it('validates the actual AIAgentMinder repo', () => {
    const result = validateAll(REPO_ROOT);
    assert.equal(result.pluginJson.valid, true, `plugin.json errors: ${result.pluginJson.errors.join(', ')}`);
    assert.equal(result.versions.valid, true, `version errors: ${result.versions.errors.join(', ')}`);
    assert.equal(result.layout.valid, true, `layout errors: ${result.layout.errors.join('\n')}`);
  });

  it('includes layout in the result', () => {
    const result = validateAll(REPO_ROOT);
    assert.ok(result.layout, 'validateAll must include layout');
    assert.ok(typeof result.layout.summary === 'object');
  });

  it('plugin.json does not reference component directories (auto-discovered)', () => {
    const pluginPath = path.join(REPO_ROOT, '.claude-plugin', 'plugin.json');
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    assert.equal(plugin.skills, undefined, 'plugin.json should not have a skills field — Claude Code auto-discovers');
    assert.equal(plugin.agents, undefined, 'plugin.json should not have an agents field — Claude Code auto-discovers');
    assert.equal(plugin.commands, undefined, 'plugin.json should not have a commands field — Claude Code auto-discovers');
    assert.equal(plugin.hooks, undefined, 'plugin.json should not have a hooks field — hooks/hooks.json holds the config');
  });
});

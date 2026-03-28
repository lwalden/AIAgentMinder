import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  validatePluginJson,
  validateSkillPackages,
  validateVersionConsistency,
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

describe('validateSkillPackages', () => {
  it('passes when all skill directories have SKILL.md', () => {
    const dir = makeTempDir();
    const skillsDir = path.join(dir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'aam-brief'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'aam-brief', 'SKILL.md'), '---\nname: aam-brief\n---\n');
    fs.mkdirSync(path.join(skillsDir, 'aam-tdd'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'aam-tdd', 'SKILL.md'), '---\nname: aam-tdd\n---\n');

    const result = validateSkillPackages(dir);
    assert.equal(result.valid, true);
    assert.equal(result.skillCount, 2);
    assert.equal(result.errors.length, 0);

    cleanTempDir(dir);
  });

  it('fails when a skill directory is missing SKILL.md', () => {
    const dir = makeTempDir();
    const skillsDir = path.join(dir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'aam-brief'), { recursive: true });
    // No SKILL.md

    const result = validateSkillPackages(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('aam-brief') && e.includes('SKILL.md')));

    cleanTempDir(dir);
  });

  it('fails when skills directory does not exist', () => {
    const dir = makeTempDir();
    const result = validateSkillPackages(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('skills/')));
    cleanTempDir(dir);
  });

  it('reports correct skill count', () => {
    const dir = makeTempDir();
    const skillsDir = path.join(dir, 'skills');
    for (const name of ['aam-a', 'aam-b', 'aam-c']) {
      fs.mkdirSync(path.join(skillsDir, name), { recursive: true });
      fs.writeFileSync(path.join(skillsDir, name, 'SKILL.md'), `---\nname: ${name}\n---\n`);
    }

    const result = validateSkillPackages(dir);
    assert.equal(result.skillCount, 3);
    cleanTempDir(dir);
  });
});

describe('validateVersionConsistency', () => {
  it('passes when plugin.json version matches template version', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'test',
      version: '3.2.0',
      description: 'test',
    }));
    fs.mkdirSync(path.join(dir, 'project', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'project', '.claude', 'aiagentminder-version'), '3.2.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '3.2.0' }));

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
    fs.mkdirSync(path.join(dir, 'project', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'project', '.claude', 'aiagentminder-version'), '3.2.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '3.2.0' }));

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
      version: '3.2.0',
      description: 'test',
    }));
    fs.mkdirSync(path.join(dir, 'project', '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'project', '.claude', 'aiagentminder-version'), '3.2.0\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));

    const result = validateVersionConsistency(dir);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('package.json') && e.includes('1.0.0')));

    cleanTempDir(dir);
  });
});

describe('validateAll', () => {
  it('validates the actual AIAgentMinder repo', () => {
    const result = validateAll(REPO_ROOT);
    // This test validates the real repo — all checks should pass
    assert.equal(result.pluginJson.valid, true, `plugin.json errors: ${result.pluginJson.errors.join(', ')}`);
    assert.equal(result.skills.valid, true, `skills errors: ${result.skills.errors.join(', ')}`);
    assert.equal(result.versions.valid, true, `version errors: ${result.versions.errors.join(', ')}`);
    assert.equal(result.skills.skillCount, 13, 'should have 13 skill packages');
  });
});

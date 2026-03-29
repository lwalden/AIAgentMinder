import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'project', '.claude', 'scripts', 'version-bump.sh');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-vbump-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function run(args, cwd) {
  return execFileSync('bash', [SCRIPT, ...args], {
    encoding: 'utf-8',
    cwd,
    env: { ...process.env },
  });
}

/** Scaffold the 4 version files in a temp directory matching repo layout. */
function scaffoldVersionFiles(dir, version = '3.3.0') {
  // project/.claude/aiagentminder-version
  const templateDir = path.join(dir, 'project', '.claude');
  fs.mkdirSync(templateDir, { recursive: true });
  fs.writeFileSync(path.join(templateDir, 'aiagentminder-version'), version + '\n');

  // package.json
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'aiagentminder',
    version,
    description: 'test',
  }, null, 2) + '\n');

  // .claude-plugin/plugin.json
  const pluginDir = path.join(dir, '.claude-plugin');
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify({
    name: 'aiagentminder',
    version,
    description: 'test',
  }, null, 2) + '\n');

  // .claude-plugin/marketplace.json
  fs.writeFileSync(path.join(pluginDir, 'marketplace.json'), JSON.stringify({
    plugins: [{
      name: 'aiagentminder',
      version,
      description: 'test',
    }],
  }, null, 2) + '\n');
}

describe('version-bump.sh: updates all version points', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    scaffoldVersionFiles(dir, '3.3.0');
  });

  afterEach(() => { cleanTempDir(dir); });

  it('updates aiagentminder-version file', () => {
    run(['3.4.0'], dir);
    const content = fs.readFileSync(path.join(dir, 'project', '.claude', 'aiagentminder-version'), 'utf-8');
    assert.equal(content.trim(), '3.4.0');
  });

  it('updates package.json version', () => {
    run(['3.4.0'], dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
    assert.equal(pkg.version, '3.4.0');
  });

  it('updates plugin.json version', () => {
    run(['3.4.0'], dir);
    const plugin = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), 'utf-8'));
    assert.equal(plugin.version, '3.4.0');
  });

  it('updates marketplace.json version', () => {
    run(['3.4.0'], dir);
    const mp = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin', 'marketplace.json'), 'utf-8'));
    assert.equal(mp.plugins[0].version, '3.4.0');
  });

  it('preserves other fields in package.json', () => {
    run(['3.4.0'], dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
    assert.equal(pkg.name, 'aiagentminder');
    assert.equal(pkg.description, 'test');
  });

  it('preserves other fields in plugin.json', () => {
    run(['3.4.0'], dir);
    const plugin = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), 'utf-8'));
    assert.equal(plugin.name, 'aiagentminder');
    assert.equal(plugin.description, 'test');
  });
});

describe('version-bump.sh: validation', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    scaffoldVersionFiles(dir, '3.3.0');
  });

  afterEach(() => { cleanTempDir(dir); });

  it('rejects missing version argument', () => {
    assert.throws(() => {
      run([], dir);
    }, /usage/i);
  });

  it('rejects invalid semver format', () => {
    assert.throws(() => {
      run(['not-a-version'], dir);
    }, /invalid.*version|semver/i);
  });

  it('rejects partial semver (missing patch)', () => {
    assert.throws(() => {
      run(['3.4'], dir);
    }, /invalid.*version|semver/i);
  });

  it('exits non-zero when aiagentminder-version file is missing', () => {
    fs.unlinkSync(path.join(dir, 'project', '.claude', 'aiagentminder-version'));
    assert.throws(() => {
      run(['3.4.0'], dir);
    }, /not found/i);
  });

  it('exits non-zero when package.json is missing', () => {
    fs.unlinkSync(path.join(dir, 'package.json'));
    assert.throws(() => {
      run(['3.4.0'], dir);
    }, /not found/i);
  });
});

describe('version-bump.sh: output', () => {
  let dir;

  beforeEach(() => {
    dir = makeTempDir();
    scaffoldVersionFiles(dir, '3.3.0');
  });

  afterEach(() => { cleanTempDir(dir); });

  it('is silent on success (no stdout)', () => {
    const output = run(['3.4.0'], dir);
    assert.equal(output.trim(), '');
  });
});

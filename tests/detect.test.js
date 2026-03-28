import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  detectLanguage,
  detectFramework,
  detectTestRunner,
  detectCI,
  detectLintConfig,
  fingerprint,
} from '../lib/detect.js';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aam-detect-'));
}

function cleanTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('detectLanguage', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('detects JavaScript/TypeScript from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    const result = detectLanguage(dir);
    assert.equal(result, 'JavaScript');
  });

  it('detects TypeScript when tsconfig.json is present', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}');
    const result = detectLanguage(dir);
    assert.equal(result, 'TypeScript');
  });

  it('detects Python from requirements.txt', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'flask\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Python');
  });

  it('detects Python from pyproject.toml', () => {
    fs.writeFileSync(path.join(dir, 'pyproject.toml'), '[project]\nname = "foo"\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Python');
  });

  it('detects Go from go.mod', () => {
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module example.com/foo\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Go');
  });

  it('detects Rust from Cargo.toml', () => {
    fs.writeFileSync(path.join(dir, 'Cargo.toml'), '[package]\nname = "foo"\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Rust');
  });

  it('detects C# from .csproj file', () => {
    fs.writeFileSync(path.join(dir, 'MyApp.csproj'), '<Project />\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'C#');
  });

  it('detects Java from pom.xml', () => {
    fs.writeFileSync(path.join(dir, 'pom.xml'), '<project />\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Java');
  });

  it('detects Java from build.gradle', () => {
    fs.writeFileSync(path.join(dir, 'build.gradle'), 'plugins {}\n');
    const result = detectLanguage(dir);
    assert.equal(result, 'Java');
  });

  it('returns null when no language markers found', () => {
    const result = detectLanguage(dir);
    assert.equal(result, null);
  });
});

describe('detectFramework', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('detects React from package.json dependencies', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, 'React');
  });

  it('detects Next.js from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { next: '^14.0.0', react: '^18.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, 'Next.js');
  });

  it('detects Vue from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { vue: '^3.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, 'Vue');
  });

  it('detects Express from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { express: '^4.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, 'Express');
  });

  it('detects FastAPI from requirements.txt', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'fastapi\nuvicorn\n');
    const result = detectFramework(dir);
    assert.equal(result, 'FastAPI');
  });

  it('detects Django from requirements.txt', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'django>=4.0\n');
    const result = detectFramework(dir);
    assert.equal(result, 'Django');
  });

  it('detects Flask from requirements.txt', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'flask\n');
    const result = detectFramework(dir);
    assert.equal(result, 'Flask');
  });

  it('checks devDependencies too', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { svelte: '^4.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, 'Svelte');
  });

  it('returns null when no framework detected', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { lodash: '^4.0.0' },
    }));
    const result = detectFramework(dir);
    assert.equal(result, null);
  });

  it('returns null when no manifest exists', () => {
    const result = detectFramework(dir);
    assert.equal(result, null);
  });
});

describe('detectTestRunner', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('detects Jest from package.json devDependencies', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { jest: '^29.0.0' },
    }));
    const result = detectTestRunner(dir);
    assert.equal(result, 'Jest');
  });

  it('detects Vitest from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { vitest: '^1.0.0' },
    }));
    const result = detectTestRunner(dir);
    assert.equal(result, 'Vitest');
  });

  it('detects pytest from requirements.txt', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'pytest\n');
    const result = detectTestRunner(dir);
    assert.equal(result, 'pytest');
  });

  it('detects pytest from pyproject.toml tool section', () => {
    fs.writeFileSync(path.join(dir, 'pyproject.toml'), '[tool.pytest]\n');
    const result = detectTestRunner(dir);
    assert.equal(result, 'pytest');
  });

  it('detects Go test from go.mod', () => {
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module example.com/foo\n');
    const result = detectTestRunner(dir);
    assert.equal(result, 'go test');
  });

  it('detects Mocha from package.json', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      devDependencies: { mocha: '^10.0.0' },
    }));
    const result = detectTestRunner(dir);
    assert.equal(result, 'Mocha');
  });

  it('returns Node built-in test runner when no test framework but package.json exists', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { express: '^4.0.0' },
    }));
    const result = detectTestRunner(dir);
    assert.equal(result, null);
  });

  it('returns null when no markers found', () => {
    const result = detectTestRunner(dir);
    assert.equal(result, null);
  });
});

describe('detectCI', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('detects GitHub Actions from .github/workflows/', () => {
    fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
    const result = detectCI(dir);
    assert.equal(result, 'GitHub Actions');
  });

  it('detects GitLab CI from .gitlab-ci.yml', () => {
    fs.writeFileSync(path.join(dir, '.gitlab-ci.yml'), 'stages:\n');
    const result = detectCI(dir);
    assert.equal(result, 'GitLab CI');
  });

  it('detects CircleCI from .circleci/', () => {
    fs.mkdirSync(path.join(dir, '.circleci'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.circleci', 'config.yml'), 'version: 2.1\n');
    const result = detectCI(dir);
    assert.equal(result, 'CircleCI');
  });

  it('returns null when no CI detected', () => {
    const result = detectCI(dir);
    assert.equal(result, null);
  });
});

describe('detectLintConfig', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('detects ESLint from config file', () => {
    fs.writeFileSync(path.join(dir, '.eslintrc.json'), '{}');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('ESLint'));
  });

  it('detects ESLint from eslint.config.js', () => {
    fs.writeFileSync(path.join(dir, 'eslint.config.js'), 'export default [];');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('ESLint'));
  });

  it('detects Prettier', () => {
    fs.writeFileSync(path.join(dir, '.prettierrc'), '{}');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('Prettier'));
  });

  it('detects Biome', () => {
    fs.writeFileSync(path.join(dir, 'biome.json'), '{}');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('Biome'));
  });

  it('detects Ruff from ruff.toml', () => {
    fs.writeFileSync(path.join(dir, 'ruff.toml'), '[lint]\n');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('Ruff'));
  });

  it('detects multiple tools', () => {
    fs.writeFileSync(path.join(dir, '.eslintrc.json'), '{}');
    fs.writeFileSync(path.join(dir, '.prettierrc'), '{}');
    const result = detectLintConfig(dir);
    assert.ok(result.includes('ESLint'));
    assert.ok(result.includes('Prettier'));
    assert.equal(result.length, 2);
  });

  it('returns empty array when no lint config found', () => {
    const result = detectLintConfig(dir);
    assert.deepEqual(result, []);
  });
});

describe('fingerprint', () => {
  let dir;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { cleanTempDir(dir); });

  it('returns a complete fingerprint object', () => {
    const result = fingerprint(dir);
    assert.ok('language' in result);
    assert.ok('framework' in result);
    assert.ok('testRunner' in result);
    assert.ok('ci' in result);
    assert.ok('lintTools' in result);
    assert.ok('stack' in result);
    assert.ok('type' in result);
  });

  it('builds a stack string from detected components', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}');
    const result = fingerprint(dir);
    assert.ok(result.stack.includes('TypeScript'));
    assert.ok(result.stack.includes('React'));
  });

  it('suggests web-app type for frontend frameworks', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));
    const result = fingerprint(dir);
    assert.equal(result.type, 'web-app');
  });

  it('suggests api type for backend frameworks', () => {
    fs.writeFileSync(path.join(dir, 'requirements.txt'), 'fastapi\n');
    const result = fingerprint(dir);
    assert.equal(result.type, 'api');
  });

  it('suggests library type for packages with no framework', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      dependencies: { lodash: '^4.0.0' },
    }));
    const result = fingerprint(dir);
    assert.equal(result.type, 'library');
  });

  it('returns null type when nothing detected', () => {
    const result = fingerprint(dir);
    assert.equal(result.type, null);
  });

  it('returns all nulls for empty directory', () => {
    const result = fingerprint(dir);
    assert.equal(result.language, null);
    assert.equal(result.framework, null);
    assert.equal(result.testRunner, null);
    assert.equal(result.ci, null);
    assert.deepEqual(result.lintTools, []);
    assert.equal(result.stack, null);
    assert.equal(result.type, null);
  });
});

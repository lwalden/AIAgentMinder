import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCoreFiles } from '../lib/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, '..', 'project', '.claude', 'agents');

const REVIEWER_AGENTS = [
  { file: 'security-reviewer.md', keywords: ['injection', 'auth', 'secrets'] },
  { file: 'performance-reviewer.md', keywords: ['N+1', 'unbounded', 'blocking'] },
  { file: 'api-reviewer.md', keywords: ['endpoint', 'status code', 'breaking change'] },
  { file: 'cost-reviewer.md', keywords: ['retry', 'paid', 'circuit breaker'] },
  { file: 'ux-reviewer.md', keywords: ['error message', 'feedback', 'discoverability'] },
];

describe('review lens agents: file existence', () => {
  for (const { file } of REVIEWER_AGENTS) {
    it(`${file} exists in project/.claude/agents/`, () => {
      assert.ok(fs.existsSync(path.join(AGENTS_DIR, file)), `${file} not found`);
    });
  }
});

describe('review lens agents: frontmatter', () => {
  for (const { file } of REVIEWER_AGENTS) {
    it(`${file} has disallowedTools containing Edit and Write`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      assert.ok(content.startsWith('---'), `${file} must start with frontmatter`);
      const endIdx = content.indexOf('---', 3);
      const frontmatter = content.slice(3, endIdx);
      assert.ok(frontmatter.includes('Edit'), `${file} must disallow Edit`);
      assert.ok(frontmatter.includes('Write'), `${file} must disallow Write`);
    });
  }
});

describe('review lens agents: domain content', () => {
  for (const { file, keywords } of REVIEWER_AGENTS) {
    it(`${file} contains domain-specific keywords`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8').toLowerCase();
      for (const kw of keywords) {
        assert.ok(content.includes(kw.toLowerCase()), `${file} must contain "${kw}"`);
      }
    });
  }
});

describe('review lens agents: no diff placeholder', () => {
  for (const { file } of REVIEWER_AGENTS) {
    it(`${file} does not contain [paste diff here]`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      assert.ok(!content.includes('[paste diff here]'), `${file} must not contain diff placeholder`);
    });
  }
});

describe('review lens agents: in getCoreFiles()', () => {
  it('all 5 reviewer agents are in the core file list', () => {
    const files = getCoreFiles();
    for (const { file } of REVIEWER_AGENTS) {
      assert.ok(files.includes(`.claude/agents/${file}`), `${file} must be in getCoreFiles()`);
    }
  });
});

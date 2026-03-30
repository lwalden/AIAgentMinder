import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..', 'project');

describe('BACKLOG.md template', () => {
  const filePath = path.join(PROJECT_DIR, 'BACKLOG.md');

  it('exists in project/', () => {
    assert.ok(fs.existsSync(filePath), 'BACKLOG.md not found in project/');
  });

  it('contains the expected table header', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('| ID | Type | Title | Source | Added |'), 'must contain table header');
    assert.ok(content.includes('|---|---|---|---|---|'), 'must contain table separator');
  });

  it('contains no data rows (template is empty)', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(!content.includes('| B-'), 'template must not contain data rows');
  });
});

describe('/aam-backlog skill', () => {
  const filePath = path.join(PROJECT_DIR, '.claude', 'skills', 'aam-backlog.md');

  it('exists in project/.claude/skills/', () => {
    assert.ok(fs.existsSync(filePath), 'aam-backlog.md not found');
  });

  it('has valid frontmatter with user-invocable: true', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.startsWith('---'), 'must start with frontmatter');
    assert.ok(content.includes('user-invocable: true'), 'must be user-invocable');
  });

  it('references backlog-capture.sh for file I/O', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('backlog-capture.sh'), 'must reference the script');
  });

  it('does not reference Read or Edit on BACKLOG.md', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Should not instruct to read or edit BACKLOG.md directly
    assert.ok(!content.includes('Read BACKLOG.md'), 'must not instruct to Read BACKLOG.md');
    assert.ok(!content.includes('Edit BACKLOG.md'), 'must not instruct to Edit BACKLOG.md');
  });

  it('contains all three mode keywords', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('capture') || content.includes('Capture'), 'must contain capture mode');
    assert.ok(content.includes('review') || content.includes('Review'), 'must contain review mode');
    assert.ok(content.includes('promote') || content.includes('Promote'), 'must contain promote mode');
  });
});

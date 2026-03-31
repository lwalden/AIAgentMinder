import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCoreFiles, getOptionalFiles, getTemplateDir } from '../lib/init.js';
import { classifyFile } from '../lib/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '..', 'project');

/**
 * Walk a directory recursively and return relative file paths.
 */
function walkDir(dir, prefix = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

// Map source filenames to target filenames (settings.json.tpl → settings.json)
const SOURCE_TO_TARGET = {
  '.claude/settings.json.tpl': '.claude/settings.json',
};

describe('manifest consistency', () => {
  it('getCoreFiles + getOptionalFiles covers all template files', () => {
    const templateFiles = walkDir(TEMPLATE_DIR)
      .map(f => SOURCE_TO_TARGET[f] || f);

    const coreFiles = new Set(getCoreFiles());
    const optionalFiles = new Set(Object.values(getOptionalFiles()).flat());
    const allListed = new Set([...coreFiles, ...optionalFiles]);

    const missing = templateFiles.filter(f => !allListed.has(f));
    assert.deepEqual(missing, [],
      `Template files not in getCoreFiles() or getOptionalFiles(): ${missing.join(', ')}`);
  });

  it('getCoreFiles does not list files that do not exist in template', () => {
    const templateFiles = new Set(
      walkDir(TEMPLATE_DIR).map(f => SOURCE_TO_TARGET[f] || f)
    );

    const phantom = getCoreFiles().filter(f => !templateFiles.has(f));
    assert.deepEqual(phantom, [],
      `getCoreFiles() lists files not in template: ${phantom.join(', ')}`);
  });

  it('getOptionalFiles does not list files that do not exist in template', () => {
    const templateFiles = new Set(
      walkDir(TEMPLATE_DIR).map(f => SOURCE_TO_TARGET[f] || f)
    );

    const allOptional = Object.values(getOptionalFiles()).flat();
    const phantom = allOptional.filter(f => !templateFiles.has(f));
    assert.deepEqual(phantom, [],
      `getOptionalFiles() lists files not in template: ${phantom.join(', ')}`);
  });

  it('classifyFile agrees with getCoreFiles on ownership', () => {
    // All core files that are under .claude/ should be aam-owned or aam-owned-merge
    const coreFiles = getCoreFiles();
    for (const f of coreFiles) {
      const classification = classifyFile(f);
      if (f.startsWith('.claude/')) {
        assert.ok(
          classification === 'aam-owned' || classification === 'aam-owned-merge',
          `${f} is in getCoreFiles() but classifyFile returns '${classification}'`
        );
      }
    }
  });
});

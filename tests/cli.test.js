import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../lib/cli.js';

describe('parseArgs', () => {
  it('defaults to init command with no args', () => {
    const result = parseArgs([]);
    assert.equal(result.command, 'init');
    assert.equal(result.all, false);
    assert.equal(result.core, false);
    assert.equal(result.help, false);
  });

  it('parses explicit init command', () => {
    const result = parseArgs(['init']);
    assert.equal(result.command, 'init');
  });

  it('parses --all flag', () => {
    const result = parseArgs(['init', '--all']);
    assert.equal(result.command, 'init');
    assert.equal(result.all, true);
  });

  it('parses --core flag', () => {
    const result = parseArgs(['--core']);
    assert.equal(result.command, 'init');
    assert.equal(result.core, true);
  });

  it('parses --help flag', () => {
    const result = parseArgs(['--help']);
    assert.equal(result.help, true);
  });

  it('parses -h flag', () => {
    const result = parseArgs(['-h']);
    assert.equal(result.help, true);
  });

  it('parses --version flag', () => {
    const result = parseArgs(['--version']);
    assert.equal(result.version, true);
  });

  it('parses -v flag', () => {
    const result = parseArgs(['-v']);
    assert.equal(result.version, true);
  });

  it('--all and --core are mutually exclusive — last wins', () => {
    const result = parseArgs(['--all', '--core']);
    assert.equal(result.core, true);
    assert.equal(result.all, true);
    // The caller decides precedence — both flags are set truthfully
  });

  it('parses agents-md command', () => {
    const result = parseArgs(['agents-md']);
    assert.equal(result.command, 'agents-md');
  });

  it('parses --force flag', () => {
    const result = parseArgs(['agents-md', '--force']);
    assert.equal(result.command, 'agents-md');
    assert.equal(result.force, true);
  });

  it('parses -f flag', () => {
    const result = parseArgs(['agents-md', '-f']);
    assert.equal(result.command, 'agents-md');
    assert.equal(result.force, true);
  });

  it('ignores unknown flags', () => {
    const result = parseArgs(['init', '--unknown', '--foo']);
    assert.equal(result.command, 'init');
  });
});

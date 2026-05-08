/**
 * S9-006: docs/ADR coverage tests for the revised context-cycling policy.
 *
 * Asserts that context-cycling.md and DECISIONS.md document the policy
 * shifts shipped in S9 (sprint gating, hysteresis, expanded allow-list,
 * resume-chain matchers). Catches the case where someone edits one file
 * but forgets the other, leaving a doc/code divergence.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const RULE = fs.readFileSync(
  path.join(ROOT, 'project', '.claude', 'rules', 'context-cycling.md'),
  'utf-8'
);
const DECISIONS = fs.readFileSync(path.join(ROOT, 'DECISIONS.md'), 'utf-8');

describe('context-cycling.md — revised policy coverage', () => {
  it('describes sprint gating (only fires when SPRINT.md status=in-progress)', () => {
    assert.match(RULE, /sprint/i);
    assert.match(RULE, /in-progress/);
  });

  it('describes the soft-advisory path for non-sprint sessions', () => {
    assert.match(RULE, /non-sprint|self-manage|soft advisory/i);
  });

  it('lists the four tools allowed during an active cycle', () => {
    for (const tool of ['Bash', 'Write', 'Read', 'Edit']) {
      assert.match(RULE, new RegExp(`\\b${tool}\\b`),
        `must mention ${tool} in allowed-tools section`);
    }
  });

  it('describes the SessionStart cycle reset', () => {
    assert.match(RULE, /session-start-cycle-reset|SessionStart cycle reset/i);
    assert.match(RULE, /\.context-usage|stale/i);
  });

  it('describes the warmup hysteresis (session_floor / delta-based threshold)', () => {
    assert.match(RULE, /session_floor|delta|relative/i);
  });

  it('describes the resume chain firing on both startup and resume matchers', () => {
    assert.match(RULE, /startup/);
    assert.match(RULE, /resume/);
    assert.match(RULE, /--continue|claude --continue/);
  });

  it('still tells users to commit + /exit when blocked (procedure unchanged)', () => {
    assert.match(RULE, /commit/i);
    assert.match(RULE, /\/exit/);
  });
});

describe('DECISIONS.md — S9 ADR present', () => {
  it('contains a heading for the revised cycling policy', () => {
    assert.match(
      DECISIONS,
      /### Context cycling: sprint-gated with session-relative thresholds/
    );
  });

  it('the ADR is dated 2026-05 (S9 ship date)', () => {
    const adrSection = DECISIONS.split(
      /### Context cycling: sprint-gated with session-relative thresholds[^\n]*/
    )[1] || '';
    const headerLine = DECISIONS.match(
      /### Context cycling: sprint-gated with session-relative thresholds[^\n]*/
    )?.[0] || '';
    assert.match(headerLine, /2026-05/);
  });

  it('the ADR includes Why and Tradeoff prose', () => {
    const adrIdx = DECISIONS.indexOf(
      '### Context cycling: sprint-gated with session-relative thresholds'
    );
    const nextSep = DECISIONS.indexOf('---', adrIdx + 1);
    const adrBody = DECISIONS.slice(adrIdx, nextSep > -1 ? nextSep : undefined);
    assert.match(adrBody, /Why:/);
    assert.match(adrBody, /Tradeoff:/);
  });

  it('the ADR documents alternatives considered', () => {
    const adrIdx = DECISIONS.indexOf(
      '### Context cycling: sprint-gated with session-relative thresholds'
    );
    const nextSep = DECISIONS.indexOf('---', adrIdx + 1);
    const adrBody = DECISIONS.slice(adrIdx, nextSep > -1 ? nextSep : undefined);
    assert.match(adrBody, /[Aa]lternatives/);
  });

  it('the ADR references the F-numbered failure modes from the spike', () => {
    const adrIdx = DECISIONS.indexOf(
      '### Context cycling: sprint-gated with session-relative thresholds'
    );
    const nextSep = DECISIONS.indexOf('---', adrIdx + 1);
    const adrBody = DECISIONS.slice(adrIdx, nextSep > -1 ? nextSep : undefined);
    assert.match(adrBody, /F1|F1–F|failure mode/i);
  });

  it('the ADR is marked Status: Active', () => {
    const headerLine = DECISIONS.match(
      /### Context cycling: sprint-gated with session-relative thresholds[^\n]*/
    )?.[0] || '';
    assert.match(headerLine, /Status: Active/);
  });
});

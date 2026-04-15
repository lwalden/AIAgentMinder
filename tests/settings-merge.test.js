import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mergeSettings } from '../lib/settings-merge.js';

describe('mergeSettings', () => {
  const template = {
    statusLine: {
      type: 'command',
      command: 'bash .claude/scripts/context-monitor.sh',
    },
    hooks: {
      PreToolUse: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/context-cycle-hook.sh' }] },
      ],
      PostToolUse: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/correction-capture-hook.sh' }] },
      ],
      Stop: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/sprint-stop-guard.sh' }] },
      ],
      SessionEnd: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/session-end-cycle.sh' }] },
      ],
      SessionStart: [
        { matcher: 'startup', hooks: [{ type: 'command', command: 'bash .claude/scripts/session-start-continuation.sh' }] },
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/session-start-hook.sh' }] },
      ],
      StopFailure: [
        { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/stop-failure-hook.sh' }] },
      ],
    },
  };

  it('creates settings from empty target', () => {
    const result = mergeSettings(template, {});
    assert.deepEqual(result.statusLine, template.statusLine);
    assert.equal(result.hooks.PreToolUse.length, 1);
    assert.equal(result.hooks.PostToolUse.length, 1);
    assert.equal(result.hooks.Stop.length, 1);
    assert.equal(result.hooks.SessionEnd.length, 1);
    assert.equal(result.hooks.SessionStart.length, 2, 'SessionStart should have startup + default entries');
    assert.equal(result.hooks.StopFailure.length, 1);
  });

  it('preserves user-added env keys', () => {
    const target = { env: { ANTHROPIC_API_KEY: 'sk-test' } };
    const result = mergeSettings(template, target);
    assert.equal(result.env.ANTHROPIC_API_KEY, 'sk-test');
    assert.ok(result.statusLine);
  });

  it('preserves user-added hook entries in PreToolUse', () => {
    const target = {
      hooks: {
        PreToolUse: [
          { matcher: 'Edit', hooks: [{ type: 'command', command: 'bash user-hook.sh' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    // Should have AAM hook + user hook
    assert.equal(result.hooks.PreToolUse.length, 2);
    assert.ok(result.hooks.PreToolUse.some(e =>
      e.hooks.some(h => h.command.includes('context-cycle-hook'))));
    assert.ok(result.hooks.PreToolUse.some(e =>
      e.hooks.some(h => h.command.includes('user-hook'))));
  });

  it('updates existing AAM hook entry instead of duplicating', () => {
    const target = {
      hooks: {
        PreToolUse: [
          { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/context-cycle-hook.sh' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    // AAM hook from template, no duplication of existing entry
    assert.equal(result.hooks.PreToolUse.length, 1, 'should not duplicate AAM hook');
    assert.ok(result.hooks.PreToolUse.some(e =>
      e.hooks.some(h => h.command.includes('context-cycle-hook'))));
  });

  it('adds missing hook types', () => {
    const target = {
      hooks: {
        PreToolUse: [
          { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/context-cycle-hook.sh' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    assert.ok(result.hooks.PostToolUse, 'should add PostToolUse');
    assert.ok(result.hooks.Stop, 'should add Stop');
    assert.ok(result.hooks.SessionEnd, 'should add SessionEnd');
    assert.ok(result.hooks.SessionStart, 'should add SessionStart');
    assert.ok(result.hooks.StopFailure, 'should add StopFailure');
  });

  it('B-005: sync preserves both SessionStart entries (startup + default) on re-sync', () => {
    // Regression: v4.3.0 sync clobbered the startup-matcher continuation entry
    // because the template only shipped one SessionStart entry. Now the template
    // ships both; re-sync should be idempotent on a correctly-configured consumer.
    const target = {
      hooks: {
        SessionStart: [
          { matcher: 'startup', hooks: [{ type: 'command', command: 'bash .claude/scripts/session-start-continuation.sh' }] },
          { matcher: '', hooks: [{ type: 'command', command: 'bash .claude/scripts/session-start-hook.sh' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    assert.equal(result.hooks.SessionStart.length, 2, 'both entries should survive re-sync');
    assert.ok(result.hooks.SessionStart.some(e =>
      e.matcher === 'startup' && e.hooks.some(h => h.command.includes('session-start-continuation'))),
    'startup entry must survive');
    assert.ok(result.hooks.SessionStart.some(e =>
      e.matcher === '' && e.hooks.some(h => h.command.includes('session-start-hook'))),
    'default entry must survive');
  });

  it('removes obsolete compact-reorient SessionStart entry', () => {
    const target = {
      hooks: {
        SessionStart: [
          { matcher: 'compact', hooks: [{ type: 'command', command: 'node .claude/hooks/compact-reorient.js' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    // compact-reorient is an obsolete non-AAM hook — it is stripped (no .claude/scripts/ path)
    // and replaced with the two template entries
    assert.equal(result.hooks.SessionStart.length, 2, 'should have startup + default entries, not the obsolete compact one');
    assert.ok(!result.hooks.SessionStart.some(e =>
      e.hooks.some(h => h.command.includes('compact-reorient'))));
    assert.ok(result.hooks.SessionStart.some(e =>
      e.hooks.some(h => h.command.includes('session-start-continuation'))));
    assert.ok(result.hooks.SessionStart.some(e =>
      e.hooks.some(h => h.command.includes('session-start-hook'))));
  });

  it('removes obsolete pr-pipeline-trigger PostToolUse entry', () => {
    const target = {
      hooks: {
        PostToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'node .claude/hooks/pr-pipeline-trigger.js' }] },
          { matcher: '', hooks: [{ type: 'command', command: 'bash user-post-tool.sh' }] },
        ],
      },
    };
    const result = mergeSettings(template, target);
    assert.ok(!result.hooks.PostToolUse.some(e =>
      e.hooks.some(h => h.command.includes('pr-pipeline-trigger'))));
    // Should still have the user hook and the AAM correction-capture hook
    assert.ok(result.hooks.PostToolUse.some(e =>
      e.hooks.some(h => h.command.includes('user-post-tool'))));
    assert.ok(result.hooks.PostToolUse.some(e =>
      e.hooks.some(h => h.command.includes('correction-capture'))));
  });

  it('is idempotent — running twice produces same result', () => {
    const target = { env: { FOO: 'bar' } };
    const first = mergeSettings(template, target);
    const second = mergeSettings(template, first);
    assert.deepEqual(first, second);
  });

  it('preserves unknown top-level keys', () => {
    const target = { customKey: { nested: true }, env: { X: '1' } };
    const result = mergeSettings(template, target);
    assert.deepEqual(result.customKey, { nested: true });
  });

  it('updates statusLine even if target has a different one', () => {
    const target = { statusLine: { type: 'command', command: 'echo old' } };
    const result = mergeSettings(template, target);
    assert.deepEqual(result.statusLine, template.statusLine);
  });
});

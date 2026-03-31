import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getMigrations, MIGRATIONS } from '../lib/migrations.js';

describe('MIGRATIONS registry', () => {
  it('is sorted by version ascending', () => {
    const versions = MIGRATIONS.map(m => m.version);
    const sorted = [...versions].sort((a, b) => {
      const [aMaj, aMin, aPat] = a.split('.').map(Number);
      const [bMaj, bMin, bPat] = b.split('.').map(Number);
      return aMaj - bMaj || aMin - bMin || aPat - bPat;
    });
    assert.deepEqual(versions, sorted, 'migrations must be in ascending version order');
  });

  it('each migration has required fields', () => {
    for (const m of MIGRATIONS) {
      assert.ok(m.version, 'must have version');
      assert.ok(m.description, 'must have description');
      assert.ok(Array.isArray(m.delete), `${m.version}: delete must be array`);
      assert.ok(Array.isArray(m.rename), `${m.version}: rename must be array`);
    }
  });

  it('rename entries have from and to fields', () => {
    for (const m of MIGRATIONS) {
      for (const r of m.rename) {
        assert.ok(r.from, `${m.version}: rename must have from`);
        assert.ok(r.to, `${m.version}: rename must have to`);
      }
    }
  });
});

describe('getMigrations', () => {
  it('returns empty array when versions match', () => {
    const result = getMigrations('4.1.0', '4.1.0');
    assert.deepEqual(result, []);
  });

  it('returns all migrations when fromVersion is null (fresh install)', () => {
    const result = getMigrations(null, '4.1.0');
    assert.deepEqual(result, [], 'fresh install needs no migrations');
  });

  it('returns migrations between v3.3.0 and v4.1.0', () => {
    const result = getMigrations('3.3.0', '4.1.0');
    // Should include v4.0 (commands→skills) and v4.1 (rules→agents)
    assert.ok(result.length >= 2, 'should have at least 2 migrations');
    assert.ok(result.some(m => m.version === '4.0.0'), 'should include v4.0 migration');
    assert.ok(result.some(m => m.version === '4.1.0'), 'should include v4.1 migration');
  });

  it('returns only later migrations', () => {
    const result = getMigrations('4.0.0', '4.1.0');
    assert.ok(result.length >= 1);
    assert.ok(result.every(m => m.version === '4.1.0' || m.version > '4.0.0'));
    assert.ok(!result.some(m => m.version === '4.0.0'), 'should not include current version');
  });

  it('v4.0 migration deletes commands directory files', () => {
    const result = getMigrations('3.3.0', '4.0.0');
    const v4 = result.find(m => m.version === '4.0.0');
    assert.ok(v4, 'v4.0 migration should exist');
    // Commands were renamed to skills
    assert.ok(v4.rename.some(r => r.from.includes('.claude/commands/')),
      'v4.0 should rename commands to skills');
  });

  it('v4.1 migration deletes mode-specific rules', () => {
    const result = getMigrations('4.0.0', '4.1.0');
    const v41 = result.find(m => m.version === '4.1.0');
    assert.ok(v41, 'v4.1 migration should exist');
    assert.ok(v41.delete.some(f => f.includes('scope-guardian.md')),
      'v4.1 should delete scope-guardian.md');
    assert.ok(v41.delete.some(f => f.includes('approach-first.md')),
      'v4.1 should delete approach-first.md');
    assert.ok(v41.delete.some(f => f.includes('sprint-workflow.md')),
      'v4.1 should delete sprint-workflow.md');
  });

  it('v3.2 migration deletes compact-reorient.js', () => {
    const result = getMigrations('3.1.0', '3.2.0');
    const v32 = result.find(m => m.version === '3.2.0');
    assert.ok(v32, 'v3.2 migration should exist');
    assert.ok(v32.delete.some(f => f.includes('compact-reorient')),
      'v3.2 should delete compact-reorient.js');
  });

  it('accumulates deletions across version chain', () => {
    const result = getMigrations('3.1.0', '4.1.0');
    const allDeletes = result.flatMap(m => m.delete);
    // Should include deletions from v3.2 (compact-reorient) AND v4.1 (rules→agents)
    assert.ok(allDeletes.some(f => f.includes('compact-reorient')));
    assert.ok(allDeletes.some(f => f.includes('scope-guardian')));
  });
});

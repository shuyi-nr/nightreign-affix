import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from './types';
import type { HashState } from './url';
import { addEntry, suggestMode } from './checkerAdd';

function entry(over: Partial<CatalogEntry> & { effectId: number }): CatalogEntry {
  return {
    effectId: over.effectId,
    name: over.name ?? '词条',
    category: over.category ?? '攻击力',
    explanation: over.explanation ?? '',
    superposability: over.superposability ?? '',
    compatibilityId: over.compatibilityId ?? -1,
    sortId: over.sortId ?? over.effectId,
    poolIds: over.poolIds ?? [],
    isCurse: over.isCurse ?? false,
    requiresCurse: over.requiresCurse ?? false,
    normalCurrent: over.normalCurrent ?? true,
    normalLegacy: over.normalLegacy ?? false,
    deepPositive: over.deepPositive ?? false,
    deepCurse: over.deepCurse ?? false,
    searchText: over.searchText ?? '词条',
  };
}

describe('suggestMode', () => {
  it('prefers current → legacy → deep-positive → compatibility-only', () => {
    expect(suggestMode(entry({ effectId: 1, normalCurrent: true }))).toBe('CURRENT_NORMAL');
    expect(suggestMode(entry({ effectId: 2, normalCurrent: false, normalLegacy: true }))).toBe('LEGACY_NORMAL');
    expect(suggestMode(entry({ effectId: 3, normalCurrent: false, deepPositive: true }))).toBe('DEEP_POSITIVE');
    expect(suggestMode(entry({ effectId: 4, normalCurrent: false, deepCurse: true }))).toBe('COMPATIBILITY_ONLY');
  });
});

describe('addEntry', () => {
  it('fills the first empty slot when the mode matches', () => {
    const s: HashState = { page: 'catalog', mode: 'CURRENT_NORMAL', ids: [5, null, null] };
    expect(addEntry(s, entry({ effectId: 10 }))).toEqual({ page: 'check', mode: 'CURRENT_NORMAL', ids: [5, 10, null] });
  });

  it('replaces the first slot when all three are full', () => {
    const s: HashState = { page: 'catalog', mode: 'CURRENT_NORMAL', ids: [5, 6, 7] };
    expect(addEntry(s, entry({ effectId: 10 })).ids).toEqual([10, 6, 7]);
  });

  it('clears the other slots when the entry needs a different mode', () => {
    const s: HashState = { page: 'catalog', mode: 'CURRENT_NORMAL', ids: [5, 6, 7] };
    const out = addEntry(s, entry({ effectId: 10, normalCurrent: false, deepPositive: true }));
    expect(out).toEqual({ page: 'check', mode: 'DEEP_POSITIVE', ids: [10, null, null] });
  });
});

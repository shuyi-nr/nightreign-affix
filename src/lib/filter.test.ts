import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from './types';
import { filterCandidates, poolOptionsFor } from './filter';

function entry(over: Partial<CatalogEntry> & { effectId: number; name: string }): CatalogEntry {
  const isCurse = over.isCurse ?? false;
  return {
    effectId: over.effectId,
    name: over.name,
    category: over.category ?? '攻击力',
    explanation: '',
    superposability: '',
    compatibilityId: -1,
    sortId: over.effectId,
    poolIds: over.poolIds ?? [110],
    isCurse,
    requiresCurse: over.requiresCurse ?? false,
    normalCurrent: true,
    normalLegacy: true,
    deepPositive: false,
    deepCurse: isCurse,
    searchText: over.name.toLowerCase(),
  };
}

const A = entry({ effectId: 1, name: '攻击力提升' });
const B = entry({ effectId: 2, name: '防御力提升', category: '减伤率', poolIds: [210] });
const C = entry({ effectId: 3, name: 'HP 回复', category: '恢复', poolIds: [2_000_000], requiresCurse: true });
const D = entry({ effectId: 4, name: '毒属性负面', category: '恢复', poolIds: [3_000_000], isCurse: true });

const ALL = [A, B, C, D];

describe('filterCandidates', () => {
  it('returns all when no filter is set', () => {
    expect(filterCandidates(ALL, { query: '', category: '', pools: new Set(), curseOnly: false, requiresCurseOnly: false })).toEqual(ALL);
  });

  it('filters by search substring', () => {
    expect(filterCandidates(ALL, { query: '防御', category: '', pools: new Set(), curseOnly: false, requiresCurseOnly: false })).toEqual([B]);
  });

  it('filters by category', () => {
    expect(filterCandidates(ALL, { query: '', category: '恢复', pools: new Set(), curseOnly: false, requiresCurseOnly: false })).toEqual([C, D]);
  });

  it('filters by pool with OR semantics across selected pools', () => {
    const f = { query: '', category: '', pools: new Set([110, 210]), curseOnly: false, requiresCurseOnly: false };
    expect(filterCandidates(ALL, f)).toEqual([A, B]);
  });

  it('filters by curse and requires-curse tags', () => {
    expect(filterCandidates(ALL, { query: '', category: '', pools: new Set(), curseOnly: true, requiresCurseOnly: false })).toEqual([D]);
    expect(filterCandidates(ALL, { query: '', category: '', pools: new Set(), curseOnly: false, requiresCurseOnly: true })).toEqual([C]);
  });

  it('combines dimensions with AND semantics', () => {
    const f = { query: '', category: '恢复', pools: new Set([2_000_000]), curseOnly: false, requiresCurseOnly: true };
    expect(filterCandidates(ALL, f)).toEqual([C]);
  });
});

describe('poolOptionsFor', () => {
  it('returns only pools present in candidates, in display order', () => {
    const opts = poolOptionsFor([A, C, D]); // pools 110, 2_000_000, 3_000_000
    expect(opts.map((o) => o.poolId)).toEqual([110, 2_000_000, 3_000_000]);
    expect(opts[0].group).toBe('普通当前');
    expect(opts[1].group).toBe('深夜正面');
    expect(opts[2].group).toBe('深夜负面');
  });

  it('returns an empty list for candidates without pool ids', () => {
    expect(poolOptionsFor([entry({ effectId: 9, name: 'x', poolIds: [] })])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { catalog, getAffix } from './catalog';
import { compatibleAffixes } from './compatibleAffixes';
import { deepRelics, sortPairedRows, validateDeep } from './deep';
import { CheckStatus } from './types';
import type { CatalogEntry } from './types';

const normal = catalog.all.filter((a) => a.normalCurrent);
const legacy = catalog.all.filter((a) => a.normalLegacy);
const deep = catalog.all.filter((a) => a.deepPositive);
const curses = catalog.all.filter((a) => a.deepCurse);
const idsOf = (entries: CatalogEntry[]) => entries.map((a) => a.effectId);
const option = (id: number, compatibilityId: number, poolIds: number[]): CatalogEntry => ({
  ...normal[0], effectId: id, compatibilityId, poolIds,
});

describe('compatible affix suggestions', () => {
  it('narrows both other slots and excludes conflicts with either selected affix', () => {
    const first = compatibleAffixes('CURRENT_NORMAL', [6630000, null, null], normal, []).positive;
    expect(first[0]).toHaveLength(normal.length);
    expect(first[1]).toEqual(first[2]);
    expect(idsOf(first[1])).not.toContain(6630000);
    expect(idsOf(first[1])).not.toContain(6630100);
    expect(idsOf(first[1])).toContain(7000000);
    const second = compatibleAffixes('CURRENT_NORMAL', [6630000, 7000000, null], normal, []).positive;
    expect(second[2].length).toBeLessThan(first[2].length);
    expect(idsOf(second[2])).toContain(7000100);
    expect(idsOf(second[2])).not.toContain(7000000);
  });

  it('requires a real three-slot completion and lets the user replace a dead-end selection', () => {
    const options = [option(1, -1, [110]), option(2, -1, [210]), option(3, -1, [310]), option(4, -1, [110])];
    const result = compatibleAffixes('CURRENT_NORMAL', [1, null, null], options, []).positive;
    expect(idsOf(result[1])).toEqual([2, 3]);
    const deadEnd = compatibleAffixes('CURRENT_NORMAL', [1, 4, null], options, []).positive;
    expect(idsOf(deadEnd[0])).toEqual([2, 3]);
    expect(deadEnd[2]).toEqual([]);
    expect(compatibleAffixes('LEGACY_NORMAL', [6630000, null, null], legacy, []).positive[1]).toEqual([]);
  });

  it('lets a pair be completed later and excludes negatives on rows that need none', () => {
    const relicId = deepRelics[0].id;
    const selected = [6005601, 6630000, null];
    const result = compatibleAffixes('DEEP_POSITIVE', selected, deep, curses, {
      curses: [null, null, null], relicId,
    });
    expect(result.negative[1]).toEqual([]);
    const negative = result.negative[0][0];
    const filled = compatibleAffixes('DEEP_POSITIVE', selected, deep, curses, {
      curses: [negative.effectId, null, null], relicId,
    });
    expect(filled.positive[0].every((a) => a.requiresCurse)).toBe(true);
    const third = filled.positive[2].find((a) => !a.requiresCurse)!;
    const sorted = sortPairedRows([selected[0], selected[1], third.effectId], [negative.effectId, null, null]);
    expect(validateDeep(sorted.ids, sorted.curses, relicId).status).toBe(CheckStatus.VALID);
  });

  it('filters a deep positive if the only available curse conflicts with another row', () => {
    const relicId = deepRelics[0].id;
    const selected = getAffix(6630000)!;
    const positive = option(1, -1, [2_000_000]);
    positive.requiresCurse = true;
    const options = [selected, positive, ...deep.filter((a) => !a.requiresCurse && a.effectId !== selected.effectId)];
    const curse = { ...curses[0], compatibilityId: selected.compatibilityId };
    const result = compatibleAffixes('DEEP_POSITIVE', [selected.effectId, null, null], options, [curse], {
      curses: [null, null, null], relicId,
    });
    expect(result.positive[1].length).toBeGreaterThan(0);
    expect(idsOf(result.positive[1])).not.toContain(positive.effectId);
  });
});

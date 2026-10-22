import { describe, expect, it } from 'vitest';
import data from '../data/affixes.json';
import { deepRelics, sortPairedRows, validateDeep } from './deep';
import { CheckStatus, IssueKind } from './types';
import { buildHash, parseHash } from './url';
import { parseFavorites } from './storage';

const positives = data.affixes.filter((a) => !a.isCurse && a.poolIds.some((p) => [2000000, 2100000, 2200000].includes(p)));
const a = positives.find((p) => p.requiresCurse)!;
const b = positives.find((p) => !p.requiresCurse && p.compatibilityId !== a.compatibilityId)!;
const c = positives.find((p) => !p.requiresCurse && p.effectId !== b.effectId && ![a.compatibilityId, b.compatibilityId].includes(p.compatibilityId))!;
const curse = data.affixes.find((p) => p.isCurse && ![a.compatibilityId, b.compatibilityId, c.compatibilityId].includes(p.compatibilityId))!;
const base = sortPairedRows([a.effectId, b.effectId, c.effectId], [curse.effectId, null, null]);
const relic = deepRelics[0].id;

describe('deep full validation with authoritative data', () => {
  it('validates positive/negative row pairs and sorts them together', () => {
    expect(validateDeep(base.ids, base.curses, relic).status).toBe(CheckStatus.VALID);
    const reversed = { ids: [...base.ids].reverse(), curses: [...base.curses].reverse() };
    expect(validateDeep(reversed.ids, reversed.curses, relic).status).toBe(CheckStatus.WRONG_ORDER);
    expect(sortPairedRows(reversed.ids, reversed.curses)).toEqual(base);
  });
  it('reports missing negatives and count mismatch separately', () => {
    const result = validateDeep(base.ids, [null, null, null], relic);
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.map((i) => i.title)).toEqual(expect.arrayContaining(['正负数量不配对', '缺少配对负面']));
  });
  it('rejects a negative on a B row even when total count matches', () => {
    const misplaced = [null, null, null] as Array<number | null>;
    misplaced[base.ids.indexOf(b.effectId)] = curse.effectId;
    const result = validateDeep(base.ids, misplaced, relic);
    expect(result.issues.map((i) => i.title)).toEqual(expect.arrayContaining(['缺少配对负面', '多余的负面词条']));
    expect(result.issues.some((i) => i.title === '正负数量不配对')).toBe(false);
  });
  it('rejects wrong pools, unknown IDs, and invalid relic IDs', () => {
    expect(validateDeep(base.ids, [a.effectId, null, null], relic).issues.some((i) => i.title === '负面词条不在诅咒池')).toBe(true);
    const normalOnly = data.affixes.find((p) => !p.isCurse && !p.poolIds.some((pool) => [2000000, 2100000, 2200000].includes(pool)))!;
    expect(validateDeep([normalOnly.effectId, b.effectId, c.effectId], [null, null, null], relic).issues.some((i) => i.kind === IssueKind.UNAVAILABLE)).toBe(true);
    expect(validateDeep([999999999, b.effectId, c.effectId], base.curses, relic).status).toBe(CheckStatus.INVALID);
    expect(validateDeep(base.ids, base.curses, 42).status).toBe(CheckStatus.INVALID);
    expect(validateDeep(base.ids, base.curses, 7900003).status).toBe(CheckStatus.INVALID);
    expect(deepRelics.every((r) => r.name && r.slots.every((p) => [2000000, 2100000, 2200000].includes(p)))).toBe(true);
  });
  it('checks duplicates and compatibility across positive and negative effects', () => {
    const result = validateDeep([a.effectId, a.effectId, c.effectId], [curse.effectId, curse.effectId, null], relic);
    expect(result.issues.some((i) => i.kind === IssueKind.DUPLICATE)).toBe(true);
    expect(result.issues.some((i) => i.kind === IssueKind.CONFLICT)).toBe(true);
  });
  it('keeps empty slots incomplete instead of issuing a legal verdict', () => {
    expect(validateDeep([null, null, null], [null, null, null], relic).status).toBe(CheckStatus.INCOMPLETE);
  });
  it('round-trips paired slots, including empty negatives, through share URLs and favorites', () => {
    const state = { page: 'check' as const, mode: 'DEEP_POSITIVE' as const, ids: base.ids, deepFull: true, curses: base.curses, relicId: relic };
    expect(parseHash(buildHash(state))).toEqual(state);
    const favorites = [{ ...state, id: 'deep-build', name: '配对备份', savedAt: 1 }];
    expect(parseFavorites(JSON.stringify(favorites))[0].curses).toEqual(base.curses);
    expect(parseFavorites(JSON.stringify([{ ...favorites[0], curses: ['bad'] }]))).toEqual([]);
    expect(parseHash('#/check?mode=CURRENT_NORMAL&ids=6630000,,7000100').ids).toEqual([6630000, null, 7000100]);
  });
});

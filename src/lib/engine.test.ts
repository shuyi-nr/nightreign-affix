import { describe, expect, it } from 'vitest';
import type { Affix, CatalogEntry } from './types';
import { CheckStatus, IssueKind } from './types';
import {
  CHECK_MODES,
  canonicalOrder,
  hasPoolAssignment,
  validate,
} from './engine';
import { catalog, poolCounts } from './catalog';

function affix(
  id: number,
  compatibility: number,
  sort: number,
  pools: number[] = [110, 210, 310],
  requiresCurse = false,
): Affix {
  return {
    effectId: id,
    name: `词条 ${id}`,
    aliases: [],
    category: '测试',
    explanation: '',
    superposability: '',
    compatibilityId: compatibility,
    sortId: sort,
    poolIds: pools,
    isCurse: false,
    requiresCurse,
    popularity: null,
    source: 'test',
  };
}

describe('rule engine (ported from upstream LegalityCheckerTest)', () => {
  it('valid ordered current combination passes', () => {
    const result = validate(
      [affix(10, 1, 100), affix(20, 2, 200), affix(30, -1, 300)],
      'CURRENT_NORMAL',
    );
    expect(result.status).toBe(CheckStatus.VALID);
    expect(result.issues).toHaveLength(0);
  });

  it('effect id duplicate is invalid', () => {
    const dup = affix(10, -1, 100);
    const result = validate([dup, dup, affix(30, -1, 300)], 'CURRENT_NORMAL');
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.kind === IssueKind.DUPLICATE)).toBe(true);
  });

  it('non -1 compatibility id conflicts while -1 is exempt', () => {
    const conflict = validate(
      [affix(10, 100, 100), affix(20, 100, 200), affix(30, -1, 300)],
      'CURRENT_NORMAL',
    );
    const unrestricted = validate(
      [affix(10, -1, 100), affix(20, -1, 200), affix(30, -1, 300)],
      'CURRENT_NORMAL',
    );
    expect(conflict.status).toBe(CheckStatus.INVALID);
    expect(conflict.issues.some((i) => i.kind === IssueKind.CONFLICT)).toBe(true);
    expect(unrestricted.status).toBe(CheckStatus.VALID);
  });

  it('pool membership uses one-to-one slot assignment', () => {
    const assignable = [
      affix(1, 1, 1, [210]),
      affix(2, 2, 2, [310]),
      affix(3, 3, 3, [110]),
    ];
    const impossible = [
      affix(11, 11, 11, [110]),
      affix(12, 12, 12, [110]),
      affix(13, 13, 13, [210, 310]),
    ];
    expect(hasPoolAssignment(assignable, [110, 210, 310])).toBe(true);

    const requiresBacktracking = [
      affix(21, 21, 21, [110, 210]),
      affix(22, 22, 22, [110]),
      affix(23, 23, 23, [310]),
    ];
    expect(hasPoolAssignment(requiresBacktracking, [110, 210, 310])).toBe(true);
    expect(validate(assignable, 'CURRENT_NORMAL').status).toBe(CheckStatus.VALID);

    const result = validate(impossible, 'CURRENT_NORMAL');
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.kind === IssueKind.UNAVAILABLE && i.title === '不符合当前槽池模板')).toBe(true);
  });

  it('affix outside selected pool is reported', () => {
    const result = validate(
      [affix(10, 1, 100), affix(20, 2, 200), affix(30, 3, 300, [2_000_000])],
      'CURRENT_NORMAL',
    );
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.kind === IssueKind.UNAVAILABLE && i.title === '不在当前出货池')).toBe(true);
  });

  it('canonical order compares sort id then effect id', () => {
    const ordered = canonicalOrder([affix(12, 1, 100), affix(10, 2, 100), affix(11, 3, 100)]);
    expect(ordered.map((a) => a.effectId)).toEqual([10, 11, 12]);

    const result = validate(
      [affix(30, 3, 300), affix(10, 1, 100), affix(20, 2, 200)],
      'CURRENT_NORMAL',
    );
    expect(result.status).toBe(CheckStatus.WRONG_ORDER);
    expect(result.orderedAffixes.map((a) => a.effectId)).toEqual([10, 20, 30]);
  });

  it('all seven real deep templates pass', () => {
    expect(CHECK_MODES.DEEP_POSITIVE.slotPoolSequences).toEqual([
      [2_000_000, 2_000_000, 2_000_000],
      [2_000_000, 2_000_000, 2_100_000],
      [2_000_000, 2_100_000, 2_100_000],
      [2_100_000, 2_100_000, 2_100_000],
      [2_000_000, 2_000_000, 2_200_000],
      [2_000_000, 2_200_000, 2_200_000],
      [2_200_000, 2_200_000, 2_200_000],
    ]);

    CHECK_MODES.DEEP_POSITIVE.slotPoolSequences.forEach((template, templateIndex) => {
      const combination = template.map((poolId, affixIndex) =>
        affix(10_000 + templateIndex * 10 + affixIndex, 100 + affixIndex, 100 + affixIndex, [poolId], poolId === 2_000_000),
      );
      const result = validate(combination, 'DEEP_POSITIVE');
      expect(result.status, `template=${template}`).toBe(CheckStatus.VALID);
      expect(result.warnings.filter((w) => w.kind === IssueKind.CURSE_PAIRING)).toHaveLength(1);
    });
  });

  it('nonexistent deep ABC template is invalid', () => {
    const result = validate(
      [
        affix(1, 1, 1, [2_000_000], true),
        affix(2, 2, 2, [2_100_000]),
        affix(3, 3, 3, [2_200_000]),
      ],
      'DEEP_POSITIVE',
    );
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.title === '不符合当前槽池模板')).toBe(true);
    expect(result.warnings.filter((w) => w.kind === IssueKind.CURSE_PAIRING)).toHaveLength(1);
  });

  it('deep complete checks always warn and count A-only entries', () => {
    const incomplete = validate([], 'DEEP_POSITIVE');
    expect(incomplete.status).toBe(CheckStatus.INCOMPLETE);
    expect(incomplete.warnings).toHaveLength(0);

    const affixes = [
      affix(1, 1, 1, [2_000_000], true),
      affix(2, 2, 2, [2_000_000], true),
      affix(3, 3, 3, [2_100_000]),
    ];
    const result = validate(affixes, 'DEEP_POSITIVE');
    const warning = result.warnings[0];
    expect(warning.effectIds).toEqual([1, 2]);
    expect(warning.detail).toContain('2 条为仅 A 池词条');
    expect(warning.detail).toContain('至少需要 2 个对应诅咒槽');
    expect(result.message).toContain('不等同');

    const wrongOrder = validate([...affixes].reverse(), 'DEEP_POSITIVE');
    expect(wrongOrder.status).toBe(CheckStatus.WRONG_ORDER);
    expect(wrongOrder.warnings.filter((w) => w.kind === IssueKind.CURSE_PAIRING)).toHaveLength(1);
  });

  it('compatibility only skips pool membership but still checks conflicts', () => {
    const result = validate(
      [affix(1, 1, 1, []), affix(2, 2, 2, []), affix(3, 3, 3, [])],
      'COMPATIBILITY_ONLY',
    );
    expect(result.status).toBe(CheckStatus.VALID);
  });
});

describe('merged data integrity (against PROVENANCE counts)', () => {
  it('reproduces the documented drawable pool counts', () => {
    const c = poolCounts();
    // PROVENANCE: 普通当前池 340 / 旧池 290 / 深夜正面 332 / 深夜负面 24 / A池需诅咒 49
    expect(c.total).toBe(527);
    expect(c.normalCurrent).toBe(340);
    expect(c.normalLegacy).toBe(290);
    expect(c.deepPositive).toBe(332);
    expect(c.deepCurse).toBe(24);
    expect(c.requiresCurse).toBe(49);
  });

  it('every catalog entry has unique effectId and a sortId', () => {
    const ids = new Set<number>();
    for (const e of catalog.all) {
      expect(ids.has(e.effectId)).toBe(false);
      ids.add(e.effectId);
      expect(typeof e.sortId).toBe('number');
      expect(e.sortId).toBeGreaterThanOrEqual(0);
    }
  });
});

// Real-data end-to-end checks: build legal / illegal / order-wrong cases from
// the actual catalog instead of synthetic affixes.
function realAffix(e: { effectId: number; name: string; compatibilityId: number; sortId: number; poolIds: number[]; requiresCurse: boolean }): Affix {
  return {
    effectId: e.effectId,
    name: e.name,
    aliases: [],
    category: '',
    explanation: '',
    superposability: '',
    compatibilityId: e.compatibilityId,
    sortId: e.sortId,
    poolIds: e.poolIds,
    isCurse: false,
    requiresCurse: e.requiresCurse,
    popularity: null,
    source: '',
  };
}

describe('real-data integration', () => {
  it('finds a genuinely valid current-pool combination and validates it', () => {
    const pool = catalog.all.filter((e) => e.normalCurrent);
    // pick three with pairwise-distinct compatibilityId (skip -1 by using unique groups)
    const picked: CatalogEntry[] = [];
    const usedCompat = new Set<number>();
    for (const e of pool) {
      if (e.compatibilityId !== -1 && usedCompat.has(e.compatibilityId)) continue;
      if (e.compatibilityId !== -1) usedCompat.add(e.compatibilityId);
      picked.push(e);
      if (picked.length === 3) break;
    }
    expect(picked).toHaveLength(3);
    const ordered = canonicalOrder(picked.map(realAffix));
    const result = validate(ordered, 'CURRENT_NORMAL');
    expect(result.status).toBe(CheckStatus.VALID);
  });

  it('detects a real compatibility conflict in current pool', () => {
    const pool = catalog.all.filter((e) => e.normalCurrent);
    const byCompat = new Map<number, CatalogEntry[]>();
    for (const e of pool) {
      if (e.compatibilityId === -1) continue;
      const g = byCompat.get(e.compatibilityId) ?? [];
      g.push(e);
      byCompat.set(e.compatibilityId, g);
    }
    // a group with >=2 members is a real conflict pair
    const group = [...byCompat.values()].find((g) => g.length >= 2);
    expect(group).toBeDefined();
    const third = pool.find((e) => e.effectId !== group![0].effectId && e.effectId !== group![1].effectId)!;
    const result = validate(
      [group![0], group![1], third].map(realAffix),
      'CURRENT_NORMAL',
    );
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.kind === IssueKind.CONFLICT)).toBe(true);
  });

  it('detects wrong order on a real valid combination', () => {
    const pool = catalog.all.filter((e) => e.normalCurrent);
    const picked: CatalogEntry[] = [];
    const usedCompat = new Set<number>();
    for (const e of pool) {
      if (e.compatibilityId !== -1 && usedCompat.has(e.compatibilityId)) continue;
      if (e.compatibilityId !== -1) usedCompat.add(e.compatibilityId);
      picked.push(e);
      if (picked.length === 3) break;
    }
    const ordered = canonicalOrder(picked.map(realAffix));
    const reversed = [...ordered].reverse();
    const result = validate(reversed, 'CURRENT_NORMAL');
    expect(result.status).toBe(CheckStatus.WRONG_ORDER);
    expect(result.orderedAffixes.map((a) => a.effectId)).toEqual(ordered.map((a) => a.effectId));
  });

  it('flags a current-only affix as unavailable in the legacy pool', () => {
    // the legacy pool (290) is a subset of the current pool (340); the ~50 new
    // 1.03 affixes are current-only and must be rejected under LEGACY_NORMAL.
    const currentOnly = catalog.all.find((e) => e.normalCurrent && !e.normalLegacy);
    expect(currentOnly).toBeDefined();
    const legacy = catalog.all.filter((e) => e.normalLegacy);
    const others = [legacy[0], legacy[1]].map(realAffix);
    const result = validate([...others, realAffix(currentOnly!)], 'LEGACY_NORMAL');
    expect(result.status).toBe(CheckStatus.INVALID);
    expect(result.issues.some((i) => i.kind === IssueKind.UNAVAILABLE)).toBe(true);
  });
});

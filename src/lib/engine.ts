// Legality rule engine — a faithful TypeScript port of the upstream
// `LegalityChecker.kt` / `CheckMode.kt` (nightreign-relic-checker).
import type { Affix, CheckIssue, CheckModeConfig, CheckModeKey, CheckResult } from './types';
import { CheckStatus, IssueKind } from './types';

export const SLOT_COUNT = 3;

export const CHECK_MODES: Record<CheckModeKey, CheckModeConfig> = {
  CURRENT_NORMAL: {
    key: 'CURRENT_NORMAL',
    title: '普通 1.03',
    shortTitle: '1.03',
    detail: '严格检查 1.03 / DLC 后普通大遗物的非零权重词条池。',
    slotPoolSequences: [[110, 210, 310]],
  },
  LEGACY_NORMAL: {
    key: 'LEGACY_NORMAL',
    title: '普通旧池',
    shortTitle: '旧池',
    detail: '严格检查 1.02 及更早的普通大遗物词条池。',
    slotPoolSequences: [[100, 200, 300]],
  },
  DEEP_POSITIVE: {
    key: 'DEEP_POSITIVE',
    title: '深夜正面',
    shortTitle: '深夜',
    detail: '按真实七种三槽模板预检深夜正面词条、互斥与顺序；不替代具体遗物 ID 与负面词条配对校验。',
    slotPoolSequences: [
      [2_000_000, 2_000_000, 2_000_000],
      [2_000_000, 2_000_000, 2_100_000],
      [2_000_000, 2_100_000, 2_100_000],
      [2_100_000, 2_100_000, 2_100_000],
      [2_000_000, 2_000_000, 2_200_000],
      [2_000_000, 2_200_000, 2_200_000],
      [2_200_000, 2_200_000, 2_200_000],
    ],
  },
  COMPATIBILITY_ONLY: {
    key: 'COMPATIBILITY_ONLY',
    title: '顺序/互斥',
    shortTitle: '通用',
    detail: '只检查词条是否重复、互斥，以及保存顺序；适合固定遗物或来源不明的组合。',
    slotPoolSequences: [],
  },
};

export const MODE_ORDER: CheckModeKey[] = [
  'CURRENT_NORMAL',
  'LEGACY_NORMAL',
  'DEEP_POSITIVE',
  'COMPATIBILITY_ONLY',
];

function eligiblePoolIds(mode: CheckModeConfig): Set<number> {
  const s = new Set<number>();
  for (const seq of mode.slotPoolSequences) for (const p of seq) s.add(p);
  return s;
}

/** Canonical save/display order: ascending by (sortId, effectId). */
export function canonicalOrder(affixes: Affix[]): Affix[] {
  return [...affixes].sort((a, b) => a.sortId - b.sortId || a.effectId - b.effectId);
}

/** Whether `affixes` can be assigned one-to-one onto `slotPools` (backtracking). */
export function hasPoolAssignment(affixes: Affix[], slotPools: number[]): boolean {
  if (affixes.length !== slotPools.length) return false;
  if (slotPools.length === 0) return true;
  const used = new Array<boolean>(affixes.length).fill(false);
  const assign = (slotIndex: number): boolean => {
    if (slotIndex === slotPools.length) return true;
    for (let i = 0; i < affixes.length; i++) {
      if (!used[i] && affixes[i].poolIds.includes(slotPools[slotIndex])) {
        used[i] = true;
        if (assign(slotIndex + 1)) return true;
        used[i] = false;
      }
    }
    return false;
  };
  return assign(0);
}

export function hasPoolPatternAssignment(affixes: Affix[], sequences: number[][]): boolean {
  return sequences.some((seq) => hasPoolAssignment(affixes, seq));
}

function deepWarnings(affixes: Affix[], mode: CheckModeConfig): CheckIssue[] {
  if (mode.key !== 'DEEP_POSITIVE') return [];
  const curseBound = affixes.filter((a) => a.requiresCurse);
  const curseRequirement =
    curseBound.length === 0
      ? '其中没有仅 A 池词条；'
      : `其中 ${curseBound.length} 条为仅 A 池词条，至少需要 ${curseBound.length} 个对应诅咒槽；`;
  const curseNames = curseBound.map((a) => a.name).join('、');
  return [
    {
      kind: IssueKind.CURSE_PAIRING,
      title: '深夜模式仅作预检',
      detail:
        curseRequirement +
        '当前仅预检三条正面效果，完整深夜遗物仍需结合具体遗物 ID、实际槽池模板与负面词条验证。' +
        (curseNames ? `仅 A 池词条：${curseNames}` : ''),
      effectIds: curseBound.map((a) => a.effectId),
    },
  ];
}

/** Validate a 3-affix relic combination against a check mode. */
export function validate(affixes: Affix[], modeKey: CheckModeKey): CheckResult {
  const mode = CHECK_MODES[modeKey];

  if (affixes.length !== SLOT_COUNT) {
    return { status: CheckStatus.INCOMPLETE, message: '请选择三个词条', orderedAffixes: [], issues: [], warnings: [] };
  }

  const warnings = deepWarnings(affixes, mode);
  const issues: CheckIssue[] = [];

  // 1) duplicate effectId
  const byId = new Map<number, Affix[]>();
  for (const a of affixes) {
    const list = byId.get(a.effectId) ?? [];
    list.push(a);
    byId.set(a.effectId, list);
  }
  for (const group of byId.values()) {
    if (group.length > 1) {
      issues.push({
        kind: IssueKind.DUPLICATE,
        title: '词条重复',
        detail: `同一个效果不能在一件遗物上出现两次：${group[0].name}`,
        effectIds: group.map((a) => a.effectId),
      });
    }
  }

  // 2) compatibility conflict (non -1 compatibilityId must be pairwise distinct)
  const byCompat = new Map<number, Affix[]>();
  for (const a of affixes) {
    if (a.compatibilityId === -1) continue;
    const list = byCompat.get(a.compatibilityId) ?? [];
    list.push(a);
    byCompat.set(a.compatibilityId, list);
  }
  for (const group of byCompat.values()) {
    if (group.length > 1) {
      issues.push({
        kind: IssueKind.CONFLICT,
        title: '同一互斥池',
        detail: `${group.map((a) => a.name).join('、')} 不能同时出现`,
        effectIds: group.map((a) => a.effectId),
      });
    }
  }

  // 3) pool membership (skipped in COMPATIBILITY_ONLY)
  if (mode.key !== 'COMPATIBILITY_ONLY' && !hasPoolPatternAssignment(affixes, mode.slotPoolSequences)) {
    const eligible = eligiblePoolIds(mode);
    const unavailable = affixes.filter((a) => a.poolIds.every((p) => !eligible.has(p)));
    const affected = unavailable.length > 0 ? unavailable : affixes;
    const isPatternMismatch = unavailable.length === 0;
    issues.push({
      kind: IssueKind.UNAVAILABLE,
      title: isPatternMismatch ? '不符合当前槽池模板' : '不在当前出货池',
      detail:
        affected.map((a) => a.name).join('、') +
        (isPatternMismatch
          ? ' 无法分配到任一真实的三词条槽池模板'
          : ' 不属于当前校验口径的非零权重出货池'),
      effectIds: affected.map((a) => a.effectId),
    });
  }

  const ordered = canonicalOrder(affixes);

  if (issues.length > 0) {
    return { status: CheckStatus.INVALID, message: '该三词条组合不合法', orderedAffixes: ordered, issues, warnings };
  }

  if (ordered.map((a) => a.effectId).join(',') !== affixes.map((a) => a.effectId).join(',')) {
    return { status: CheckStatus.WRONG_ORDER, message: '组合本身可成立，但词条顺序错误', orderedAffixes: ordered, issues, warnings };
  }

  return {
    status: CheckStatus.VALID,
    message:
      mode.key === 'DEEP_POSITIVE'
        ? '正面词条预检通过；不等同于完整深夜遗物合法'
        : '该三词条组合合法，顺序正确',
    orderedAffixes: ordered,
    issues,
    warnings,
  };
}

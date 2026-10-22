import data from '../data/affixes.json';
import relicData from '../data/deep-relics.json';
import type { Affix, CheckIssue, CheckResult } from './types';
import { CheckStatus, IssueKind } from './types';
import { canonicalOrder } from './engine';

export const deepRelics = relicData.relics;
const affixes = new Map<number, Affix>((data.affixes as Affix[]).map((a) => [a.effectId, a]));

// Port of upstream RelicAudit.auditDeepRelic: actual deep saves use row pairing
// and the A/B/C union, not parameter-row pool assignment. Negative effects are
// checked for duplication/conflicts with ALL effects, but are not sorted alone.
export function validateDeep(ids: Array<number | null>, curses: Array<number | null>, relicId: number): CheckResult {
  const issues: CheckIssue[] = [];
  const positive = ids.flatMap((id) => id != null && affixes.has(id) ? [affixes.get(id)!] : []);
  const ordered = canonicalOrder(positive);
  const result = (status: CheckStatus, message: string): CheckResult => ({ status, message, orderedAffixes: ordered, issues, warnings: [] });
  if (ids.length !== 3 || curses.length !== 3 || !deepRelics.some((r) => r.id === relicId)) {
    issues.push({ kind: IssueKind.UNAVAILABLE, title: '遗物类型无效', detail: '请选择数据表中收录的三词条深夜遗物。', effectIds: [] });
    return result(CheckStatus.INVALID, '无法校验该遗物');
  }
  const allIds = [...ids, ...curses].filter((id): id is number => id != null);
  const unknown = allIds.filter((id) => !affixes.has(id));
  if (unknown.length) {
    issues.push({ kind: IssueKind.UNAVAILABLE, title: '不存在的词条', detail: `数据中没有这些 ID：${unknown.join('、')}`, effectIds: unknown });
    return result(CheckStatus.INVALID, '存在未知词条');
  }
  const all = allIds.map((id) => affixes.get(id)!);
  const seenId = new Set<number>();
  const groups = new Map<number, Affix[]>();
  for (const a of all) {
    if (seenId.has(a.effectId)) issues.push({ kind: IssueKind.DUPLICATE, title: '词条重复', detail: `${a.name} 在这件遗物中出现多次。`, effectIds: [a.effectId] });
    seenId.add(a.effectId);
    if (a.compatibilityId !== -1) groups.set(a.compatibilityId, [...(groups.get(a.compatibilityId) ?? []), a]);
  }
  for (const group of groups.values()) if (group.length > 1) issues.push({ kind: IssueKind.CONFLICT, title: '同一互斥池', detail: `${group.map((a) => a.name).join('、')} 不能同时出现。`, effectIds: group.map((a) => a.effectId) });
  const required = positive.filter((a) => a.requiresCurse).length;
  const negativeCount = curses.filter((id) => id != null).length;
  if (positive.length === 3 && required !== negativeCount) issues.push({ kind: IssueKind.CURSE_PAIRING, title: '正负数量不配对', detail: `这组正面词条需要 ${required} 条负面，实际填写 ${negativeCount} 条。`, effectIds: allIds });
  for (let i = 0; i < 3; i++) {
    const p = ids[i] != null ? affixes.get(ids[i]!) : undefined;
    const n = curses[i] != null ? affixes.get(curses[i]!) : undefined;
    if (p && (p.isCurse || !p.poolIds.some((pool) => [2000000, 2100000, 2200000].includes(pool)))) {
      issues.push({ kind: IssueKind.UNAVAILABLE, title: '正面词条不在深夜池', detail: `第 ${i + 1} 行：${p.name}`, effectIds: [p.effectId] });
    }
    if (n && (!n.isCurse || !n.poolIds.includes(3000000))) {
      issues.push({ kind: IssueKind.UNAVAILABLE, title: '负面词条不在诅咒池', detail: `第 ${i + 1} 行：${n.name}`, effectIds: [n.effectId] });
    }
    if (p?.requiresCurse && !n) issues.push({ kind: IssueKind.CURSE_PAIRING, title: '缺少配对负面', detail: `第 ${i + 1} 行「${p.name}」需要同一行的负面词条。`, effectIds: [p.effectId] });
    if (!p?.requiresCurse && n) issues.push({ kind: IssueKind.CURSE_PAIRING, title: '多余的负面词条', detail: `第 ${i + 1} 行正面为空或无需诅咒，不能附带「${n.name}」。`, effectIds: [n.effectId, ...(p ? [p.effectId] : [])] });
  }
  if (issues.length) return result(CheckStatus.INVALID, '深夜词条或逐行配对不合法');
  if (positive.length !== 3) return result(CheckStatus.INCOMPLETE, '请选择三个正面词条，并按行配对负面');
  if (ordered.some((a, i) => a.effectId !== ids[i])) return result(CheckStatus.WRONG_ORDER, '配对检查通过，但正面词条顺序错误；调整时须整行一起移动');
  return result(CheckStatus.VALID, '三词条深夜遗物检测通过，正负词条已逐行校验');
}

export function sortPairedRows(ids: Array<number | null>, curses: Array<number | null>) {
  const rows = ids.map((id, i) => ({ id, curse: curses[i] ?? null }));
  rows.sort((a, b) => {
    if (a.id == null) return b.id == null ? 0 : 1;
    if (b.id == null) return -1;
    return (affixes.get(a.id)?.sortId ?? Infinity) - (affixes.get(b.id)?.sortId ?? Infinity) || a.id - b.id;
  });
  return { ids: rows.map((r) => r.id), curses: rows.map((r) => r.curse) };
}

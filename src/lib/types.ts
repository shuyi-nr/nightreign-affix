// Core data + rule-engine types, ported from the upstream
// `nightreign-relic-checker` reference implementation (Kotlin `rules/` module).

export interface Affix {
  effectId: number;
  name: string;
  aliases: string[];
  category: string;
  explanation: string;
  superposability: string;
  /** 冲突组；非 -1 的值在同一遗物上必须两两不同。 */
  compatibilityId: number;
  /** 排序键（游戏参数 overrideEffectId）；正确顺序按 (sortId, effectId) 升序。 */
  sortId: number;
  /** 所属可抽取池；例如普通当前池 110/210/310，旧池 100/200/300，深夜 2_000_000 等。 */
  poolIds: number[];
  /** 深夜负面词条。 */
  isCurse: boolean;
  /** 深夜 A 池（需诅咒）正面词条。 */
  requiresCurse: boolean;
  popularity: number | null;
  source: string;
  // --- merged-in fields from the user's xlsx (display only, never affect legality) ---
  xlsxEffect?: string;
  note?: string;
  xlsxType?: string;
  xlsxStacking?: string;
  inXlsx?: boolean;
}

export type CheckModeKey = 'CURRENT_NORMAL' | 'LEGACY_NORMAL' | 'DEEP_POSITIVE' | 'COMPATIBILITY_ONLY';

export interface CheckModeConfig {
  key: CheckModeKey;
  title: string;
  shortTitle: string;
  detail: string;
  slotPoolSequences: number[][];
}

export enum CheckStatus {
  INCOMPLETE = 'INCOMPLETE',
  VALID = 'VALID',
  WRONG_ORDER = 'WRONG_ORDER',
  INVALID = 'INVALID',
}

export enum IssueKind {
  DUPLICATE = 'DUPLICATE',
  CONFLICT = 'CONFLICT',
  UNAVAILABLE = 'UNAVAILABLE',
  CURSE_PAIRING = 'CURSE_PAIRING',
}

export interface CheckIssue {
  kind: IssueKind;
  title: string;
  detail: string;
  effectIds: number[];
}

export interface CheckResult {
  status: CheckStatus;
  message: string;
  orderedAffixes: Affix[];
  issues: CheckIssue[];
  warnings: CheckIssue[];
}

/** A non-drawable reference affix present in the xlsx but removed from the current game params. */
export interface ReferenceEntry {
  effectId: number;
  name: string;
  type: string;
  effect: string;
  note: string;
  stacking: string;
  kind: 'normal' | 'deep';
}

/** A drawable affix record plus its pool/eligibility summary, for the catalog/UI. */
export interface CatalogEntry {
  effectId: number;
  name: string;
  category: string;
  explanation: string;
  superposability: string;
  compatibilityId: number;
  sortId: number;
  poolIds: number[];
  isCurse: boolean;
  requiresCurse: boolean;
  /** 普通当前池（110/210/310）可抽。 */
  normalCurrent: boolean;
  /** 普通旧池（100/200/300）可抽。 */
  normalLegacy: boolean;
  /** 深夜正面可抽（2_000_000 / 2_100_000 / 2_200_000）。 */
  deepPositive: boolean;
  /** 深夜负面词条。 */
  deepCurse: boolean;
  note?: string;
  searchText: string;
}

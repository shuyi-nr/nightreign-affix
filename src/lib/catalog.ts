// Loads and indexes the merged affixes.json into a queryable catalog.
import data from '../data/affixes.json';
import type { Affix, CatalogEntry, ReferenceEntry } from './types';

interface AffixDataFile {
  gameVersion: string;
  dataVersion: string;
  affixes: Affix[];
  referenceOnly: ReferenceEntry[];
}

const raw = data as unknown as AffixDataFile;

const NORMAL_CURRENT_POOLS = [110, 210, 310];
const NORMAL_LEGACY_POOLS = [100, 200, 300];
const DEEP_POSITIVE_POOLS = [2_000_000, 2_100_000, 2_200_000];

function normalizeFold(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/ /g, '')
    .replace(/，/g, ',')
    .replace(/＋/g, '+')
    .toLowerCase();
}

function makeEntry(a: Affix): CatalogEntry {
  const inSet = (pools: number[]) => a.poolIds.some((p) => pools.includes(p));
  return {
    effectId: a.effectId,
    name: a.name,
    category: a.category,
    explanation: a.explanation,
    superposability: a.superposability,
    compatibilityId: a.compatibilityId,
    sortId: a.sortId,
    poolIds: a.poolIds,
    isCurse: a.isCurse,
    requiresCurse: a.requiresCurse,
    normalCurrent: inSet(NORMAL_CURRENT_POOLS) && !a.isCurse,
    normalLegacy: inSet(NORMAL_LEGACY_POOLS) && !a.isCurse,
    deepPositive: inSet(DEEP_POSITIVE_POOLS) && !a.isCurse,
    deepCurse: a.isCurse,
    note: a.note,
    searchText: normalizeFold([a.name, a.category, String(a.effectId), a.explanation, a.note ?? '', ...(a.aliases ?? [])].join(' ')),
  };
}

export interface Catalog {
  gameVersion: string;
  dataVersion: string;
  all: CatalogEntry[];
  byId: Map<number, CatalogEntry>;
  /** xlsx-only reference affixes (removed / unimplemented / fixed), not drawable. */
  referenceOnly: ReferenceEntry[];
}

const entries = raw.affixes.map(makeEntry);
const byId = new Map<number, CatalogEntry>();
for (const e of entries) byId.set(e.effectId, e);

export const catalog: Catalog = {
  gameVersion: raw.gameVersion,
  dataVersion: raw.dataVersion,
  all: entries,
  byId,
  referenceOnly: raw.referenceOnly,
};

export function getAffix(effectId: number): CatalogEntry | undefined {
  return byId.get(effectId);
}

export function getAffixes(effectIds: number[]): CatalogEntry[] {
  return effectIds.map((id) => byId.get(id)).filter((e): e is CatalogEntry => e !== undefined);
}

export function matchesSearch(entry: CatalogEntry, query: string): boolean {
  const needle = normalizeFold(query);
  return needle === '' || entry.searchText.includes(needle);
}

export function poolCounts(): Record<string, number> {
  return {
    normalCurrent: entries.filter((e) => e.normalCurrent).length,
    normalLegacy: entries.filter((e) => e.normalLegacy).length,
    deepPositive: entries.filter((e) => e.deepPositive).length,
    deepCurse: entries.filter((e) => e.deepCurse).length,
    requiresCurse: entries.filter((e) => e.requiresCurse && e.deepPositive).length,
    total: entries.length,
  };
}

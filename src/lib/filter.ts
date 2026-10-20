// Picker filter logic — pure & DOM-free so it can be unit-tested in Node.
// Combines search, category, fine-grained pool, and curse/requires-curse tags
// with AND semantics (pools within a selection are OR'd).

import type { CatalogEntry } from './types';
import { matchesSearch } from './catalog';

export interface PoolOption {
  poolId: number;
  /** Short human label, e.g. "1槽" or "A池". */
  label: string;
  /** Group title used to render optgroup-style headers, e.g. "普通当前". */
  group: string;
}

/** Ordered fine-grained pool taxonomy (grouping order is display order). */
export const POOL_OPTIONS: PoolOption[] = [
  { poolId: 110, label: '1槽', group: '普通当前' },
  { poolId: 210, label: '2槽', group: '普通当前' },
  { poolId: 310, label: '3槽', group: '普通当前' },
  { poolId: 100, label: '1槽', group: '普通旧池' },
  { poolId: 200, label: '2槽', group: '普通旧池' },
  { poolId: 300, label: '3槽', group: '普通旧池' },
  { poolId: 2_000_000, label: 'A池', group: '深夜正面' },
  { poolId: 2_100_000, label: 'B池', group: '深夜正面' },
  { poolId: 2_200_000, label: 'C池', group: '深夜正面' },
  { poolId: 3_000_000, label: '负面池', group: '深夜负面' },
];

/** The subset of pool options actually present in `candidates`, in display order. */
export function poolOptionsFor(candidates: CatalogEntry[]): PoolOption[] {
  const present = new Set<number>();
  for (const c of candidates) for (const p of c.poolIds) present.add(p);
  return POOL_OPTIONS.filter((o) => present.has(o.poolId));
}

export interface FilterState {
  query: string;
  /** '' = all categories. */
  category: string;
  /** Empty set = all pools; otherwise keep entries in ANY selected pool. */
  pools: ReadonlySet<number>;
  curseOnly: boolean;
  requiresCurseOnly: boolean;
}

export function filterCandidates(candidates: CatalogEntry[], f: FilterState): CatalogEntry[] {
  const query = f.query.trim();
  return candidates.filter((c) => {
    if (query !== '' && !matchesSearch(c, query)) return false;
    if (f.category !== '' && c.category !== f.category) return false;
    if (f.pools.size > 0 && !c.poolIds.some((p) => f.pools.has(p))) return false;
    if (f.curseOnly && !c.isCurse) return false;
    if (f.requiresCurseOnly && !c.requiresCurse) return false;
    return true;
  });
}

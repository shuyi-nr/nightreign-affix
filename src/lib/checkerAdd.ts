// "一键添加到检测槽位" logic — picks a mode the entry belongs to and merges it
// into the hash-based checker state. Pure & testable.

import type { CatalogEntry, CheckModeKey } from './types';
import type { HashState } from './url';

/** Prefer the most specific mode the entry is drawable in. */
export function suggestMode(e: CatalogEntry): CheckModeKey {
  if (e.normalCurrent) return 'CURRENT_NORMAL';
  if (e.normalLegacy) return 'LEGACY_NORMAL';
  if (e.deepPositive) return 'DEEP_POSITIVE';
  return 'COMPATIBILITY_ONLY';
}

/**
 * Add `e` to the first empty slot of the current build, or replace slot 1 when
 * full. If the entry belongs to a different mode than the current build, the
 * other slots are cleared and the mode switches.
 */
export function addEntry(state: HashState, e: CatalogEntry): HashState {
  const mode = suggestMode(e);
  const ids: Array<number | null> = [...(state.mode === mode ? state.ids : [null, null, null])];
  const empty = ids.findIndex((id) => id == null);
  if (empty !== -1) ids[empty] = e.effectId;
  else ids[0] = e.effectId;
  return { page: 'check', mode, ids };
}

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
  if (mode === state.mode && state.deepFull) {
    const curses = [...(state.curses ?? [null, null, null])];
    // Replacing a row invalidates its old pairing; let the user choose again.
    curses[empty !== -1 ? empty : 0] = null;
    return { ...state, page: 'check', mode, ids, curses };
  }
  return { page: 'check', mode, ids };
}

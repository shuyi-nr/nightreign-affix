// Hash-based URL state so a check result can be shared / refreshed and
// reproduced offline. Format:  #/<page>?mode=<MODE>&ids=<a>,<b>,<c>
// Slots are positional: an empty slot is an empty segment (e.g. `ids=123,,456`).
import type { CheckModeKey } from './types';
import { MODE_ORDER } from './engine';

export type Page = 'check' | 'catalog' | 'rules';

export interface HashState {
  page: Page;
  mode: CheckModeKey;
  /** Length-3 positional slot list; null = empty slot. */
  ids: Array<number | null>;
  deepFull?: boolean;
  curses?: Array<number | null>;
  relicId?: number;
}

const DEFAULT_STATE: HashState = { page: 'check', mode: 'CURRENT_NORMAL', ids: [null, null, null] };

function isModeKey(v: string): v is CheckModeKey {
  return (MODE_ORDER as string[]).includes(v);
}

export function parseHash(hash: string): HashState {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const page: Page = path === 'catalog' ? 'catalog' : path === 'rules' ? 'rules' : 'check';

  const params = new URLSearchParams(query);
  const mode = isModeKey(params.get('mode') ?? '') ? (params.get('mode') as CheckModeKey) : DEFAULT_STATE.mode;

  const idsRaw = (params.get('ids') ?? '').split(',');
  const ids: Array<number | null> = [null, null, null];
  for (let i = 0; i < 3; i++) {
    const s = idsRaw[i];
    if (s == null || s === '') ids[i] = null;
    else {
      const n = parseInt(s, 10);
      ids[i] = Number.isFinite(n) && n > 0 ? n : null;
    }
  }

  const extra: Partial<HashState> = {};
  if (params.get('full') === '1') {
    extra.deepFull = true;
    extra.curses = [0, 1, 2].map((i) => {
      const s = (params.get('curses') ?? '').split(',')[i];
      const n = Number(s);
      return Number.isSafeInteger(n) && n > 0 ? n : null;
    });
    const relic = Number(params.get('relic'));
    if (Number.isSafeInteger(relic) && relic > 0) extra.relicId = relic;
  }
  return { page, mode, ids, ...extra };
}

function encodeIds(ids: Array<number | null>): string {
  return ids.map((id) => (id == null ? '' : String(id))).join(',');
}

export function readHash(): HashState {
  return parseHash(window.location.hash);
}

export function buildHash(state: HashState): string {
  const params = new URLSearchParams();
  params.set('mode', state.mode);
  if (state.ids.some((id) => id != null)) params.set('ids', encodeIds(state.ids));
  if (state.deepFull) {
    params.set('full', '1');
    params.set('curses', encodeIds(state.curses ?? [null, null, null]));
    if (state.relicId != null) params.set('relic', String(state.relicId));
  }
  const q = params.toString();
  return `#/${state.page}${q ? `?${q}` : ''}`;
}

export function writeHash(state: HashState): void {
  const hash = buildHash(state);
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

export function shareUrl(state: HashState): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}${buildHash(state)}`;
}

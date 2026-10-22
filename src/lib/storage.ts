// localStorage persistence for saved relic builds (收藏).
import type { CheckModeKey } from './types';
import { MODE_ORDER } from './engine';

export interface SavedBuild {
  id: string;
  name: string;
  mode: CheckModeKey;
  ids: number[];
  savedAt: number;
  deepFull?: boolean;
  curses?: Array<number | null>;
  relicId?: number;
}

const KEY = 'nightreign-affix.favorites.v1';

const VALID_MODES = new Set<string>(MODE_ORDER);

export function loadFavorites(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedBuild[];
    return Array.isArray(parsed) ? parsed.filter(isValidBuild) : [];
  } catch {
    return [];
  }
}

function persist(favs: SavedBuild[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(favs));
  } catch {
    // storage full / unavailable — ignore
  }
}

export function saveFavorite(build: Omit<SavedBuild, 'id' | 'savedAt'>): SavedBuild {
  const favs = loadFavorites();
  const entry: SavedBuild = {
    ...build,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
  };
  favs.unshift(entry);
  persist(favs);
  return entry;
}

export function removeFavorite(id: string): void {
  persist(loadFavorites().filter((f) => f.id !== id));
}

export function renameFavorite(id: string, name: string): void {
  if (!name.trim()) return;
  persist(loadFavorites().map((f) => f.id === id ? { ...f, name: name.trim().slice(0, 80) } : f));
}

// --- 导出 / 导入（备份 / 恢复） ---

function isValidBuild(v: unknown): v is SavedBuild {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    typeof b.mode === 'string' &&
    VALID_MODES.has(b.mode) &&
    Array.isArray(b.ids) &&
    b.ids.length > 0 &&
    b.ids.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0) &&
    typeof b.savedAt === 'number'
    && (b.deepFull === undefined || typeof b.deepFull === 'boolean')
    && (b.curses === undefined || (Array.isArray(b.curses) && b.curses.length === 3 && b.curses.every((n) => n === null || (typeof n === 'number' && Number.isSafeInteger(n) && n > 0))))
    && (b.relicId === undefined || (typeof b.relicId === 'number' && Number.isSafeInteger(b.relicId) && b.relicId > 0))
  );
}

/** Parse a favorites export file, dropping any malformed / invalid entries. */
export function parseFavorites(text: string): SavedBuild[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidBuild);
  } catch {
    return [];
  }
}

/** Merge incoming builds into the existing list, deduped by id. */
export function mergeFavorites(existing: SavedBuild[], incoming: SavedBuild[]): SavedBuild[] {
  const seen = new Set(existing.map((f) => f.id));
  const added: SavedBuild[] = [];
  for (const b of incoming) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    added.push(b);
  }
  return [...existing, ...added];
}

/** Import a favorites export file (merge into localStorage) and report the delta. */
export function importFavoritesJson(text: string): { imported: number; skipped: number } {
  const incoming = parseFavorites(text);
  const existing = loadFavorites();
  const merged = mergeFavorites(existing, incoming);
  persist(merged);
  const imported = merged.length - existing.length;
  return { imported, skipped: incoming.length - imported };
}

/** Serialize current favorites as a pretty-printed JSON backup. */
export function exportFavoritesJson(): string {
  return JSON.stringify(loadFavorites(), null, 2);
}

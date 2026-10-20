// localStorage persistence for saved relic builds (收藏).
import type { CheckModeKey } from './types';

export interface SavedBuild {
  id: string;
  name: string;
  mode: CheckModeKey;
  ids: number[];
  savedAt: number;
}

const KEY = 'nightreign-affix.favorites.v1';

export function loadFavorites(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedBuild[];
    return Array.isArray(parsed) ? parsed : [];
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

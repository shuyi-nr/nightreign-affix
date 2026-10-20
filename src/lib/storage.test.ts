import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportFavoritesJson,
  importFavoritesJson,
  loadFavorites,
  parseFavorites,
  saveFavorite,
} from './storage';

// In-memory localStorage stand-in for the node test environment.
function makeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => void m.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

describe('storage favorites export/import', () => {
  it('round-trips favorites through JSON export/import', () => {
    saveFavorite({ name: 'A', mode: 'CURRENT_NORMAL', ids: [1, 2, 3] });
    const parsed = parseFavorites(exportFavoritesJson());
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('A');
    expect(parsed[0].ids).toEqual([1, 2, 3]);
  });

  it('merges imports without duplicating existing ids', () => {
    const a = saveFavorite({ name: 'A', mode: 'CURRENT_NORMAL', ids: [1, 2, 3] });
    const incoming = JSON.stringify([
      { ...a },
      { id: 'other-1', name: 'B', mode: 'DEEP_POSITIVE', ids: [4, 5, 6], savedAt: 123 },
    ]);
    const { imported, skipped } = importFavoritesJson(incoming);
    expect(imported).toBe(1);
    expect(skipped).toBe(1);
    expect(loadFavorites()).toHaveLength(2);
  });

  it('rejects malformed JSON and invalid entries', () => {
    expect(parseFavorites('not json')).toEqual([]);
    expect(parseFavorites('{}')).toEqual([]);
    const mixed = JSON.stringify([
      { id: 'ok', name: 'x', mode: 'CURRENT_NORMAL', ids: [1], savedAt: 0 },
      { id: 2, name: 'bad' },
      { id: 'badmode', name: 'y', mode: 'NOPE', ids: [1], savedAt: 0 },
    ]);
    expect(parseFavorites(mixed)).toHaveLength(1);
  });
});

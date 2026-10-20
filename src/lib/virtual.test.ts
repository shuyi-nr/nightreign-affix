import { describe, expect, it } from 'vitest';
import { getVisibleRange, scrollTopToReveal } from './virtual';

describe('getVisibleRange', () => {
  it('returns empty for empty or degenerate inputs', () => {
    expect(getVisibleRange(0, 400, 40, 0)).toEqual({ start: 0, end: 0, topPad: 0, bottomPad: 0 });
    expect(getVisibleRange(0, 400, 0, 10)).toEqual({ start: 0, end: 0, topPad: 0, bottomPad: 0 });
    expect(getVisibleRange(0, 0, 40, 10)).toEqual({ start: 0, end: 0, topPad: 0, bottomPad: 0 });
  });

  it('renders the first rows at the top with overscan', () => {
    // 100 items × 40px, viewport 400 (10 visible), overscan 6 → 16 rows.
    const r = getVisibleRange(0, 400, 40, 100, 6);
    expect(r.start).toBe(0);
    expect(r.end).toBe(16);
    expect(r.topPad).toBe(0);
    expect(r.bottomPad).toBe((100 - 16) * 40);
  });

  it('clamps overscan when the whole list fits', () => {
    const r = getVisibleRange(0, 400, 40, 12, 6);
    expect(r.start).toBe(0);
    expect(r.end).toBe(12);
    expect(r.bottomPad).toBe(0);
  });

  it('computes a mid-list window with top/bottom padding', () => {
    // scrollTop 1000 → first visible index 25.
    const r = getVisibleRange(1000, 400, 40, 100, 6);
    expect(r.start).toBe(19); // 25 - 6
    expect(r.end).toBe(41); // 25 + 10 + 6
    expect(r.topPad).toBe(19 * 40);
    expect(r.bottomPad).toBe((100 - 41) *40);
  });

  it('clamps the window near the end of the list', () => {
    // total height 4000; max scrollTop 3600 → first visible 90.
    const r = getVisibleRange(3600, 400, 40, 100, 6);
    expect(r.start).toBe(84); // 90 - 6
    expect(r.end).toBe(100); // clamped to itemCount
    expect(r.bottomPad).toBe(0);
  });
});

describe('scrollTopToReveal', () => {
  const H = 40;
  const V = 400;
  const N = 100;

  it('returns null when the item is already fully visible', () => {
    expect(scrollTopToReveal(5, H, V, N, 0)).toBeNull();
    // item 15 spans 600..640, viewport 240..640.
    expect(scrollTopToReveal(15, H, V, N, 240)).toBeNull();
  });

  it('scrolls down to reveal an item below the viewport', () => {
    // item 50 spans 2000..2040, viewport 0..400 → target = 2040 - 400 + 8.
    expect(scrollTopToReveal(50, H, V, N, 0)).toBe(1648);
  });

  it('scrolls up to reveal an item above the viewport', () => {
    // item 10 top 400, currently scrolled to the bottom → 400 - 8.
    expect(scrollTopToReveal(10, H, V, N, 3600)).toBe(392);
  });

  it('clamps to [0, maxScroll]', () => {
    expect(scrollTopToReveal(0, H, V, N, 1000)).toBe(0);
    expect(scrollTopToReveal(99, H, V, N, 0)).toBe(N * H - V);
  });
});

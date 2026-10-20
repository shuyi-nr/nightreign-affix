// Fixed-row-height virtual-list math, kept pure so it can be unit-tested in Node.

export interface VisibleRange {
  start: number;
  end: number; // exclusive
  topPad: number;
  bottomPad: number;
}

/** Which fixed-height rows are visible in a viewport, plus `overscan` rows either side. */
export function getVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  itemCount: number,
  overscan = 6,
): VisibleRange {
  if (itemHeight <= 0 || itemCount <= 0 || viewportHeight <= 0) {
    return { start: 0, end: 0, topPad: 0, bottomPad: 0 };
  }
  const firstVisible = Math.max(0, Math.floor(scrollTop / itemHeight));
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(itemCount, firstVisible + visibleCount + overscan);
  return { start, end, topPad: start * itemHeight, bottomPad: (itemCount - end) * itemHeight };
}

/**
 * Minimal scrollTop that reveals `index`, or `null` when it is already fully
 * visible. Used to keep the keyboard-active row on screen without snapping
 * during manual scrolling.
 */
export function scrollTopToReveal(
  index: number,
  itemHeight: number,
  viewportHeight: number,
  itemCount: number,
  currentScrollTop: number,
  margin = 8,
): number | null {
  if (itemCount <= 0 || index < 0 || index >= itemCount) return null;
  const maxScroll = Math.max(0, itemCount * itemHeight - viewportHeight);
  const itemTop = index * itemHeight;
  const itemBottom = itemTop + itemHeight;
  const viewBottom = currentScrollTop + viewportHeight;
  if (itemTop >= currentScrollTop && itemBottom <= viewBottom) return null;
  const target = itemTop < currentScrollTop ? itemTop - margin : itemBottom - viewportHeight + margin;
  return Math.max(0, Math.min(maxScroll, target));
}

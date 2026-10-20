import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Key, ReactNode } from 'react';
import { getVisibleRange, scrollTopToReveal } from '../lib/virtual';

export interface VirtualListProps<T> {
  items: T[];
  /** Fixed height of every row in px. */
  itemHeight: number;
  /** Extra rows rendered above/below the viewport to absorb fast scrolling. */
  overscan?: number;
  className?: string;
  id?: string;
  /** Index to keep revealed (e.g. keyboard active item); -1 disables. */
  activeIndex?: number;
  getKey: (item: T, index: number) => Key;
  renderItem: (item: T, index: number) => ReactNode;
  /** Optional ARIA role for the scroll container (e.g. "listbox"). */
  role?: string;
  ariaLabel?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 6,
  className,
  id,
  activeIndex = -1,
  getKey,
  renderItem,
  role,
  ariaLabel,
}: VirtualListProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  // Measure the viewport once mounted, then track resize (no flash: runs before paint).
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setViewportH(el.clientHeight);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // A fresh `items` identity means the query/filter changed — jump back to the top.
  useEffect(() => {
    setScrollTop(0);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [items]);

  // Keep the active row visible when keyboard navigation moves it out of view.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || activeIndex < 0 || activeIndex >= items.length) return;
    const target = scrollTopToReveal(activeIndex, itemHeight, viewportH, items.length, el.scrollTop);
    if (target != null) el.scrollTop = target;
  }, [activeIndex, items, itemHeight, viewportH]);

  const onScroll = useCallback(() => {
    if (scrollerRef.current) setScrollTop(scrollerRef.current.scrollTop);
  }, []);

  const totalH = items.length * itemHeight;
  const { start, end, topPad, bottomPad } = getVisibleRange(scrollTop, viewportH, itemHeight, items.length, overscan);

  return (
    <div ref={scrollerRef} className={className} id={id} onScroll={onScroll} role={role} aria-label={ariaLabel}>
      <div style={{ height: totalH, position: 'relative' }}>
        <div style={{ height: topPad }} />
        {items.slice(start, end).map((item, i) => {
          const index = start + i;
          return (
            <div key={getKey(item, index)} style={{ height: itemHeight, overflow: 'hidden' }}>
              {renderItem(item, index)}
            </div>
          );
        })}
        <div style={{ height: bottomPad }} />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CatalogEntry } from '../lib/types';
import { filterCandidates, poolOptionsFor } from '../lib/filter';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EmptyState } from './EmptyState';
import { Highlight } from './Highlight';
import { PoolFilter } from './PoolFilter';
import { VirtualList } from './VirtualList';

const ITEM_HEIGHT = 44;

interface Props {
  num: number;
  candidates: CatalogEntry[];
  selectedId: number | null;
  takenIds: Set<number>;
  onSelect: (id: number) => void;
  onClear: () => void;
}

export function AffixPicker({ num, candidates, selectedId, takenIds, onSelect, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [pools, setPools] = useState<Set<number>>(() => new Set());
  const [curseOnly, setCurseOnly] = useState(false);
  const [requiresCurseOnly, setRequiresCurseOnly] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const selected = selectedId != null ? candidates.find((c) => c.effectId === selectedId) : undefined;

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of candidates) m.set(c.category, (m.get(c.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [candidates]);

  const poolOptions = useMemo(() => poolOptionsFor(candidates), [candidates]);
  const hasCurse = useMemo(() => candidates.some((c) => c.isCurse), [candidates]);
  const hasRequiresCurse = useMemo(() => candidates.some((c) => c.requiresCurse), [candidates]);

  const filtered = useMemo(
    () => filterCandidates(candidates, { query, category, pools, curseOnly, requiresCurseOnly }),
    [candidates, query, category, pools, curseOnly, requiresCurseOnly],
  );

  // The keyboard highlight is reset to -1 by an effect after `filtered` changes;
  // clamp it here so a stale index can never read past the end of the new list.
  const activeIdx = activeIndex >= 0 && activeIndex < filtered.length ? activeIndex : -1;

  const close = useCallback(() => setOpen(false), []);
  const commit = useCallback(
    (id: number) => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect],
  );

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // reset filters + focus on open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCategory('');
    setPools(new Set());
    setCurseOnly(false);
    setRequiresCurseOnly(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // lock body scroll while the full-screen mobile modal is open
  useEffect(() => {
    if (!open || !isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isMobile]);

  // clear keyboard highlight whenever the result set changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [filtered]);

  const onSlotKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onInputKeyDown = (e: KeyboardEvent) => {
    if (filtered.length === 0) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? -1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = activeIndex >= 0 ? activeIndex : 0;
      if (idx < filtered.length && !takenIds.has(filtered[idx].effectId)) commit(filtered[idx].effectId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const renderItem = (c: CatalogEntry, index: number) => {
    const disabled = takenIds.has(c.effectId);
    const active = index === activeIdx;
    return (
      <div
        id={`pick-${c.effectId}`}
        role="option"
        aria-selected={active}
        aria-disabled={disabled}
        className={`picker-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`}
        onClick={() => {
          if (!disabled) commit(c.effectId);
        }}
        onMouseMove={() => {
          if (activeIndex !== index) setActiveIndex(index);
        }}
      >
        <span className="n">
          <Highlight text={c.name} query={query} />
        </span>
        <span className="e">
          <Highlight text={c.explanation} query={query} />
        </span>
        <span className="mono small muted">{c.effectId}</span>
      </div>
    );
  };

  return (
    <div className="slot" ref={rootRef}>
      <div className="slot-label">
        <span className="num">{num}</span>槽位
      </div>
      <div
        className={`slot-box${selected ? ' filled' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onSlotKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <div className="affix-name">
              {selected.name}
              {selected.isCurse && <span className="tag curse">负面</span>}
              {selected.requiresCurse && <span className="tag apool">A池·需诅咒</span>}
            </div>
            <div className="affix-id">{selected.effectId}</div>
            <div className="affix-expl">{selected.explanation || '（无说明）'}</div>
          </>
        ) : (
          <div className="empty-hint">
            <span className="plus">+</span>
            点击选择词条
          </div>
        )}
      </div>
      {selected && (
        <button
          className="clear"
          title="清除"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          ×
        </button>
      )}

      {open && (
        <div className="picker-pop" role="dialog" aria-label={`槽位 ${num} 词条选择`} onKeyDown={(e) => e.key === 'Escape' && close()}>
          <div className="picker-head">
            <div className="picker-topline">
              <span className="picker-title">选择词条</span>
              <button className="picker-close" onClick={close} aria-label="关闭">
                ×
              </button>
            </div>
            <div className="picker-search">
              <input
                ref={inputRef}
                className="input"
                placeholder="搜索名称 / 效果 / ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                role="combobox"
                aria-expanded
                aria-autocomplete="list"
                aria-controls="picker-listbox"
                aria-activedescendant={activeIdx >= 0 ? `pick-${filtered[activeIdx].effectId}` : undefined}
              />
            </div>
            <div className="picker-filters">
              <select className="input filter-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="按分类筛选">
                <option value="">全部分类</option>
                {categories.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {cat}（{count}）
                  </option>
                ))}
              </select>
              <PoolFilter options={poolOptions} selected={pools} onChange={setPools} />
              {hasCurse && (
                <button type="button" className={`tag-btn${curseOnly ? ' active' : ''}`} onClick={() => setCurseOnly((v) => !v)}>
                  负面
                </button>
              )}
              {hasRequiresCurse && (
                <button type="button" className={`tag-btn${requiresCurseOnly ? ' active' : ''}`} onClick={() => setRequiresCurseOnly((v) => !v)}>
                  需诅咒
                </button>
              )}
            </div>
          </div>
          <div className="picker-count">共 {filtered.length} 条</div>
          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title="无匹配词条" hint="试试清空搜索或调整筛选条件" />
          ) : (
            <VirtualList
              className="picker-list"
              id="picker-listbox"
              role="listbox"
              ariaLabel="词条列表"
              items={filtered}
              itemHeight={ITEM_HEIGHT}
              activeIndex={activeIdx}
              getKey={(c) => c.effectId}
              renderItem={renderItem}
            />
          )}
        </div>
      )}
    </div>
  );
}

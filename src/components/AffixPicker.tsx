import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CatalogEntry } from '../lib/types';
import { filterCandidates, poolOptionsFor } from '../lib/filter';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EmptyState } from './EmptyState';
import { Highlight } from './Highlight';
import { PoolFilter } from './PoolFilter';
import { VirtualList } from './VirtualList';
import { getAffix } from '../lib/catalog';

const ITEM_HEIGHT = 44;

interface Props {
  num: number;
  candidates: CatalogEntry[];
  selectedId: number | null;
  takenIds: Set<number>;
  onSelect: (id: number) => void;
  onClear: () => void;
  invalid?: boolean;
  label?: string;
}

export function AffixPicker({ num, candidates, selectedId, takenIds, onSelect, onClear, invalid, label = '槽位' }: Props) {
  const listId = useId();
  const [recent, setRecent] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('nightreign-affix.recent.v1') ?? '[]');
      return Array.isArray(saved) ? saved.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id)).slice(0, 8) : [];
    } catch { return []; }
  });
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

  const selected = selectedId != null ? getAffix(selectedId) : undefined;
  const recentCandidates = recent.flatMap((id) => candidates.find((c) => c.effectId === id) ?? []);

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

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('.slot-box')?.focus());
  }, []);
  const commit = useCallback(
    (id: number) => {
      onSelect(id);
      const next = [id, ...recent.filter((n) => n !== id)].slice(0, 8);
      setRecent(next);
      try { localStorage.setItem('nightreign-affix.recent.v1', JSON.stringify(next)); } catch { /* optional history */ }
      close();
    },
    [onSelect, recent, close],
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
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('nightreign-affix.recent.v1') ?? '[]');
      if (Array.isArray(saved)) setRecent(saved.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id)).slice(0, 8));
    } catch { /* optional history */ }
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
        id={`${listId}-${c.effectId}`}
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
    <div className={`slot${invalid ? ' slot-invalid' : ''}`} ref={rootRef}>
      <div className="slot-label">
        <span className="num">{num}</span>{label}{invalid && <span className="slot-error-label">需检查</span>}
      </div>
      <div
        className={`slot-box${selected ? ' filled' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onSlotKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label} ${num}：${selected?.name ?? (selectedId != null ? `未知词条 ${selectedId}` : '未选择')}`}
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
            {selectedId != null ? `未知词条 ${selectedId}，请重新选择` : '点击选择词条'}
          </div>
        )}
      </div>
      {selectedId != null && (
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
        <div className="picker-pop" role="dialog" aria-modal={isMobile || undefined} aria-label={`${label} ${num} 词条选择`} onKeyDown={(e) => {
          if (e.key === 'Escape') close();
          if (e.key === 'Tab' && isMobile) {
            const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]'));
            const first = items[0]; const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
          }
        }}>
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
                aria-controls={listId}
                aria-activedescendant={activeIdx >= 0 ? `${listId}-${filtered[activeIdx].effectId}` : undefined}
              />
              {query && <button className="btn ghost small" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="清空搜索">清空</button>}
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
          {!query && recentCandidates.length > 0 && <div className="recent-picks"><span>最近使用</span>{recentCandidates.slice(0, 4).map((c) => <button key={c.effectId} className="btn ghost small" disabled={takenIds.has(c.effectId)} onClick={() => commit(c.effectId)}>{c.name}</button>)}</div>}
          <div className="picker-count">共 {filtered.length} 条</div>
          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title="无匹配词条" hint="试试清空搜索或调整筛选条件" />
          ) : (
            <VirtualList
              className="picker-list"
              id={listId}
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

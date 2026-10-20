import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogEntry } from '../lib/types';
import { matchesSearch } from '../lib/catalog';

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
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = selectedId != null ? candidates.find((c) => c.effectId === selectedId) : undefined;

  const filtered = useMemo(() => {
    if (query.trim() === '') return candidates;
    return candidates.filter((c) => matchesSearch(c, query));
  }, [candidates, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="slot" ref={rootRef}>
      <div className="slot-label">
        <span className="num">{num}</span>槽位
      </div>
      <div
        className={`slot-box${selected ? ' filled' : ''}`}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
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
        <div className="picker-pop">
          <div className="picker-search">
            <input
              ref={inputRef}
              className="input"
              placeholder="搜索名称 / 效果 / ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="picker-list">
            {filtered.length === 0 && <div className="picker-empty">无匹配词条</div>}
            {filtered.slice(0, 200).map((c) => {
              const disabled = takenIds.has(c.effectId);
              return (
                <div
                  key={c.effectId}
                  className={`picker-item${disabled ? ' disabled' : ''}`}
                  onClick={() => {
                    if (disabled) return;
                    onSelect(c.effectId);
                    setOpen(false);
                  }}
                >
                  <span className="n">{c.name}</span>
                  <span className="e">{c.explanation}</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono small muted">{c.effectId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

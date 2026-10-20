import { useEffect, useMemo, useRef, useState } from 'react';
import type { PoolOption } from '../lib/filter';

interface Props {
  options: PoolOption[];
  selected: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
}

/** Fine-grained, grouped multi-select for slot pools (普通/旧/深夜 A·B·C/负面). */
export function PoolFilter({ options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const groups = useMemo(() => {
    const out: { group: string; items: PoolOption[] }[] = [];
    for (const o of options) {
      const last = out[out.length - 1];
      if (last && last.group === o.group) last.items.push(o);
      else out.push({ group: o.group, items: [o] });
    }
    return out;
  }, [options]);

  const isAll = selected.size === 0;
  const summary = isAll ? '全部' : `${selected.size} 个池`;

  const toggle = (poolId: number) => {
    const next = new Set(selected);
    if (next.has(poolId)) next.delete(poolId);
    else next.add(poolId);
    onChange(next);
  };

  return (
    <div className="pool-filter" ref={rootRef}>
      <button
        type="button"
        className={`pool-filter-btn${open ? ' open' : ''}${!isAll ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        池子：<b>{summary}</b>
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="pool-menu" role="group" aria-label="按池子筛选">
          <button type="button" className={`pool-opt all${isAll ? ' on' : ''}`} onClick={() => onChange(new Set())}>
            <span className="cb">{isAll ? '✓' : ''}</span>全部池
          </button>
          {groups.map((g) => (
            <div key={g.group} className="pool-group">
              <div className="pool-group-title">{g.group}</div>
              {g.items.map((o) => {
                const on = selected.has(o.poolId);
                return (
                  <button
                    key={o.poolId}
                    type="button"
                    className={`pool-opt${on ? ' on' : ''}`}
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(o.poolId)}
                  >
                    <span className="cb">{on ? '✓' : ''}</span>
                    {o.label}
                    <span className="mono muted">{o.poolId}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

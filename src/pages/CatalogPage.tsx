import { useMemo, useState } from 'react';
import { catalog, matchesSearch } from '../lib/catalog';
import type { CatalogEntry } from '../lib/types';

type PoolFilter = 'all' | 'normalCurrent' | 'normalLegacy' | 'deepPositive' | 'deepCurse' | 'reference';

const POOL_LABELS: Record<PoolFilter, string> = {
  all: '全部',
  normalCurrent: '普通当前池',
  normalLegacy: '普通旧池',
  deepPositive: '深夜正面',
  deepCurse: '深夜负面',
  reference: '参考/已移除',
};

export function CatalogPage() {
  const [query, setQuery] = useState('');
  const [pool, setPool] = useState<PoolFilter>('all');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalog.all) if (e.category) s.add(e.category);
    return ['all', ...Array.from(s).sort()];
  }, []);

  const rows = useMemo(() => {
    const out: Array<{ kind: 'affix' | 'reference'; id: number; name: string; expl: string; cat: string; entry?: CatalogEntry; stacking?: string }> = [];
    if (pool !== 'reference') {
      for (const e of catalog.all) {
        if (pool === 'normalCurrent' && !e.normalCurrent) continue;
        if (pool === 'normalLegacy' && !e.normalLegacy) continue;
        if (pool === 'deepPositive' && !e.deepPositive) continue;
        if (pool === 'deepCurse' && !e.deepCurse) continue;
        if (category !== 'all' && e.category !== category) continue;
        if (query && !matchesSearch(e, query)) continue;
        out.push({ kind: 'affix', id: e.effectId, name: e.name, expl: e.explanation, cat: e.category, entry: e });
      }
    } else {
      for (const r of catalog.referenceOnly) {
        if (category !== 'all' && r.type !== category) continue;
        const q = query.trim();
        if (q && !(r.name.includes(q) || r.effect.includes(q) || String(r.effectId).includes(q))) continue;
        out.push({ kind: 'reference', id: r.effectId, name: r.name, expl: r.effect, cat: r.type, stacking: r.stacking });
      }
    }
    return out.sort((a, b) => a.id - b.id);
  }, [query, pool, category]);

  return (
    <div>
      <div className="card">
        <h2>词条查询</h2>
        <p className="hint">搜索词条名称、效果说明或 ID；可按池子 / 分类筛选。</p>
        <div className="filters">
          <div className="filter-field grow">
            <label>搜索</label>
            <input className="input" placeholder="例如：物理攻击力 / 血量 / 7000000…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="filter-field">
            <label>池子</label>
            <div className="segmented">
              {(Object.keys(POOL_LABELS) as PoolFilter[]).map((k) => (
                <button key={k} className={pool === k ? 'active' : ''} onClick={() => setPool(k)}>
                  {POOL_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-field">
            <label>分类</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? '全部分类' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="catalog-count">
        共 {rows.length} 条
        {pool === 'reference' ? '（参考/已移除词条，不可抽取，仅作资料）' : ''}
      </div>

      <div className="card" style={{ padding: '8px 12px', overflowX: 'auto' }}>
        <table className="affix-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>词条</th>
              <th>分类</th>
              <th>效果说明</th>
              {pool === 'all' && <th>池子</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="id">{r.id}</td>
                <td className="name">
                  {r.name}
                  {r.kind === 'reference' && <span className="tag curse">已移除</span>}
                  {r.entry?.requiresCurse && <span className="tag apool">A池</span>}
                  {r.entry?.isCurse && <span className="tag curse">负面</span>}
                </td>
                <td className="muted">{r.cat || '—'}</td>
                <td className="expl">{r.expl || '—'}</td>
                {pool === 'all' && (
                  <td className="expl">
                    {r.entry ? (
                      <>
                        {r.entry.normalCurrent && <span className="pool-badge">当前</span>}
                        {r.entry.normalLegacy && <span className="pool-badge">旧池</span>}
                        {r.entry.deepPositive && <span className="pool-badge">深夜</span>}
                        {r.entry.deepCurse && <span className="pool-badge">深夜负</span>}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  无匹配结果
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

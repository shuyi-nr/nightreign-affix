import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { catalog } from '../lib/catalog';
import type { CatalogEntry, ReferenceEntry } from '../lib/types';
import { filterCandidates, poolOptionsFor } from '../lib/filter';
import { copyText } from '../lib/clipboard';
import { addEntry } from '../lib/checkerAdd';
import { buildHash, readHash } from '../lib/url';
import { Highlight } from '../components/Highlight';
import { PoolFilter } from '../components/PoolFilter';
import { EmptyState } from '../components/EmptyState';

const PAGE = 50;

type Scope = 'drawable' | 'reference';
type Card = { kind: 'affix'; entry: CatalogEntry } | { kind: 'reference'; entry: ReferenceEntry };

export function CatalogPage() {
  const [scope, setScope] = useState<Scope>('drawable');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [pools, setPools] = useState<Set<number>>(() => new Set());
  const [curseOnly, setCurseOnly] = useState(false);
  const [requiresCurseOnly, setRequiresCurseOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current != null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  }, []);

  const drawable = useMemo(
    () => filterCandidates(catalog.all, { query, category, pools, curseOnly, requiresCurseOnly }),
    [query, category, pools, curseOnly, requiresCurseOnly],
  );

  const references = useMemo(() => {
    const q = query.trim();
    return catalog.referenceOnly.filter((r) => {
      if (category !== '' && r.type !== category) return false;
      if (q && !(r.name.includes(q) || r.effect.includes(q) || String(r.effectId).includes(q))) return false;
      return true;
    });
  }, [query, category]);

  const results = useMemo<Card[]>(
    () => (scope === 'drawable' ? drawable.map((e) => ({ kind: 'affix' as const, entry: e })) : references.map((r) => ({ kind: 'reference' as const, entry: r }))),
    [scope, drawable, references],
  );
  const total = results.length;

  // reset the lazy-load window whenever the result set changes
  useEffect(() => {
    setVisible(PAGE);
  }, [results]);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    if (scope === 'drawable') {
      for (const e of catalog.all) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    } else {
      for (const r of catalog.referenceOnly) if (r.type) m.set(r.type, (m.get(r.type) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [scope]);

  const poolOptions = useMemo(() => poolOptionsFor(catalog.all), []);
  const hasCurse = useMemo(() => catalog.all.some((c) => c.isCurse), []);
  const hasRequiresCurse = useMemo(() => catalog.all.some((c) => c.requiresCurse), []);

  const copyId = useCallback(
    (id: number) => {
      copyText(String(id)).then((ok) => showToast(ok ? `已复制 ID ${id}` : '复制失败，请手动复制'));
    },
    [showToast],
  );

  const addToChecker = useCallback((e: CatalogEntry) => {
    window.location.hash = buildHash(addEntry(readHash(), e));
  }, []);

  const switchScope = (s: Scope) => {
    setScope(s);
    setCategory('');
  };

  return (
    <div>
      <div className="card">
        <h2>词条查询</h2>
        <p className="hint">搜索词条名称、效果说明或 ID；可按分类 / 池子筛选，卡片可一键复制 ID 或加入检测。</p>
        <div className="filters">
          <div className="filter-field grow">
            <label>搜索</label>
            <input className="input" placeholder="例如：物理攻击力 / 血量 / 7000000…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="filter-field">
            <label>范围</label>
            <div className="segmented">
              <button className={scope === 'drawable' ? 'active' : ''} onClick={() => switchScope('drawable')}>
                可抽取词条
              </button>
              <button className={scope === 'reference' ? 'active' : ''} onClick={() => switchScope('reference')}>
                参考 / 已移除
              </button>
            </div>
          </div>
          <div className="filter-field">
            <label>分类</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">全部分类</option>
              {categories.map(([cat, count]) => (
                <option key={cat} value={cat}>
                  {cat}（{count}）
                </option>
              ))}
            </select>
          </div>
          {scope === 'drawable' && (
            <div className="filter-field">
              <label>池子</label>
              <PoolFilter options={poolOptions} selected={pools} onChange={setPools} />
            </div>
          )}
          {scope === 'drawable' && hasCurse && (
            <div className="filter-field">
              <label>&nbsp;</label>
              <button type="button" className={`tag-btn${curseOnly ? ' active' : ''}`} onClick={() => setCurseOnly((v) => !v)}>
                负面
              </button>
            </div>
          )}
          {scope === 'drawable' && hasRequiresCurse && (
            <div className="filter-field">
              <label>&nbsp;</label>
              <button type="button" className={`tag-btn${requiresCurseOnly ? ' active' : ''}`} onClick={() => setRequiresCurseOnly((v) => !v)}>
                需诅咒
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="catalog-count">
        共 {total} 条
        {scope === 'reference' ? '（参考/已移除词条，不可抽取，仅作资料）' : ''}
      </div>

      <div className="catalog-cards">
        {results.slice(0, visible).map((card) =>
          card.kind === 'affix' ? (
            <div className="catalog-card" key={card.entry.effectId}>
              <div className="catalog-card-top">
                <span className="cc-name">
                  <Highlight text={card.entry.name} query={query} />
                </span>
                {card.entry.isCurse && <span className="tag curse">负面</span>}
                {card.entry.requiresCurse && <span className="tag apool">A池</span>}
                <span className="cc-cat">{card.entry.category || '—'}</span>
                <span className="cc-pools">
                  {card.entry.normalCurrent && <span className="pool-badge">当前</span>}
                  {card.entry.normalLegacy && <span className="pool-badge">旧池</span>}
                  {card.entry.deepPositive && <span className="pool-badge">深夜</span>}
                  {card.entry.deepCurse && <span className="pool-badge">深夜负</span>}
                </span>
              </div>
              <div className="cc-expl">
                <Highlight text={card.entry.explanation || '—'} query={query} />
              </div>
              <div className="cc-foot">
                <span className="mono muted cc-id">{card.entry.effectId}</span>
                <span className="cc-actions">
                  <button className="btn ghost small" onClick={() => copyId(card.entry.effectId)}>
                    复制 ID
                  </button>
                  <button className="btn small" onClick={() => addToChecker(card.entry)}>
                    添加到检测
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <div className="catalog-card" key={`ref-${card.entry.effectId}`}>
              <div className="catalog-card-top">
                <span className="cc-name">{card.entry.name}</span>
                <span className="tag curse">已移除</span>
                <span className="cc-cat">{card.entry.type || '—'}</span>
              </div>
              <div className="cc-expl">{card.entry.effect || '—'}</div>
              {card.entry.note && <div className="cc-note">注：{card.entry.note}</div>}
              <div className="cc-foot">
                <span className="mono muted cc-id">{card.entry.effectId}</span>
                <span className="cc-actions">
                  <button className="btn ghost small" onClick={() => copyId(card.entry.effectId)}>
                    复制 ID
                  </button>
                </span>
              </div>
            </div>
          ),
        )}
        {total === 0 && <EmptyState icon="🔍" title="无匹配结果" hint="试试调整搜索关键词或筛选条件" />}
      </div>

      {visible < total && (
        <div className="catalog-more">
          <button className="btn" onClick={() => setVisible((v) => v + PAGE)}>
            加载更多（还有 {total - visible} 条）
          </button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

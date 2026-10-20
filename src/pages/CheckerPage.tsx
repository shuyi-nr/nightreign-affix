import { useCallback, useEffect, useMemo, useState } from 'react';
import { AffixPicker } from '../components/AffixPicker';
import { catalog, getAffix } from '../lib/catalog';
import { CHECK_MODES, MODE_ORDER, validate } from '../lib/engine';
import { loadFavorites, removeFavorite, saveFavorite, type SavedBuild } from '../lib/storage';
import type { CatalogEntry, CheckModeKey, CheckResult } from '../lib/types';
import { CheckStatus, IssueKind } from '../lib/types';
import { parseHash, readHash, shareUrl, writeHash } from '../lib/url';

function candidatesFor(mode: CheckModeKey): CatalogEntry[] {
  switch (mode) {
    case 'CURRENT_NORMAL':
      return catalog.all.filter((e) => e.normalCurrent);
    case 'LEGACY_NORMAL':
      return catalog.all.filter((e) => e.normalLegacy);
    case 'DEEP_POSITIVE':
      return catalog.all.filter((e) => e.deepPositive);
    case 'COMPATIBILITY_ONLY':
      return catalog.all;
  }
}

const MODE_DESC: Record<CheckModeKey, string> = {
  CURRENT_NORMAL: '普通大遗物 · 1.03 / DLC 当前池',
  LEGACY_NORMAL: '普通大遗物 · 1.02 及更早旧池',
  DEEP_POSITIVE: '深夜遗物 · 正面词条预检',
  COMPATIBILITY_ONLY: '只查重复 / 互斥 / 顺序',
};

export function CheckerPage() {
  const initial = useMemo(() => readHash(), []);
  const [mode, setMode] = useState<CheckModeKey>(initial.mode);
  const [ids, setIds] = useState<Array<number | null>>(initial.ids);
  const [toast, setToast] = useState<string | null>(null);
  const [favs, setFavs] = useState<SavedBuild[]>(() => loadFavorites());

  const candidates = useMemo(() => candidatesFor(mode), [mode]);
  const selectedCount = useMemo(() => ids.filter((id) => id != null).length, [ids]);

  const selectedEntries = useMemo(
    () => ids.filter((id): id is number => id != null).map((id) => getAffix(id)).filter((e): e is CatalogEntry => e !== undefined),
    [ids],
  );

  // sync to URL
  useEffect(() => {
    writeHash({ page: 'check', mode, ids });
  }, [mode, ids]);

  // react to browser back/forward
  useEffect(() => {
    const onHash = () => {
      const s = parseHash(window.location.hash);
      if (s.page !== 'check') return;
      setMode(s.mode);
      setIds(s.ids);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const result: CheckResult = useMemo(() => {
    const affixes = selectedEntries.map((e) => ({
      effectId: e.effectId,
      name: e.name,
      aliases: [],
      category: e.category,
      explanation: e.explanation,
      superposability: e.superposability,
      compatibilityId: e.compatibilityId,
      sortId: e.sortId,
      poolIds: e.poolIds,
      isCurse: e.isCurse,
      requiresCurse: e.requiresCurse,
      popularity: null,
      source: '',
    }));
    return validate(affixes, mode);
  }, [selectedEntries, mode]);

  const setSlot = useCallback((index: number, id: number) => {
    setIds((prev) => prev.map((v, i) => (i === index ? id : v)));
  }, []);

  const clearSlot = useCallback((index: number) => {
    setIds((prev) => prev.map((v, i) => (i === index ? null : v)));
  }, []);

  const clearAll = useCallback(() => setIds([null, null, null]), []);

  const takenIds = useMemo(() => {
    const s = new Set<number>();
    for (const id of ids) if (id != null) s.add(id);
    return s;
  }, [ids]);

  // live pairwise conflict among currently-selected affixes
  const liveConflicts = useMemo(() => {
    const out: string[] = [];
    const seen = new Map<number, CatalogEntry>();
    for (const e of selectedEntries) {
      if (e.compatibilityId !== -1) {
        const prev = seen.get(e.compatibilityId);
        if (prev) out.push(`「${prev.name}」与「${e.name}」互斥（同一互斥池）`);
        else seen.set(e.compatibilityId, e);
      }
    }
    return out;
  }, [selectedEntries]);

  const copyLink = useCallback(() => {
    const url = shareUrl({ page: 'check', mode, ids });
    const done = () => showToast('链接已复制，可直接分享复现结果');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
    } else {
      fallbackCopy(url, done);
    }
  }, [mode, ids, showToast]);

  const doSave = useCallback(() => {
    if (selectedCount < 3) {
      showToast('请先选满三个词条');
      return;
    }
    const names = ids.map((id) => (id == null ? '—' : getAffix(id)?.name ?? String(id))).join(' / ');
    saveFavorite({ name: names, mode, ids: ids.filter((id): id is number => id != null) });
    setFavs(loadFavorites());
    showToast('已收藏到本地');
  }, [ids, mode, selectedCount, showToast]);

  const status = result.status;
  const statusClass =
    status === CheckStatus.VALID
      ? 'valid'
      : status === CheckStatus.WRONG_ORDER
        ? 'wrong'
        : status === CheckStatus.INVALID
          ? 'invalid'
          : 'incomplete';

  const orderedEntries = result.orderedAffixes.map((a) => getAffix(a.effectId)).filter(Boolean) as CatalogEntry[];

  return (
    <div>
      <div className="card">
        <h2>
          <span className="idx-badge">1</span>检测口径
        </h2>
        <p className="hint">选择遗物类型与版本，然后填入三个词条。</p>
        <div className="mode-grid">
          {MODE_ORDER.map((key) => (
            <button key={key} className={`mode-card${mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
              <div className="mode-title">
                {CHECK_MODES[key].title}
              </div>
              <div className="mode-detail">{MODE_DESC[key]}</div>
              <span className="mode-count">{candidatesFor(key).length} 条候选</span>
              <span className="check">✓</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>
          <span className="idx-badge">2</span>三个词条
        </h2>
        <p className="hint">三个槽位的候选集合相同，仅权重不同。</p>
        <div className="slots">
          {[0, 1, 2].map((i) => (
            <AffixPicker
              key={i}
              num={i + 1}
              candidates={candidates}
              selectedId={ids[i]}
              takenIds={takenIds}
              onSelect={(id) => setSlot(i, id)}
              onClear={() => clearSlot(i)}
            />
          ))}
        </div>

        {liveConflicts.length > 0 && (
          <div className="conflict-hint">
            {liveConflicts.map((c, i) => (
              <div key={i}>⚠ {c}</div>
            ))}
          </div>
        )}

        <div className="actions">
          <button className="btn primary" onClick={doSave} disabled={selectedCount < 3}>
            收藏此组合
          </button>
          <button className="btn" onClick={copyLink} disabled={selectedCount < 3}>
            复制分享链接
          </button>
          <button className="btn ghost" onClick={clearAll}>
            清空
          </button>
        </div>
      </div>

      <div className="card">
        <h2>
          <span className="idx-badge">3</span>判定结果
        </h2>
        <div className={`verdict ${statusClass}`}>
          <div className="verdict-icon">
            {status === CheckStatus.VALID
              ? '✓'
              : status === CheckStatus.WRONG_ORDER
                ? '⇄'
                : status === CheckStatus.INVALID
                  ? '✕'
                  : '…'}
          </div>
          <div className="verdict-body">
            <div className="verdict-status">
              {status === CheckStatus.VALID
                ? '合法'
                : status === CheckStatus.WRONG_ORDER
                  ? '顺序错误'
                  : status === CheckStatus.INVALID
                    ? '非法'
                    : '待补全'}
            </div>
            <div className="verdict-msg">{result.message}</div>
            {status === CheckStatus.INCOMPLETE && (
              <div className="verdict-sub">已选择 {selectedCount} / 3 个词条，选满后自动判定。</div>
            )}

            {result.issues.map((issue, i) => (
              <div key={i} className={`issue ${issue.kind.toLowerCase()}`}>
                <div className="issue-title">
                  {issue.kind === IssueKind.DUPLICATE
                    ? '🔁 '
                    : issue.kind === IssueKind.CONFLICT
                      ? '⛔ '
                      : '🚫 '}
                  {issue.title}
                </div>
                <div className="issue-detail">{issue.detail}</div>
              </div>
            ))}

            {result.warnings.map((w, i) => (
              <div key={i} className="warning">
                <div className="issue-title">⚠ {w.title}</div>
                <div className="issue-detail">{w.detail}</div>
              </div>
            ))}

            {orderedEntries.length === 3 && (
              <div className="order-strip">
                <div className="order-label">正确排序（按 (sortId, effectId) 升序）：</div>
                <div className="order-flow">
                  {orderedEntries.map((e, i) => (
                    <span key={e.effectId} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 && <span className="order-arrow">→</span>}
                      <span className="order-chip">
                        <span className="idx">{i + 1}</span>
                        <span className="nm">{e.name}</span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {favs.length > 0 && (
        <div className="card favs">
          <h2>本地收藏</h2>
          <p className="hint">保存在浏览器 localStorage，仅本机可见。</p>
          {favs.map((f) => (
            <div key={f.id} className="fav-item">
              <span className="tag">{CHECK_MODES[f.mode].shortTitle}</span>
              <span className="fav-name">{f.name}</span>
              <span className="fav-ids">{f.ids.join(', ')}</span>
              <span className="spacer" />
              <button
                className="btn ghost small"
                onClick={() => {
                  setMode(f.mode);
                  const padded: Array<number | null> = [null, null, null];
                  f.ids.slice(0, 3).forEach((id, i) => (padded[i] = id));
                  setIds(padded);
                }}
              >
                载入
              </button>
              <button
                className="btn ghost small"
                onClick={() => {
                  removeFavorite(f.id);
                  setFavs(loadFavorites());
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function fallbackCopy(text: string, done: () => void): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}

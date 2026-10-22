import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AffixPicker } from '../components/AffixPicker';
import { EmptyState } from '../components/EmptyState';
import { catalog, getAffix } from '../lib/catalog';
import { CHECK_MODES, MODE_ORDER, validate } from '../lib/engine';
import { exportFavoritesJson, importFavoritesJson, loadFavorites, removeFavorite, renameFavorite, saveFavorite, type SavedBuild } from '../lib/storage';
import type { CatalogEntry, CheckModeKey, CheckResult } from '../lib/types';
import { CheckStatus, IssueKind } from '../lib/types';
import { parseHash, readHash, shareUrl, writeHash } from '../lib/url';
import { copyText } from '../lib/clipboard';
import { buildTextSummary, statusLabel } from '../lib/summary';
import { deepRelics, sortPairedRows, validateDeep } from '../lib/deep';

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
  const [deepFull, setDeepFull] = useState(initial.deepFull ?? false);
  const [curses, setCurses] = useState<Array<number | null>>(initial.curses ?? [null, null, null]);
  const [relicId, setRelicId] = useState(initial.relicId ?? deepRelics[0].id);
  const [buildName, setBuildName] = useState('');
  const full = mode === 'DEEP_POSITIVE' && deepFull;
  const [toast, setToast] = useState<string | null>(null);
  const [favs, setFavs] = useState<SavedBuild[]>(() => loadFavorites());
  const fileRef = useRef<HTMLInputElement>(null);

  const candidates = useMemo(() => candidatesFor(mode), [mode]);
  const selectedCount = useMemo(() => ids.filter((id) => id != null).length, [ids]);

  const selectedEntries = useMemo(
    () => ids.filter((id): id is number => id != null).map((id) => getAffix(id)).filter((e): e is CatalogEntry => e !== undefined),
    [ids],
  );

  // sync to URL
  useEffect(() => {
    writeHash({ page: 'check', mode, ids, deepFull: mode === 'DEEP_POSITIVE' && deepFull, curses, relicId });
  }, [mode, ids, deepFull, curses, relicId]);

  // react to browser back/forward
  useEffect(() => {
    const onHash = () => {
      const s = parseHash(window.location.hash);
      if (s.page !== 'check') return;
      setMode(s.mode);
      setIds(s.ids);
      setDeepFull(s.deepFull ?? false);
      setCurses(s.curses ?? [null, null, null]);
      setRelicId(s.relicId ?? deepRelics[0].id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const result: CheckResult = useMemo(() => {
    if (full) return validateDeep(ids, curses, relicId);
    const unknown = ids.filter((id): id is number => id != null && !getAffix(id));
    if (unknown.length) return { status: CheckStatus.INVALID, message: '存在未知词条，请重新选择', orderedAffixes: [], issues: [{ kind: IssueKind.UNAVAILABLE, title: '不存在的词条', detail: unknown.join('、'), effectIds: unknown }], warnings: [] };
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
  }, [selectedEntries, mode, ids, full, curses, relicId]);

  const setSlot = useCallback((index: number, id: number) => {
    setIds((prev) => prev.map((v, i) => (i === index ? id : v)));
  }, []);

  const clearSlot = useCallback((index: number) => {
    setIds((prev) => prev.map((v, i) => (i === index ? null : v)));
  }, []);

  const clearAll = useCallback(() => { setIds([null, null, null]); setCurses([null, null, null]); setBuildName(''); }, []);

  const takenIds = useMemo(() => {
    const s = new Set<number>();
    for (const id of ids) if (id != null) s.add(id);
    return s;
  }, [ids]);

  const negativeCandidates = useMemo(() => catalog.all.filter((e) => e.deepCurse), []);
  const negativeTaken = new Set(curses.filter((id): id is number => id != null));
  const problemIds = new Set(result.issues.flatMap((issue) => issue.effectIds));
  // Live conflict highlighting also works before the third positive is chosen.
  for (const a of selectedEntries) for (const b of selectedEntries) {
    if (a !== b && a.compatibilityId !== -1 && a.compatibilityId === b.compatibilityId) { problemIds.add(a.effectId); problemIds.add(b.effectId); }
  }

  const applyOrder = () => {
    const sorted = sortPairedRows(ids, curses);
    setIds(sorted.ids);
    setCurses(sorted.curses);
    showToast(full ? '已按正面词条排序，配对负面随整行一起移动' : '已调整为正确顺序');
  };

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
    const url = shareUrl({ page: 'check', mode, ids, deepFull: full, curses, relicId });
    copyText(url).then((ok) => showToast(ok ? '链接已复制，可直接分享复现结果' : '复制失败，请手动复制'));
  }, [mode, ids, full, curses, relicId, showToast]);

  const copySummary = useCallback(() => {
    const names = ids
      .filter((id): id is number => id != null)
      .map((id) => getAffix(id)?.name)
      .filter((n): n is string => n != null);
    const summary = buildTextSummary(mode, names, result.status) + (full ? `\n深夜完整（三词条）：${deepRelics.find((r) => r.id === relicId)?.name ?? relicId}\n逐行负面：${curses.map((id, i) => `第 ${i + 1} 行 ${id == null ? '无' : getAffix(id)?.name ?? id}`).join('；')}` : '') + `\n${result.message}\n${result.issues.map((i) => i.detail).join('\n')}\n复现：${shareUrl({ page: 'check', mode, ids, deepFull: full, curses, relicId })}`;
    copyText(summary).then((ok) =>
      showToast(ok ? '文本摘要已复制' : '复制失败，请手动复制'),
    );
  }, [ids, mode, result, full, curses, relicId, showToast]);

  const doSave = useCallback(() => {
    if (selectedCount < 3) {
      showToast('请先选满三个词条');
      return;
    }
    const names = ids.map((id) => (id == null ? '—' : getAffix(id)?.name ?? String(id))).join(' / ');
    saveFavorite({ name: buildName.trim() || names, mode, ids: ids.filter((id): id is number => id != null), ...(full ? { deepFull: true, curses, relicId } : {}) });
    setFavs(loadFavorites());
    showToast('已收藏到本地');
  }, [ids, mode, selectedCount, showToast, buildName, full, curses, relicId]);

  const exportFavorites = useCallback(() => {
    const blob = new Blob([exportFavoritesJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `nightreign-affix-favorites-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('收藏已导出为 JSON 备份文件');
  }, [showToast]);

  const onImportFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const { imported, skipped } = importFavoritesJson(text);
        setFavs(loadFavorites());
        showToast(
          imported > 0
            ? `已导入 ${imported} 条收藏${skipped > 0 ? `，跳过 ${skipped} 条重复或无效` : ''}`
            : '未发现可导入的有效收藏',
        );
      };
      reader.onerror = () => showToast('读取文件失败，请重试');
      reader.readAsText(file);
      e.target.value = '';
    },
    [showToast],
  );

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
        {mode === 'DEEP_POSITIVE' && <div className="deep-options">
          <label className="deep-toggle"><input type="checkbox" checked={deepFull} onChange={(e) => setDeepFull(e.target.checked)} />开启深夜完整检测（三词条，逐行正负配对）</label>
          {full && <>
            <label className="filter-field">选择游戏内的深夜遗物类型
              <select className="input" value={relicId} onChange={(e) => setRelicId(Number(e.target.value))}>
                {!deepRelics.some((r) => r.id === relicId) && <option value={relicId}>未知遗物 {relicId}，请重新选择</option>}
                {deepRelics.map((r) => <option key={r.id} value={r.id}>{r.name} · ID {r.id}</option>)}
              </select>
            </label>
            <p className="hint">依据游戏数据表与上游逐行校验规则：正面限深夜 A/B/C 池；需诅咒的词条必须在同一行配负面，其余行不得带负面。当前支持三词条深夜遗物，不读取存档。</p>
          </>}
        </div>}
      </div>

      <div className="card">
        <h2>
          <span className="idx-badge">2</span>三个词条
        </h2>
        <p className="hint">{full ? '每列为一行配对：上方选正面，下方选对应负面。没有负面的行请留空。' : '点击槽位搜索词条；冲突会实时标红。'}</p>
        <div className="slots">
          {[0, 1, 2].map((i) => (
            <div className="paired-row" key={i}>
            <AffixPicker
              key={i}
              num={i + 1}
              candidates={candidates}
              selectedId={ids[i]}
              takenIds={takenIds}
              onSelect={(id) => setSlot(i, id)}
              onClear={() => clearSlot(i)}
              invalid={ids[i] != null && problemIds.has(ids[i]!)}
              label={full ? '正面词条' : '槽位'}
            />
            {full && <AffixPicker num={i + 1} label="配对负面（可留空）" candidates={negativeCandidates} selectedId={curses[i]} takenIds={negativeTaken} onSelect={(id) => setCurses((prev) => prev.map((v, j) => i === j ? id : v))} onClear={() => setCurses((prev) => prev.map((v, j) => i === j ? null : v))} invalid={curses[i] != null && problemIds.has(curses[i]!)} />}
            </div>
          ))}
        </div>

        {liveConflicts.length > 0 && (
          <div className="conflict-hint">
            {liveConflicts.map((c, i) => (
              <div key={i}>⚠ {c}</div>
            ))}
          </div>
        )}

        <label className="filter-field build-name">收藏名称（选填）<input className="input" value={buildName} onChange={(e) => setBuildName(e.target.value)} maxLength={80} placeholder="例如：追踪者物理流" /></label>
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
            <div className="verdict-status">{mode === 'DEEP_POSITIVE' && !full && status === CheckStatus.VALID ? '正面预检通过' : statusLabel(status)}</div>
            <div className="verdict-msg">{result.message}</div>
            {status === CheckStatus.INCOMPLETE && (
              <div className="verdict-sub">已选择 {selectedCount} / 3 个词条，选满后自动判定。</div>
            )}

            <div className="verdict-tools">
              {status === CheckStatus.WRONG_ORDER && <button className="btn primary small" onClick={applyOrder}>一键调整顺序{full ? '（保留配对）' : ''}</button>}
              <button className="btn ghost small" onClick={copySummary}>
                复制文本摘要
              </button>
            </div>

            {result.issues.length > 0 && <div className="reasons-label">违规原因</div>}
            {result.issues.map((issue, i) => (
              <div key={i} className={`issue ${issue.kind.toLowerCase()}`}>
                <div className="issue-title">
                  {issueIcon(issue.kind)}
                  {issue.title}
                </div>
                <div className="issue-detail">{issue.detail}</div>
              </div>
            ))}

            {result.warnings.length > 0 && <div className="reasons-label warn">警告提示</div>}
            {result.warnings.map((w, i) => (
              <div key={i} className="warning">
                <div className="issue-title">⚠ {w.title}</div>
                <div className="issue-detail">{w.detail}</div>
              </div>
            ))}

            {orderedEntries.length === 3 && (
              <div className="order-strip">
                <div className="order-label">{status === CheckStatus.INVALID ? '排序参考（排序不能修复内容违规）' : '正确排序'}{full ? '（正负整行配对移动）' : ''}：</div>
                <div className="order-flow">
                  {orderedEntries.map((e, i) => (
                    <span key={e.effectId} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 && <span className="order-arrow">→</span>}
                      <span className="order-chip">
                        <span className="idx">{i + 1}</span>
                        <span className="nm">{e.name}</span>
                        {full && <span className="small muted"> / {getAffix(curses[ids.indexOf(e.effectId)] ?? -1)?.name ?? '无负面'}</span>}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card favs">
        <div className="favs-head">
          <div>
            <h2>本地收藏</h2>
            <p className="hint">保存在浏览器 localStorage，仅本机可见；可导出备份，清理缓存后导入恢复。</p>
          </div>
          <div className="favs-tools">
            <button className="btn ghost small" onClick={exportFavorites}>
              导出
            </button>
            <button className="btn ghost small" onClick={() => fileRef.current?.click()}>
              导入
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
          </div>
        </div>
        {favs.length === 0 ? (
          <EmptyState icon="📦" title="暂无收藏" hint="选满三个词条后点「收藏此组合」即可保存。" />
        ) : (
          favs.map((f) => (
            <div key={f.id} className="fav-item">
              <span className="tag">{CHECK_MODES[f.mode].shortTitle}</span>
              <span className="fav-name">{f.name}</span>
              <span className="fav-ids">{f.ids.join(', ')}</span>
              <span className="spacer" />
              <button className="btn ghost small" onClick={() => {
                const name = window.prompt('收藏的新名称', f.name);
                if (name?.trim()) { renameFavorite(f.id, name); setFavs(loadFavorites()); }
              }}>改名</button>
              <button
                className="btn ghost small"
                onClick={() => {
                  setMode(f.mode);
                  const padded: Array<number | null> = [null, null, null];
                  f.ids.slice(0, 3).forEach((id, i) => (padded[i] = id));
                  setIds(padded);
                  setDeepFull(f.deepFull ?? false);
                  setCurses(f.curses ?? [null, null, null]);
                  setRelicId(f.relicId ?? deepRelics[0].id);
                  setBuildName(f.name);
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
          ))
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function issueIcon(kind: IssueKind): string {
  switch (kind) {
    case IssueKind.DUPLICATE:
      return '🔁 ';
    case IssueKind.CONFLICT:
      return '⛔ ';
    case IssueKind.CURSE_PAIRING:
      return '⚠ ';
    case IssueKind.UNAVAILABLE:
      return '🚫 ';
  }
}

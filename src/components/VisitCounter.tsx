import { useEffect, useState } from 'react';

let request: Promise<number> | undefined;
const CACHE_KEY = 'nightreign.visit.last.v1';
function lastCount(): { value: number; at: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return v && Number.isSafeInteger(v.value) && v.value >= 0 && Number.isFinite(v.at) ? v : null;
  } catch { return null; }
}

// One request per document, including React StrictMode remounts and hash navigation.
function countVisit(): Promise<number> {
  if (request) return request;
  request = new Promise((resolve, reject) => {
    const callback = `nrVisit_${Math.random().toString(36).slice(2)}`;
    const callbacks = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const finish = () => {
      clearTimeout(timeout);
      script.remove();
      // Ignore a response that arrives after our timeout.
      callbacks[callback] = () => {};
      window.setTimeout(() => { delete callbacks[callback]; }, 60_000);
    };
    const timeout = window.setTimeout(() => { finish(); reject(new Error('timeout')); }, 12_000);
    callbacks[callback] = (data: { page_pv?: unknown }) => {
      const n = Number(data?.page_pv);
      finish();
      if (Number.isSafeInteger(n) && n >= 0) resolve(n);
      else reject(new Error('invalid count'));
    };
    script.src = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callback}`;
    // The provider identifies the page using the referrer; URL fragments (builds)
    // are excluded by the browser, so no selected affix IDs are sent.
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.async = true;
    script.onerror = () => { finish(); reject(new Error('unavailable')); };
    document.head.appendChild(script);
  });
  request.catch(() => { request = undefined; });
  return request;
}

export function VisitCounter() {
  const production = location.hostname === 'shuyi-nr.github.io' && location.pathname.startsWith('/nightreign-affix/');
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [cached, setCached] = useState(lastCount);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!production) return;
    let active = true;
    setFailed(false);
    countVisit().then((n) => {
      const snapshot = { value: n, at: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot)); } catch { /* optional cache */ }
      if (active) { setCount(n); setCached(snapshot); }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [production, attempt]);
  return (
    <div className="visit-counter">
      <div aria-live="polite">本站累计浏览 <strong>{count != null ? count.toLocaleString('zh-CN') : !production ? '本地预览不计数' : failed && cached ? cached.value.toLocaleString('zh-CN') : failed ? '暂不可用' : '读取中…'}</strong>{(count != null || (production && failed && cached)) && ' 次'}</div>
      {production && failed && <div role="status">
        <p>{cached ? `上次成功读取：${new Date(cached.at).toLocaleString('zh-CN')}（历史缓存，非实时）` : '统计服务暂时无法连接，当前浏览量未知。'}</p>
        <p>网络或统计服务证书异常时无法读取；词条检测不受影响。</p>
        <button type="button" className="btn ghost small" onClick={() => setAttempt((v) => v + 1)}>重试读取</button>
      </div>}
      <details>
        <summary>统计说明与隐私</summary>
        <p>由 <a href="https://busuanzi.ibruce.info/" target="_blank" rel="noreferrer">不蒜子</a> 提供联网计数；每次打开或刷新页面记录一次，站内切换和选择词条不重复计数。不是独立访客人数，接入前未记录的访问无法补回。</p>
        <p>统计请求会让服务方收到访问 IP、浏览器信息和页面地址（不含 # 后的词条组合）。收藏和检测内容保留在本地。网络或拦截设置可能导致漏计；离线时检测照常可用。</p>
      </details>
    </div>
  );
}

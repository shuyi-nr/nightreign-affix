import { useEffect, useState } from 'react';

let request: Promise<number> | undefined;

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
  return request;
}

export function VisitCounter() {
  const production = location.hostname === 'shuyi-nr.github.io' && location.pathname.startsWith('/nightreign-affix/');
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!production) return;
    let active = true;
    countVisit().then((n) => { if (active) setCount(n); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [production]);
  return (
    <div className="visit-counter">
      <div aria-live="polite">本站累计浏览 <strong>{count != null ? count.toLocaleString('zh-CN') : !production ? '本地预览不计数' : failed ? '暂不可用' : '读取中…'}</strong>{count != null && ' 次'}</div>
      <details>
        <summary>统计说明与隐私</summary>
        <p>由 <a href="https://busuanzi.ibruce.info/" target="_blank" rel="noreferrer">不蒜子</a> 提供联网计数；每次打开或刷新页面记录一次，站内切换和选择词条不重复计数。不是独立访客人数，接入前未记录的访问无法补回。</p>
        <p>统计请求会让服务方收到访问 IP、浏览器信息和页面地址（不含 # 后的词条组合）。收藏和检测内容保留在本地。网络或拦截设置可能导致漏计；离线时检测照常可用。</p>
      </details>
    </div>
  );
}

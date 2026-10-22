import { useState } from 'react';
import { catalog } from '../lib/catalog';
import { readHash, shareUrl } from '../lib/url';
import { CHECK_MODES } from '../lib/engine';
import { copyText } from '../lib/clipboard';

export function Feedback() {
  const [message, setMessage] = useState('');
  const template = () => {
    const s = readHash();
    return `问题描述：\n\n预期结果：\n\n实际结果：\n\n复现链接：${shareUrl(s)}\n检测口径：${CHECK_MODES[s.mode].title}\n数据版本：${catalog.gameVersion} / ${catalog.dataVersion}\n工具版本：2026.10.23\n\n（可补充游戏截图；请勿填写存档、邮箱、手机号等个人信息。）`;
  };
  return (
    <details className="card feedback-panel">
      <summary>发现词条或检测问题？点这里反馈</summary>
      <p className="hint">自动附带当前组合、口径与数据版本。提交到 GitHub 需要登录且反馈公开；也可以复制反馈内容，发给站长。</p>
      <div className="actions">
        <button className="btn" onClick={() => {
          const url = new URL('https://github.com/shuyi-nr/nightreign-affix/issues/new');
          url.searchParams.set('title', '词条 / 检测问题反馈');
          url.searchParams.set('body', template());
          window.open(url.toString(), '_blank', 'noopener,noreferrer');
        }}>提交问题反馈</button>
        <button className="btn ghost" onClick={() => { copyText(template()).then((ok) => setMessage(ok ? '反馈内容已复制，可粘贴给站长。' : '复制失败，请手动记录当前网址与问题描述。')); }}>复制反馈内容</button>
      </div>
      <p role="status" className="hint">{message}</p>
    </details>
  );
}

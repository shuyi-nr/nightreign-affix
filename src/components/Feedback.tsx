import { useState } from 'react';
import { catalog } from '../lib/catalog';
import { readHash, shareUrl } from '../lib/url';
import { CHECK_MODES } from '../lib/engine';
import { copyText } from '../lib/clipboard';
import { gameDataVersion } from '../lib/compendium';

export function Feedback() {
  const [message, setMessage] = useState('');
  const template = () => {
    const s = readHash();
    const dataVersion = s.page==='world'||s.page==='hollow'?'探索资料核对 2026-11-02 / 坐标模式 1.03.2':s.page === 'heroes' || s.page === 'bosses' ? `${gameDataVersion} / regulation 10350000` : s.page === 'nightlord' ? '模式 1.03.2 / 快照 2026-09-26' : `${catalog.gameVersion} / ${catalog.dataVersion}`;
    const pageName = {heroes:'角色数值',bosses:'Boss 抗性',nightlord:'夜王推算',world:'事件与地形',hollow:'大空洞',check:'合法性检测',catalog:'词条查询',rules:'规则说明'}[s.page];
    return `问题描述：\n\n预期结果：\n\n实际结果：\n\n所在页面：${pageName}\n页面链接：${shareUrl(s)}\n检测口径：${CHECK_MODES[s.mode].title}\n数据版本：${dataVersion}\n工具版本：2026.11.02\n\n（角色等级、Boss阶段、推算筛选及地图分布/城内配置请补充描述或截图；请勿填写存档、邮箱、手机号等个人信息。）`;
  };
  return (
    <details className="card feedback-panel">
      <summary>发现数据或检测问题？点这里反馈</summary>
      <p className="hint">自动附带当前组合、口径与数据版本。提交到 GitHub 需要登录且反馈公开；也可以复制反馈内容，发给站长。</p>
      <div className="actions">
        <button className="btn" onClick={() => {
          const url = new URL('https://github.com/shuyi-nr/nightreign-affix/issues/new');
          url.searchParams.set('title', '数据 / 检测问题反馈');
          url.searchParams.set('body', template());
          window.open(url.toString(), '_blank', 'noopener,noreferrer');
        }}>提交问题反馈</button>
        <button className="btn ghost" onClick={() => { copyText(template()).then((ok) => setMessage(ok ? '反馈内容已复制，可粘贴给站长。' : '复制失败，请手动记录当前网址与问题描述。')); }}>复制反馈内容</button>
      </div>
      <p role="status" className="hint">{message}</p>
    </details>
  );
}

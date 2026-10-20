import { useEffect, useState } from 'react';
import { catalog } from './lib/catalog';
import { CheckerPage } from './pages/CheckerPage';
import { CatalogPage } from './pages/CatalogPage';
import { RulesPage } from './pages/RulesPage';
import { MaoChi } from './components/MaoChi';
import type { Page } from './lib/url';
import { buildHash, parseHash } from './lib/url';

const NAV: Array<{ page: Page; label: string }> = [
  { page: 'check', label: '合法性检测' },
  { page: 'catalog', label: '词条查询' },
  { page: 'rules', label: '规则说明' },
];

export default function App() {
  const [page, setPage] = useState<Page>(() => parseHash(window.location.hash).page);

  useEffect(() => {
    const onHash = () => setPage(parseHash(window.location.hash).page);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    // keep current check state when switching back to the checker
    const cur = parseHash(window.location.hash);
    window.location.hash = buildHash({ page: p, mode: cur.mode, ids: cur.ids });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">◆</div>
          <div className="brand-text">
            <h1>
              <span className="gold">黑夜君临</span> · 遗物检测站
            </h1>
            <span className="sub">三词条合法性 / 词条查询 · 纯本地</span>
          </div>
          <span className="version-tag">{catalog.gameVersion}</span>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.page} className={page === n.page ? 'active' : ''} onClick={() => navigate(n.page)}>
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      {page === 'check' && <CheckerPage />}
      {page === 'catalog' && <CatalogPage />}
      {page === 'rules' && <RulesPage />}

      <MaoChi />

      <div className="disclaimer">
        ⚠ 非官方工具，数据仅供参考。词条合法性以游戏内实际表现为准。本地运行，无需联网，无任何数据上传。
      </div>
      <div className="footer">
        数据来源：游戏参数与官方简中文本，以及开源项目{' '}
        <a href="https://github.com/sganggs/nightreign-relic-checker" target="_blank" rel="noreferrer">
          sganggs/nightreign-relic-checker
        </a>
        （授权 MIT / GPL-3.0）。本工具与 FromSoftware / Bandai Namco 无任何关联。
      </div>
    </div>
  );
}

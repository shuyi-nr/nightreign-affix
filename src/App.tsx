import { useEffect, useState } from 'react';
import { catalog } from './lib/catalog';
import { CheckerPage } from './pages/CheckerPage';
import { CatalogPage } from './pages/CatalogPage';
import { RulesPage } from './pages/RulesPage';
import { MaoChi } from './components/MaoChi';
import { VisitCounter } from './components/VisitCounter';
import { Feedback } from './components/Feedback';
import { HeroesPage } from './pages/HeroesPage';
import { BossesPage } from './pages/BossesPage';
import { NightlordPage } from './pages/NightlordPage';
import { WorldPage } from './pages/WorldPage';
import { HollowPage } from './pages/HollowPage';
import type { Page } from './lib/url';
import { buildHash, parseHash } from './lib/url';
import './layout.css';

const NAV_GROUPS: Array<{ label: string; items: Array<{ page: Page; label: string }> }> = [
  {
    label: '遗物工具',
    items: [
      { page: 'check', label: '合法性检测' },
      { page: 'catalog', label: '词条查询' },
    ],
  },
  {
    label: '战斗资料',
    items: [
      { page: 'heroes', label: '角色数值' },
      { page: 'bosses', label: 'Boss 抗性' },
      { page: 'nightlord', label: '夜王推算' },
    ],
  },
  {
    label: '探索指南',
    items: [
      { page: 'world', label: '事件与地形' },
      { page: 'hollow', label: '大空洞' },
    ],
  },
  {
    label: '说明与更新',
    items: [{ page: 'rules', label: '规则说明' }],
  },
];

export default function App() {
  const [page, setPage] = useState<Page>(() => parseHash(window.location.hash).page);
  const activeGroup = NAV_GROUPS.find((group) => group.items.some((item) => item.page === page))!;
  const version = page === 'world' || page === 'hollow'
    ? '探索资料 · 2026.11.02'
    : page === 'heroes' || page === 'bosses'
      ? '参数 v1.03.5 + DLC1'
      : page === 'nightlord'
        ? '模式资料 v1.03.2'
        : catalog.gameVersion;

  useEffect(() => {
    const onHash = () => setPage(parseHash(window.location.hash).page);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    // keep current check state when switching back to the checker
    const cur = parseHash(window.location.hash);
    window.location.hash = buildHash({ ...cur, page: p });
  };

  return (
    <div className="app-shell">
      <header className="app-header site-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">◆</div>
          <div className="brand-text">
            <h1>
              <span className="gold">黑夜君临</span> · 遗物检测站
            </h1>
            <div className="site-header-meta">
              <span className="sub">纯本地</span>
              <span className="version-tag">{version}</span>
            </div>
          </div>
        </div>
        <div className="site-navigation">
          <nav className="site-group-nav" aria-label="用途分类">
            {NAV_GROUPS.map((group) => (
              <button
                key={group.label}
                type="button"
                aria-current={group === activeGroup ? 'true' : undefined}
                aria-controls="site-page-nav"
                onClick={() => navigate(group.items[0].page)}
              >
                {group.label}
              </button>
            ))}
          </nav>
          <nav id="site-page-nav" className="site-page-nav" aria-label={`${activeGroup.label}功能`}>
            {activeGroup.items.map((item) => (
              <button
                key={item.page}
                type="button"
                aria-current={page === item.page ? 'page' : undefined}
                onClick={() => navigate(item.page)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {page === 'check' && <CheckerPage />}
      {page === 'catalog' && <CatalogPage />}
      {page === 'rules' && <RulesPage />}
      {page === 'heroes' && <HeroesPage />}
      {page === 'bosses' && <BossesPage />}
      {page === 'nightlord' && <NightlordPage />}
      {page === 'world' && <WorldPage />}
      {page === 'hollow' && <HollowPage />}

      <MaoChi />
      <Feedback />
      <VisitCounter />

      <details className="site-notes">
      <summary>非官方工具 · 数据来源与使用说明</summary>
      <div className="disclaimer">
        ⚠ 非官方工具，数据仅供参考。词条合法性以游戏内实际表现为准。查询与检测在本地完成，支持离线；公开浏览量使用第三方联网统计。
      </div>
      <div className="footer">
        数据来源：游戏参数与官方简中文本，以及开源项目{' '}
        <a href="https://github.com/sganggs/nightreign-relic-checker" target="_blank" rel="noreferrer">
          sganggs/nightreign-relic-checker
        </a>
        （授权 MIT / GPL-3.0）。本工具与 FromSoftware / Bandai Namco 无任何关联。
      </div>
      </details>
    </div>
  );
}

import { useId, useState } from 'react';
import { attributes, heroes } from '../lib/compendium';
import { DataSourceNote } from '../components/DataSourceNote';

const MAX_STAT = 80;
const RADIUS = 116;
const CENTER = 200;
const colors = ['#e6c17c', '#7abbd9', '#7ac8ab', '#e3a18b', '#bbace4', '#91b4ec', '#d3ca92', '#cc9dbd'];
function point(radius: number, index: number) {
  const angle = -Math.PI / 2 + index * Math.PI / 4;
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}
function ring(radius: number) {
  return attributes.map((_, i) => point(radius, i).join(',')).join(' ');
}

export function HeroesPage() {
  const [key, setKey] = useState(heroes[0].key);
  const [level, setLevel] = useState(15);
  const [active, setActive] = useState<string | null>(null);
  const gradientId = `radar-${useId().replace(/:/g, '')}`;
  const hero = heroes.find(h => h.key === key)!;
  const row = hero.levels.find(l => l.level === level)!;
  const values = attributes.map(a => row.stats[a.key]);
  const outline = values.map((v, i) => point(v / MAX_STAT * RADIUS, i).join(',')).join(' ');
  const strongest = [...attributes].sort((a, b) => row.stats[b.key] - row.stats[a.key]).slice(0, 2);
  const activeIndex = attributes.findIndex(a => a.key === active);

  return <div className="compendium-page heroes-page">
    <div className="card">
      <div className="section-eyebrow">NIGHTFARERS / ATTRIBUTE ATLAS</div>
      <h2>角色数值 · 八维雷达</h2>
      <p className="hint">选一位角色，直观看出八项属性的分布。图上直接标值，右侧属性条方便逐项比较。</p>
      <div className="hero-tabs">{heroes.map(h => <button className={`btn ${h.key === key ? 'primary' : ''}`} aria-pressed={h.key === key} key={h.key} onClick={() => { setKey(h.key); setActive(null); }}>{h.nameZh}</button>)}</div>
      <div className="level-control">
        <label htmlFor="hero-level">角色等级 <strong>Lv. {level}</strong></label>
        <input id="hero-level" type="range" min="1" max="15" value={level} onChange={e => setLevel(Number(e.target.value))}/>
        <span className="tag">{row.isAnchor ? '参数锚点' : '插值等级'}</span>
      </div>
    </div>

    <div className="card hero-profile">
      <div className="hero-profile-head">
        <div><div className="section-eyebrow">NIGHTFARER PROFILE</div><h2>{hero.nameZh}<span>{hero.nameEn}</span></h2></div>
        <div className="hero-level-stamp"><span>LEVEL</span><strong>{String(level).padStart(2, '0')}</strong></div>
      </div>
      <div className="hero-detail">
        <div className="radar-panel">
          <div className="radar-panel-head"><span>基础属性分布</span><span>统一刻度 0—80</span></div>
          <svg className="hero-radar" viewBox="0 0 400 400" role="img" aria-label={`${hero.nameZh} ${level}级八维雷达图，${attributes.map(a => `${a.zh}${row.stats[a.key]}`).join('，')}`}>
            <defs>
              <radialGradient id={`${gradientId}-halo`}><stop offset="0%" stopColor="#d8b66a" stopOpacity=".10"/><stop offset="100%" stopColor="#d8b66a" stopOpacity="0"/></radialGradient>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3d899" stopOpacity=".36"/><stop offset="100%" stopColor="#71a8c9" stopOpacity=".12"/></linearGradient>
            </defs>
            <circle cx={CENTER} cy={CENTER} r="155" fill={`url(#${gradientId}-halo)`}/>
            {[20, 40, 60, 80].map(v => <g key={v}><polygon points={ring(v / MAX_STAT * RADIUS)} className={`radar-grid${v === 80 ? ' outer' : ''}`}/><text x={CENTER + 5} y={CENTER - v / MAX_STAT * RADIUS + 11} className="radar-tick">{v}</text></g>)}
            {attributes.map((a, i) => { const p = point(RADIUS, i); return <line key={a.key} x1={CENTER} y1={CENTER} x2={p[0]} y2={p[1]} className={`radar-axis${a.key === active ? ' is-active' : ''}`}/>; })}
            <polygon className="radar-shape" points={outline} fill={`url(#${gradientId})`}/>
            {activeIndex >= 0 && (() => { const p = point(values[activeIndex] / MAX_STAT * RADIUS, activeIndex); return <line x1={CENTER} y1={CENTER} x2={p[0]} y2={p[1]} className="radar-highlight-axis"/>; })()}
            {attributes.map((a, i) => {
              const p = point(values[i] / MAX_STAT * RADIUS, i);
              const label = point(157, i);
              const isActive = active === a.key;
              return <g key={a.key} className={`radar-vertex${isActive ? ' is-active' : ''}`}>
                <title>{a.zh}：{values[i]}</title>
                {isActive && <circle cx={p[0]} cy={p[1]} r="10" fill={colors[i]} opacity=".2"/>}
                <circle cx={p[0]} cy={p[1]} r={isActive ? 4.5 : 3.5} fill={isActive ? colors[i] : '#f0d69e'} stroke="#18212b" strokeWidth="2"/>
                <text x={label[0]} y={label[1] - 4} textAnchor="middle" className="radar-label">{a.zh}</text>
                <text x={label[0]} y={label[1] + 17} textAnchor="middle" className="radar-number" fill={isActive ? '#fff3cf' : colors[i]}>{values[i]}</text>
              </g>;
            })}
            <circle cx={CENTER} cy={CENTER} r="2" fill="#c9a25c"/>
          </svg>
          <div className="radar-caption"><span className="radar-legend-mark"/>基础属性<span>越靠外，数值越高</span></div>
          <p className="radar-footnote">所有角色使用相同刻度，不随角色自动放大；图形面积不代表综合战力。</p>
        </div>

        <div className="hero-numbers">
          <div className="stat-tiles">{[['血量', 'HP', row.hp], ['专注值', 'FP', row.fp], ['精力', 'STA', row.stamina]].map(([name, code, n]) => <div className="stat-tile" key={name}><span>{name}<small>{code}</small></span><strong>{n}</strong></div>)}</div>
          <div className="attribute-list-head"><h3>属性明细</h3><span>点击属性定位图中顶点</span></div>
          <div className="attribute-list">{attributes.map((a, i) => <button type="button" key={a.key} className={`attribute-row${active === a.key ? ' is-active' : ''}`} aria-pressed={active === a.key} onClick={() => setActive(active === a.key ? null : a.key)}>
            <span className="attribute-name"><i style={{ background: colors[i] }}/>{a.zh}</span>
            <span className="attribute-track" aria-hidden="true"><span style={{ width: `${values[i] / MAX_STAT * 100}%`, background: `linear-gradient(90deg, ${colors[i]}66, ${colors[i]})` }}/></span>
            <strong>{values[i]}</strong>
          </button>)}</div>
          <div className="hero-standouts"><span>当前较高属性</span>{strongest.map(a => <span key={a.key}>{a.zh}<strong>{row.stats[a.key]}</strong></span>)}</div>
        </div>
      </div>
    </div>
    <DataSourceNote/>
  </div>;
}

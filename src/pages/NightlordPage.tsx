import { useMemo, useState } from 'react';
import { filterPatterns, maps, nightNames, nightlords, patterns } from '../lib/compendium';
import { DataSourceNote } from '../components/DataSourceNote';

const firstOptions=[...new Set(patterns.map(p=>p.night1))].sort();
const secondOptions=[...new Set(patterns.map(p=>p.night2))].sort();
export function NightlordPage(){
  const [first,setFirst]=useState('');const [second,setSecond]=useState('');const [earth,setEarth]=useState('');const [scope,setScope]=useState('all');
  const matches=useMemo(()=>filterPatterns(first,second,earth,scope),[first,second,earth,scope]);
  const candidates=Object.entries(nightlords).map(([key,lord])=>({key,...lord,records:matches.filter(p=>p.nightlord===key)})).filter(l=>l.records.length);
  const observed=!!(first||second);
  return <div className="compendium-page"><div className="card"><div className="section-eyebrow">UNKNOWN NIGHTLORD / 03</div><h2>随机夜王 · 候选推算</h2><p className="hint">在夜王被隐藏的远征中，用第一夜和第二夜的主战 Boss 组合反查模式。不要把额外夜 Boss 事件或白天野外 Boss 填进来。</p>
    <div className="selection-grid"><label className="filter-field">第一夜 Boss<select className="input" value={first} onChange={e=>setFirst(e.target.value)}><option value="">未知 / 尚未遇到</option>{firstOptions.map(v=><option key={v} value={v}>{nightNames[v]??v} · {v}</option>)}</select></label><label className="filter-field">第二夜 Boss<select className="input" value={second} onChange={e=>setSecond(e.target.value)}><option value="">未知 / 尚未遇到</option>{secondOptions.map(v=><option key={v} value={v}>{nightNames[v]??v} · {v}</option>)}</select></label><label className="filter-field">地图地形（可选）<select className="input" value={earth} onChange={e=>setEarth(e.target.value)}><option value="">所有地形</option>{Object.entries(maps).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label className="filter-field">资料范围<select className="input" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">未限定 · 基础与 DLC 全部</option><option value="base">仅基础记录 000–319</option><option value="dlc">仅 DLC 记录 1000–1199</option></select></label></div>
    <div className="actions"><button className="btn ghost" onClick={()=>{setFirst('');setSecond('');setEarth('');setScope('all');}}>重置条件</button></div>
  </div>
  <div className="card"><h2>{!observed?'先选择已知的守夜 Boss':candidates.length===1?'资料范围内只剩一位候选':`当前 ${candidates.length} 位夜王候选`}</h2><p className="hint">匹配 {matches.length} / 520 条模式记录。模式数量不是抽选概率；不将每条模式视为等概率，也不凭空给出百分比。</p>
    {!observed?<p>只知道第一夜也能先缩小范围；第二夜结束后再加入条件。地图变化可进一步排除不匹配的模式。</p>:!matches.length?<div className="warning">当前资料中没有匹配记录。请检查两夜 Boss、地形及基础/DLC范围是否选对；也可能是模式资料版本差异。不能据此断言游戏不可能出现该组合。</div>:<div className="prediction-grid">{candidates.map(l=><article className="prediction-card" key={l.key}><span className="section-eyebrow">{l.expedition}</span><h3>{l.name}</h3><p>匹配 <strong>{l.records.length}</strong> 条实际配对记录</p><details><summary>查看模式证据</summary><div className="pattern-evidence">{l.records.map(p=><div key={p.id}><code>#{p.id}</code> {maps[p.earth]}<br/><span>{nightNames[p.night1]??p.night1} → {nightNames[p.night2]??p.night2}</span></div>)}</div></details></article>)}</div>}
    <p className="warning">推算只能缩小资料中可能的夜王范围；普通夜王与永夜之王共享模式，无法由这两夜 Boss 判断是否为永夜形态。此工具不读取游戏或存档，地图资料也不替代游戏内最终揭示。</p>
  </div><DataSourceNote patterns/></div>;
}

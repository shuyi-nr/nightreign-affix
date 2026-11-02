import { useState } from 'react';
import eventFile from '../data/world-events.json';
import { AtlasMap } from '../components/AtlasMap';
import { atlas, pointsForTerrain, terrainGuides, terrainSources, type TerrainId } from '../lib/atlas';
import { buildHash,readHash } from '../lib/url';
import { mapBackgrounds, undergroundBackgrounds } from '../lib/mapBackgrounds';

export function WorldPage(){
 const [tab,setTab]=useState('events');
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('all');
 const [terrainId,setTerrainId]=useState<TerrainId>('crater');
 const [mapLayer,setMapLayer]=useState('surface');
 const guide=terrainGuides.find(g=>g.id===terrainId)??terrainGuides[0];
 const events=eventFile.events.filter(e=>(category==='all'||e.category===category)&&(e.name+e.en+e.signal+e.reward).toLowerCase().includes(query.trim().toLowerCase()));
 const categories:Record<string,string>={raid:'夜王袭击',world:'世界事件',encounter:'其他遭遇'};
 return <div className="world-page">
  <section className="card world-intro"><span className="section-eyebrow">FIELD GUIDE / 01</span><h2>事件与地形</h2><p>随机事件的识别与应对、特殊地形的 Boss 和奖励。出发前查一遍，遇到异变时也能迅速找到办法。</p><div className="world-tabs"><button className={tab==='events'?'active':''} onClick={()=>setTab('events')}>随机事件 <small>{eventFile.events.length}</small></button><button className={tab==='terrain'?'active':''} onClick={()=>setTab('terrain')}>特殊地形 <small>4</small></button><a href={buildHash({...readHash(),page:'hollow'})} onClick={e=>{e.preventDefault();window.location.hash=buildHash({...readHash(),page:'hollow'});}}>大空洞专页 <span>↗</span></a></div></section>
  <details className="data-source"><summary>资料范围与原创配图 · 核对 {atlas.checkedAt}</summary><p>事件机制参考公开参数研究和探索记录；地图 Boss 资料为 {atlas.patternVersion} 快照。不同模式及后续补丁可能存在差异。</p><p>底图为站长亲自在游戏中截取并提供的地图，已清理角色标记；点位叠层为本站制作。原图含当局营地、夜雨等图标，只作为地形参考。未使用第三方攻略站配图。</p><p>Boss 图是多个地图模式的候选总览，不能作为当局必刷清单；没有可靠坐标的奖励只说明相对位置。</p><p>{eventFile.version}</p><ul>{eventFile.notes.map((n,i)=><li key={i}>{n}</li>)}</ul></details>
  {tab==='events'?<>
   <section className="card"><div className="guide-toolbar"><label>搜索事件<input className="input" placeholder="例如：虫群、暴风雪、商人" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>事件类别<select className="input" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">全部事件</option>{Object.entries(categories).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div><p className="hint">13 类特别事件与 2 类独立遭遇，包含 DLC。灾厄营地、普通天秤商人与互斥特别事件分开；完整触发限制见上方资料说明。</p></section>
   <div className="event-grid">{events.map(e=><article key={e.id} className={`event-card event-${e.category}`}><div className="event-card-head"><span className="event-kind">{categories[e.category]}</span><span className="event-code">{e.id.toUpperCase()}</span></div><h3>{e.name}</h3><span className="event-en">{e.en}</span><p className="event-signal">{e.signal}</p><details open><summary>怎么应对</summary><ol>{e.steps.map((s,i)=><li key={i}>{s}</li>)}</ol></details><div className="event-reward"><b>完成收益</b><p>{e.reward}</p></div><p className="event-risk"><b>留意</b> {e.risk}</p><div className="guide-sources">{e.sources.map(id=>{const s=eventFile.sources.find(s=>s.id===id);return s?<a key={id} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>:null;})}</div></article>)}</div>{!events.length&&<div className="card empty-guide">没有匹配的事件，试试其他关键词。</div>}
  </>:<>
   <div className="terrain-tabs">{terrainGuides.map(g=><button key={g.id} style={{'--terrain-color':g.color} as React.CSSProperties} className={terrainId===g.id?'active':''} onClick={()=>{setTerrainId(g.id as TerrainId);setMapLayer('surface');}}><span>{g.en}</span><strong>{g.name}</strong><small>{g.region}</small></button>)}</div>
   <section className="card terrain-detail" style={{'--terrain-color':guide.color} as React.CSSProperties}><div className="terrain-heading"><div><span className="section-eyebrow">SHIFTING EARTH</span><h2>{guide.name}</h2><p>{guide.summary}</p></div><span className="terrain-region">{guide.region}</span></div><div className="guide-columns"><div><h3>推荐处理顺序</h3><ol className="route-steps">{guide.steps.map((s,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></li>)}</ol></div><div className="terrain-reward"><span className="section-eyebrow">SPECIAL REWARD</span><h3>{guide.reward}</h3><p>{guide.rewardLocation}</p><p className="event-risk">{guide.hazard}</p></div></div><p className="hint">{guide.bossTips}</p><div className="guide-sources">{guide.sources.map(id=>{const s=terrainSources.find(s=>s.id===id);return s?<a key={id} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>:null;})}</div></section>
   <div className="map-view-switch" role="group" aria-label="火山地图视图">{terrainId==='crater'&&<><span>地图视图</span><button className={mapLayer==='surface'?'active':''} onClick={()=>setMapLayer('surface')}>地表</button><button className={mapLayer==='underground'?'active':''} onClick={()=>setMapLayer('underground')}>地下土龙区</button></>}</div>
   <AtlasMap key={terrainId+mapLayer} title={`${guide.name} · Boss 与特殊奖励点`} points={terrainId==='crater'?pointsForTerrain(terrainId).filter(p=>mapLayer==='underground'?p.id==='B08':p.id!=='B08'):pointsForTerrain(terrainId)} background={terrainId==='crater'&&mapLayer==='underground'?undergroundBackgrounds.crater:mapBackgrounds[terrainId]} note={`来源：Nightfarer Ledger 的 ${atlas.terrains[terrainId].records} 条地形模式。编号为本站编排，候选总览包括地形外围点。不同 Boss 候选不可理解为同时出现，冰龙等动态触发点以实景为准。`}/>
  </>}
 </div>;
}

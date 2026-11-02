import { useState } from 'react';
import type { MapPoint } from '../lib/atlas';
import type { MapBackground } from '../lib/mapBackgrounds';

const colors={boss:'#e6a08d',crystal:'#8edce9',reward:'#ecd18b'};
export function AtlasMap({title,points,note,background}:{title:string;points:MapPoint[];note:string;background?:MapBackground}) {
 const [selectedId,setSelectedId]=useState('');
 const [zoom,setZoom]=useState(1);
 const [query,setQuery]=useState('');
 const [showBackground,setShowBackground]=useState(true);
 const [showPoints,setShowPoints]=useState(true);
 const [brightness,setBrightness]=useState(85);
 const [failedImage,setFailedImage]=useState('');
 const hasBackground=!!background&&background.image!==failedImage;
 const usingBackground=hasBackground&&showBackground;
 const selected=points.find(p=>p.id===selectedId)??points[0];
 const filtered=points.filter(p=>(p.title+' '+p.detail+' '+p.id).toLowerCase().includes(query.trim().toLowerCase()));
 return <section className="atlas-panel" aria-label={title}>
  <div className="atlas-panel-head"><div><span className="section-eyebrow">{usingBackground?'GAME MAP / FIELD MARKERS':'ORIGINAL POINT ATLAS'}</span><h3>{title}</h3></div><div className="map-zoom"><button className="btn ghost" aria-label="缩小点位图" disabled={zoom===1} onClick={()=>setZoom(Math.max(1,zoom-.5))}>−</button><span>{zoom}×</span><button className="btn ghost" aria-label="放大点位图" disabled={zoom===3} onClick={()=>setZoom(Math.min(3,zoom+.5))}>＋</button></div></div>
  {hasBackground&&<div className="map-layer-controls"><label><input type="checkbox" checked={showBackground} onChange={e=>setShowBackground(e.target.checked)}/>游戏地图底图</label><label><input type="checkbox" checked={showPoints} onChange={e=>setShowPoints(e.target.checked)}/>点位标记</label><label className="map-brightness">底图明暗<input type="range" min="35" max="100" value={brightness} disabled={!usingBackground} onChange={e=>setBrightness(Number(e.target.value))}/><output>{brightness}%</output></label></div>}
  <div className="atlas-layout">
   <div className="atlas-map-column">
    <div className="map-stage" tabIndex={0} aria-label="点位图，可放大后滚动查看">
     <svg className="point-map" style={{width:`${zoom*100}%`}} viewBox={usingBackground&&background?`${background.bounds.x} ${background.bounds.y} ${background.bounds.width} ${background.bounds.height}`:'100 130 880 850'} role="img" aria-label={`${title}，${usingBackground?'游戏地图与点位叠加':'原创坐标示意图'}。地图点与右侧列表对应。`}>
      <defs><pattern id="atlas-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#819bb0" strokeOpacity=".14" strokeWidth="1" /></pattern><radialGradient id="atlas-glow"><stop stopColor="#293e49"/><stop offset="1" stopColor="#0d1820"/></radialGradient></defs>
      <rect width="1000" height="1000" fill="url(#atlas-glow)"/>
      {hasBackground&&background&&<image className="atlas-game-background" href={background.image} x={background.bounds.x} y={background.bounds.y} width={background.bounds.width} height={background.bounds.height} preserveAspectRatio="none" style={{display:usingBackground?'inline':'none',filter:`brightness(${brightness/100})`}} onError={()=>setFailedImage(background.image)}/>}
      {!usingBackground&&<g>
      <rect x="100" y="130" width="880" height="850" fill="url(#atlas-grid)"/>
      <circle cx="530" cy="550" r="320" fill="none" stroke="#c9a25c" strokeOpacity=".08" strokeDasharray="3 12"/>
      <circle cx="530" cy="550" r="210" fill="none" stroke="#c9a25c" strokeOpacity=".06"/>
      <path d="M150 225 V170 M136 190 L150 170 L164 190" fill="none" stroke="#c3d0dc" strokeWidth="2"/><text x="150" y="155" fill="#c3d0dc" fontSize="19" textAnchor="middle">N</text>
      <text x="950" y="166" fill="#7e929e" fontSize="15" textAnchor="end">POINTS • NOT A TERRAIN MAP</text>
      {['A','B','C','D','E','F','G','H'].map((c,i)=><text key={c} x={150+i*100} y="960" fill="#7e929e" fontSize="15" textAnchor="middle">{c}</text>)}
      </g>}
      {(!hasBackground||showPoints)&&points.map(p=><g key={p.id} role="button" tabIndex={0} aria-label={`${p.id} ${p.title}`} aria-pressed={selected?.id===p.id} className="atlas-pin" onClick={()=>setSelectedId(p.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedId(p.id);}}}>
       <title>{`${p.id} · ${p.title}`}</title>
       <circle cx={p.x} cy={p.y} r="25" fill="transparent"/>
       {selected?.id===p.id&&<circle cx={p.x} cy={p.y} r="26" fill={colors[p.kind]} fillOpacity=".13" stroke={colors[p.kind]} strokeWidth="1.5"/>}
       {p.kind==='crystal'?<path d={`M${p.x} ${p.y-12} l10 12 -10 12 -10 -12Z`} fill="#12313d" stroke={colors[p.kind]} strokeWidth="2.5"/>:p.kind==='reward'?<path d={`M${p.x} ${p.y-12} l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1Z`} fill={colors[p.kind]}/>:<circle cx={p.x} cy={p.y} r="9" fill="#3c2728" stroke={colors[p.kind]} strokeWidth="2.5"/>}
       {p.underground&&<path d={`M${p.x-4} ${p.y+14} l4 5 4 -5`} fill="none" stroke={colors[p.kind]} strokeWidth="2"/>}
       <text x={p.x} y={p.y-21} fill={selected?.id===p.id?'#fff3ce':'#c4d5df'} fontSize="17" textAnchor="middle" stroke="#0d1820" strokeWidth="4" paintOrder="stroke">{p.id}</text>
      </g>)}
     </svg>
    </div>
    <div className="map-legend"><span><i style={{background:colors.boss}}/>Boss 候选点</span><span><i style={{background:colors.crystal}}/>共鸣结晶</span><span><i style={{background:colors.reward}}/>特殊奖励</span></div>
    <p className="map-caption">{usingBackground?'游戏截图为一次出击示例，原有营地、夜雨与图标会随局变化；本站编号为候选点总览。可放大查看、单独开关标记，地下与地表请分层查看。':'原创点位图 · 上北下南 · 放大后可滚动。仅表达平面投影，图上网格与装饰圆不代表道路、楼层或可通行地形。'}</p>
    {hasBackground&&background&&<p className="map-image-credit">底图：{background.credit} · <a href={background.permissionReference} target="_blank" rel="noreferrer">来源与使用说明</a></p>}
    {!!background&&failedImage===background.image&&<p className="map-caption" role="status">底图加载失败，已显示点位示意图。点位查询仍可使用。</p>}
   </div>
   <div className="map-info">
    <div className="selected-point" role="status"><span className="section-eyebrow">{selected?.id??'—'} / POINT INTEL</span><h4>{selected?.title??'暂无点位'}</h4><p>{selected?.detail??'此筛选下没有点位，请调整条件。'}</p>{selected&&<small>投影坐标 {selected.x} / {selected.y}</small>}</div>
    <label className="map-search">搜索点位<input className="input" value={query} placeholder="名称或编号，例如 B01" onChange={e=>setQuery(e.target.value)}/></label>
    <div className="point-list" aria-label="地图点位列表">{filtered.map(p=><button key={p.id} className={selected?.id===p.id?'is-active':''} onClick={()=>setSelectedId(p.id)} aria-pressed={selected?.id===p.id}><b style={{color:colors[p.kind]}}>{p.id}</b><span>{p.title}</span>{p.underground&&<small>地下</small>}</button>)}{!filtered.length&&<p className="hint">没有匹配点位。</p>}</div>
   </div>
  </div>
  <p className="atlas-note">{note}</p>
 </section>;
}

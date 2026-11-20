import { useMemo, useState } from 'react';
import { bosses, damageNegation } from '../lib/compendium';
import { DataSourceNote } from '../components/DataSourceNote';

const damageLabels:Record<string,string>={standard:'物理·普通',slash:'物理·斩击',strike:'物理·打击',pierce:'物理·突刺',magic:'魔力',fire:'火',lightning:'雷',holy:'圣'};
const ailmentLabels:Record<string,string>={poison:'中毒',rot:'猩红腐败',bleed:'出血',frost:'冻伤',sleep:'睡眠',madness:'发狂',death:'骤死'};
const roles:Record<string,string>={nightlord:'夜王',night:'守夜',field:'野外',stronghold:'据点',raid:'突袭',event:'事件',evergaol:'封印监牢',prelude:'序章',summon:'召唤物',tower:'塔楼首领',other:'其他',invader:'入侵',mine:'矿坑'};
export function BossesPage(){
  const [query,setQuery]=useState('');const [group,setGroup]=useState('all');const [id,setId]=useState(bosses[0].id);const [npc,setNpc]=useState(0);
  const [location, setLocation] = useState('');
  const locations = [...new Set(bosses.flatMap((b) => b.variants.flatMap((v) => v.locations)))];
  const filtered = useMemo(() => bosses.map((b) => ({
    ...b,
    variants: b.variants.filter((v) => (!location || v.locations.includes(location))
      && (group !== 'resource' || v.roles.some((role) => ['stronghold', 'mine', 'tower'].includes(role)))),
  })).filter((b) => b.variants.length > 0 && (group === 'all' || group === 'resource' || b.group === group)
    && `${b.nameZh} ${b.nameEn} ${b.form} ${b.variants.map((v) => v.label).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())), [query, group, location]);
  const boss=filtered.find(b=>b.id===id)??filtered[0];const variant=boss?.variants.find(v=>v.npcId===npc)??boss?.variants[0];
  return <div className="compendium-page"><div className="card"><h2>首领与资源点抗性</h2><p className="hint">区分夜王形态、战斗阶段和资源点场合。正数代表减伤，负数代表弱点；异常阈值单独列出。</p>
    <div className="filters"><label className="filter-field grow">搜索首领<input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例如：格拉狄乌斯 / 失乡骑士 / 营地"/></label><label className="filter-field">范围<select className="input" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">全部</option><option value="nightlord">夜王 / 永夜形态</option><option value="boss">守夜、野外与资源点</option><option value="resource">资源点首领 / 守卫</option></select></label>
      <label className="filter-field">资源点类型<select className="input" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">所有地点</option>{locations.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
    </div>
    <p className="hint">当前匹配 {filtered.length} 类、{filtered.reduce((n, b) => n + b.variants.length, 0)} 个场合变体。资源点配置随当局变化，请同时核对地点和武器变体。</p>
    {boss&&<div className="selection-grid"><label className="filter-field">首领 / 形态<select className="input" value={boss.id} onChange={e=>{setId(e.target.value);setNpc(0);}}>{filtered.map(b=><option key={b.id} value={b.id}>{b.nameZh} · {b.form}</option>)}</select></label><label className="filter-field">阶段 / 参数变体<select className="input" value={variant?.npcId} onChange={e=>setNpc(Number(e.target.value))}>{boss.variants.map(v=><option key={v.npcId} value={v.npcId}>{v.label} · {v.npcId}{v.uncertain?'（用途待确认）':''}</option>)}</select></label></div>}
  </div>
  {!boss||!variant?<div className="card"><p>没有匹配的首领，请调整名称、范围或地点。</p></div>:<div className="card"><h2>{boss.nameZh}</h2><p className="hint">{boss.form} · {variant.label} · 敌人参数编号 {variant.npcId}</p><div className="boss-tags">{variant.roles.filter(r=>r!=='unplaced').map(r=><span className="tag" key={r}>{roles[r]??'其他场合'}</span>)}</div>{variant.uncertain&&<p className="warning">该变体的阶段或用途标注尚待确认；数值是该参数行的值，请勿直接当作标准战斗阶段。</p>}
    <div className="boss-layout"><div><h3>基础伤害减伤率</h3><div className="damage-chart">{Object.entries(damageLabels).map(([key,label])=>{const rate=variant.damageRates[key];const known=typeof rate==='number'&&Number.isFinite(rate);const reduction=known?damageNegation(rate):null;return <div className={`damage-row ${reduction!=null&&reduction<0?'weakness':''}`} key={key}><span>{label}</span><div className="damage-track"><div style={{width:`${Math.min(100,Math.abs(reduction??0))}%`}}/></div><strong>{reduction==null?'待核实':`${reduction}%`}</strong><small>{known?`承伤 ×${rate}`:'缺少参数'}</small></div>;})}</div><p className="hint">减伤率 = (1 − 承伤倍率) × 100%。例如 −35% 表示多承受 35% 伤害；0% 是正常承伤。条形长度表示偏离正常承伤的幅度；不包含部位或战斗效果额外修正。</p></div>
    <div><h3>异常状态抗性</h3><table className="field-table"><thead><tr><th>异常</th><th>基础累积阈值</th></tr></thead><tbody>{Object.entries(ailmentLabels).map(([key,label])=><tr key={key}><td>{label}</td><td className="mono">{variant.immune.includes(key)?<span className="tag curse">免疫</span>:variant.resist[key]??'待核实'}</td></tr>)}</tbody></table><p className="hint">阈值越高，越难触发；不是减伤百分比。这里不计算多人/深夜累积量倍率、重复触发后的阈值增长或临时异常抗性效果。</p></div></div>
  </div>}<DataSourceNote resources/></div>;
}

import data from '../data/hero-abilities.json';
import { baseAttack, mechanics, type SkillHit } from '../lib/heroMechanics';

const labels: Record<string, string> = { passive: '被动能力', skill: '角色技艺', art: '绝招' };
const relicsById = new Map(data.relics.map((relic) => [relic.effectId, relic]));

function RelatedRelics({ ids }: { ids: number[] }) {
  return <ul className="ability-relics">{ids.map((id) => {
    const relic = relicsById.get(id)!;
    return <li key={id}>
      <div className="ability-relic-title"><h4>{relic.name}</h4>
        <span className="ability-pool">{relic.normal && '普通'}{relic.normal && relic.deep && ' / '}{relic.deep && '深夜'}{relic.isCurse && ' · 负面'}{!relic.normal && !relic.deep && '固定 / 参考'}</span>
      </div>
      {relic.detail && <p>{relic.detail}</p>}
      <span className="ability-effect-id">效果 ID {id}</span>
      {relic.evidence.length > 0 && <details className="ability-evidence"><summary>查看参数依据</summary>
        <ul>{relic.evidence.map(([sp, field, value]) => <li key={`${sp}-${field}`}>SpEffect {sp} · {field} = {value}</li>)}</ul>
      </details>}
    </li>;
  })}</ul>;
}

function HitTable({ hits, level }: { hits: SkillHit[]; level: number }) {
  return <div className="ability-hit-list">{hits.map(hit => <div className="ability-hit" key={`${hit.table}-${hit.id}`}>
    <strong>{hit.label}</strong>
    <dl><div><dt>{hit.growth.length ? `${level} 级基础攻击分量` : '攻击行原始分量'}</dt><dd>{baseAttack(hit, level).map(d => `${d.name} ${d.value}`).join(' + ') || '无直接伤害'}</dd></div>
      <div><dt>基础削韧</dt><dd>{hit.poise}</dd></div><div><dt>冲击等级</dt><dd>{hit.impact}</dd></div></dl>
    {hit.scaling && <p className="hint">{hit.table === 'AtkParam_Npc' ? '另受召唤／兽形专用修正影响。' : '尚未计入角色属性补正。'}</p>}
    <details className="ability-evidence"><summary>命中参数依据</summary>
      <p>{hit.table} · {hit.id}{hit.weaponId !== null && `；虚拟武器 ${hit.weaponId}`}</p>
      {hit.damage.map(d => <p key={d.name}>{d.name}：固定分量 {d.flat}，武器基础 {d.base}，动作倍率 {d.motion}%</p>)}
      <p>救援倍率参数 {hit.revive}%；削韧与冲击等级分别取自攻击行及虚拟武器参数。</p>
    </details>
  </div>)}</div>;
}

export function HeroAbilities({ heroKey, level }: { heroKey: string; level: number }) {
  const hero = data.heroes.find((entry) => entry.key === heroKey)!;
  const details = mechanics.heroes.find(entry => entry.key === heroKey)!;
  return <section className="card hero-abilities" key={heroKey} aria-label="角色技能与遗物影响">
    <h2>技能与遗物影响</h2>
    <p className="hint">基础机制、命中参数与遗物附加效果分开查阅。角色技艺基础冷却：{details.cooldown > 0 ? `${details.cooldown} 秒` : '按召唤、拔刀或属性痕等机制使用'}。</p>
    <div className="ability-grid">{hero.abilities.map((ability) => <article className="ability-card" key={ability.kind}>
      <span className="ability-kind">{labels[ability.kind]}</span>
      <h3>{ability.name}</h3>
      <p className="ability-description">{ability.description}</p>
      <dl className="ability-mechanics">{details.abilities.find(a => a.kind === ability.kind)!.details.map(detail => <div key={detail.title}><dt>{detail.title}</dt><dd>{detail.body}</dd></div>)}</dl>
      {ability.effectIds.length > 0 && <details className="ability-related">
        <summary>相关遗物词条 <span>{ability.effectIds.length}</span></summary>
        <RelatedRelics ids={ability.effectIds}/>
      </details>}
    </article>)}</div>
    {details.abilities.some(a => a.hits.length > 0) && <details className="ability-extra" open>
      <summary>伤害分段、削韧与冲击等级 · {level} 级</summary>
      <p className="hint">“基础攻击分量”含技能武器的等级成长，但未计属性补正、增益、敌人防御及减伤，不能当作最终扣血。削韧用于消耗架势，冲击等级用于命中反应，两者不是同一数值。分段与变体不保证同时命中。</p>
      {details.abilities.filter(a => a.hits.length > 0).map(a => <div className="ability-hit-group" key={a.kind}><h3>{hero.abilities.find(b => b.kind === a.kind)!.name}</h3><HitTable hits={a.hits as SkillHit[]} level={level}/></div>)}
    </details>}
    {heroKey === 'recluse' && <details className="ability-extra" open><summary>全部 14 类混合魔法</summary><p className="hint">组合效果名称为本站中文描述名。攻击行原始分量尚未计入施法修正、增益和敌方防御；持续段按实际命中次数结算。</p><div className="mixture-grid">{mechanics.mixes.map(mix => <article className="mixture-card" key={mix.elements}><span className="ability-kind">{mix.elements}</span><h3>{mix.name}</h3><p className="mixture-recipe">{mix.recipe}</p><p>{mix.description}</p>{mix.hits.length > 0 && <details><summary>伤害分段与控制参数</summary><HitTable hits={mix.hits as SkillHit[]} level={level}/></details>}</article>)}</div></details>}
    {heroKey === 'scholar' && <details className="ability-extra"><summary>道具熟练度 · 九类经验阈值</summary><p className="hint">二、三级是各类别的累计经验阈值，不是使用次数。</p><table className="field-table"><thead><tr><th>类别</th><th>二级</th><th>三级</th></tr></thead><tbody>{mechanics.scholarItems.map(item => <tr key={item.name}><td>{item.name}</td><td>{item.level2}</td><td>{item.level3}</td></tr>)}</tbody></table></details>}
    <details className="ability-extra">
      <summary>其他专属词条与属性变化 <span>{hero.otherEffectIds.length}</span></summary>
      <RelatedRelics ids={hero.otherEffectIds}/>
      <p className="hint">属性变化列出 1 级与 12 级参数锚点；上方雷达图显示角色基础属性。</p>
    </details>
    <details className="ability-extra">
      <summary>通用冷却与绝招量表词条</summary>
      <RelatedRelics ids={data.generalIds}/>
    </details>
    <details className="ability-extra ability-sources">
      <summary>技能资料来源 · {data.checkedAt}</summary>
      <p>基础技能说明按官方角色页整理。相关遗物按效果 ID 与游戏简中词条原文对应；附加数值依据 {data.gameVersion} 的参数快照。技能组合、多人交互与多条遗物叠加的实际结果仍需相应的游戏验证。</p>
      <p>通用攻击增益对各技能命中段的适用范围，需结合具体攻击数据核对。</p>
      <p>技能细节另逐项对照本机游戏 regulation 参数与固定版本的参数定义；重演窗口、共感术传递比例等未确认项已就地标注。表中保留原始参数编号，便于复核。</p>
      <p><a href={mechanics.sources.definitions} target="_blank" rel="noreferrer">参数定义与行名来源</a> · <a href={mechanics.sources.advanced} target="_blank" rel="noreferrer">官方进阶机制说明</a> · <a href={mechanics.sources.dlc} target="_blank" rel="noreferrer">学者与送葬者官方说明</a></p>
      <p><a href={hero.source} target="_blank" rel="noreferrer">当前角色官方说明</a> · <a href={data.sources.gameplay} target="_blank" rel="noreferrer">官方玩法指南</a> · <a href={data.sources.affixes} target="_blank" rel="noreferrer">词条数据</a> · <a href={data.sources.parameters} target="_blank" rel="noreferrer">数值参数</a></p>
      <p>中文技能名对照游戏菜单原文汇录。<a href={data.sources.chineseNames} target="_blank" rel="noreferrer">本体菜单文本</a> · <a href={data.sources.chineseDlcNames} target="_blank" rel="noreferrer">DLC 菜单文本</a></p>
    </details>
  </section>;
}

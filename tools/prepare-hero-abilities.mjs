// Rebuild the small character guide from official descriptions and pinned game data.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const affixes = read('src/data/affixes.json').affixes;
const modifiers = read('upstream/data/nightreign-heroes-v1.03.5.json').statModifiers;
const buffs = read('upstream/data/nightreign-buffs-v1.03.5.json').buffs;
const ability = (kind, name, description, effectIds = []) => ({ kind, name, description, effectIds });
const heroes = [
  { key: 'wylder', prefix: '追踪者', abilities: [
    ability('passive', '第六感', '受到致命攻击时触发一次保命能力。死亡复活或在赐福休息后可恢复使用机会。', [7032400]),
    ability('skill', '钩爪射击', '发射钩爪牵引敌人，或借收回钩爪迅速接近目标。', [6500000, 7020000, 7033200]),
    ability('art', '袭击桩柱', '打出伴随爆炸的铁桩重击。', [7010500]),
  ] },
  { key: 'guardian', prefix: '守护者', abilities: [
    ability('passive', '强力防御', '站稳脚步并架盾，进入强化防御姿态。', [7033400]),
    ability('skill', '旋风', '振翅卷起旋风，攻击周围敌人。', [6500100, 7011000]),
    ability('art', '救世展翼', '跃起后俯冲落地，形成保护区域。', [7012000]),
  ] },
  { key: 'ironeye', prefix: '铁之眼', abilities: [
    ability('passive', '观察入微', '提升发现战利品的能力，使敌人更容易掉落物品，效果也适用于队友。'),
    ability('skill', '标记', '以短刀划伤敌人，使目标暂时显露弱点。', [6500200, 7270100, 7280000]),
    ability('art', '穿杨一箭', '射出具有强大贯穿能力的高速箭矢。', [7034600, 7034700]),
  ] },
  { key: 'duchess', prefix: '女爵', abilities: [
    ability('passive', '优雅身段', '擅长节省攻击与闪避的精力，能够连续闪避。'),
    ability('skill', '重演', '让附近敌人再次承受最近一段时间内发生的伤害。', [6500300, 7010700, 7290000]),
    ability('art', '落幕之章', '隐去自己与周围队友的身形，暂时躲避敌人的注意。', [7032700]),
  ] },
  { key: 'raider', prefix: '无赖', abilities: [
    ability('passive', '好胜心', '承受伤害会强化反击技艺；强化反击时能抵抗击倒。'),
    ability('skill', '反击', '摆出架势后挥拳反击，架势期间减轻来袭伤害；强化后可使大型敌人踉跄。', [6500400, 7031300]),
    ability('art', '图腾碑石', '在地面唤起巨型墓碑，强化附近队友，也可阻挡箭矢并供攀爬。', [7310000]),
  ] },
  { key: 'revenant', prefix: '复仇者', abilities: [
    ability('passive', '死灵术', '召出被击败敌人的灵魂，暂时作为友方参战。', [6500500]),
    ability('skill', '召唤灵魂', '弹奏竖琴，选择召唤海伦、弗雷德利克或塞巴斯蒂安参战。', [7220000]),
    ability('art', '不死行军', '暂时赋予自己与周围队友不死效果，救起濒死队友，并让家人进入强化状态。', [7010900, 7011200, 7031200]),
  ] },
  { key: 'recluse', prefix: '隐士', abilities: [
    ability('passive', '驾驭元素', '识别可收集的属性痕，收集后恢复专注值。', [6500600, 7032800]),
    ability('skill', '混合魔法', '收集目标身上的属性痕，再将不同属性组合为混合魔法。', [6500600, 7032800]),
    ability('art', '血魂歌', '咏唱禁忌血歌，在周围敌人身上刻下血印。', [7032900, 7034100]),
  ] },
  { key: 'executor', prefix: '执行者', abilities: [
    ability('passive', '不屈', '从异常状态中恢复后，暂时提升攻击力与精力恢复速度。', [6500700]),
    ability('skill', '妖刀', '拔出妖刀，精准防御可弹开攻击；连续弹开攻击后解放刀身，获得强化攻击。持刀时无法奔跑。', [7034400, 7034500]),
    ability('art', '熔炉百相之兽', '变身为原始野兽，以兽形发动攻击。', [7011700]),
  ] },
  { key: 'scholar', prefix: '学者', abilities: [
    ability('passive', '携物知识', '可携带更多道具；使用道具可提升对应类别的熟练度，解锁强化效果与额外效果。'),
    ability('skill', '探索', '观察目标并推进分析，记录可对目标产生效果。增加敌人样本、取得特殊记录和观察队友有助于推进分析。', [6500800, 7036200, 7036300, 7036500]),
    ability('art', '共感术', '用书页连结敌人与队友。连结敌人间可传递伤害，也可恢复连结队友的血量；遭连结敌人攻击时可反伤。', [7036400]),
  ] },
  { key: 'undertaker', prefix: '送葬者', abilities: [
    ability('passive', '感知力量', '附近队友发动绝招，或吸收特定敌人的黑暗攻击后，可获得额外发动绝招的机会。'),
    ability('skill', '恍惚', '进入强化状态，提高机动能力，连续攻击可提升攻击力；消耗绝招量表可进一步强化。', [6500900]),
    ability('art', '不祥一击', '抽出体内异骨，快速飞向目标并发动重击，可在空中移动。', [6500900, 7036800, 7037300]),
  ] },
];

// Extra numbers are included only when a specific linked parameter has been checked.
const numericNotes = {
  6500000: ['钩爪相关的两个效果参数分别提供 60、55 点出血累积。', [[7500001, 'bloodAttackPower', 60], [7500002, 'bloodAttackPower', 55]]],
  6500400: ['目标五类攻击倍率设为 0.87，参数持续时间为 13 秒。', [[7500401, 'physicsAttackRate', 0.87], [7500401, 'duration', 13]]],
  6500800: ['给自己的分析增益参数中，战技、魔法及祷告的专注值消耗倍率均为 0.85，持续 40 秒。', [[7500801, 'artsConsumptionRate', 0.85], [7500801, 'magicConsumptionRate', 0.85], [7500801, 'miracleConsumptionRate', 0.85], [7500801, 'duration', 40]]],
  7010700: ['追加再演的伤害倍率参数为 0.4。', [[7010701, 'restageAttackRate', 0.4]]],
  7031200: ['强化效果的五类攻击倍率为 1.25，持续 30 秒。', [[7031202, 'physicsAttackRate', 1.25], [7031202, 'duration', 30]]],
  7033200: ['增加 1 次可储存的角色技艺使用次数。', [[7033200, 'additionalCharacterSkillUse', 1]]],
  7036800: ['发动后的增益五类攻击倍率为 1.18，持续 40 秒。', [[7036801, 'physicsAttackRate', 1.18], [7036801, 'duration', 40]]],
  7270100: ['增加 1 次可储存的角色技艺使用次数。', [[7270100, 'additionalCharacterSkillUse', 1]]],
  7290000: ['强化再演的伤害倍率参数为 0.6。', [[7290001, 'restageAttackRate', 0.6]]],
  7310000: ['墓碑有效时间参数为 30 秒。', [[7310001, 'ultimateArtDuration', 30]]],
};
const generalIds = [7000800, 7000801, 7000802, 7000900, 7000901, 7000902, 7030600, 6030600, 7030800, 6030800, 7090000, 6090000, 6840200];
for (const [index, id] of [7000800, 7000801, 7000802].entries()) {
  const value = [0.95, 0.925, 0.9][index];
  numericNotes[id] = [`角色技艺冷却时间乘以 ${value}，单条缩短 ${[5, 7.5, 10][index]}%。`, [[id, 'characterSkillCooldownReduction', value]]];
}
for (const [index, id] of [7000900, 7000901, 7000902].entries()) {
  const value = [1.05, 1.075, 1.1][index];
  numericNotes[id] = [`绝招量表自然累积速率参数为 ${value} 倍。`, [[id, 'ultimateArtGaugeRate', value]]];
}

const relicById = new Map(affixes.map((a) => [a.effectId, a]));
const entry = (id) => {
  const a = relicById.get(id);
  assert.ok(a, `Missing affix ${id}`);
  let [detail, evidence] = numericNotes[id] ?? ['', []];
  const modifier = modifiers.find((m) => m.affixId === id);
  if (modifier) {
    const names = { vigor: '生命力', mind: '集中力', endurance: '耐力', strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
    detail = modifier.anchors.map((a) => `${a.level} 级时${Object.entries(a.delta).map(([key, value]) => `${names[key]} ${value > 0 ? '+' : ''}${value}`).join('、')}`).join('；') + '。';
  }
  for (const [spEffectId, field, expected] of evidence) {
    const buff = buffs.find((b) => b.spEffectId === spEffectId);
    assert.ok(buff?.relicAffixes?.some((r) => r.catalogEffectId === id)
      || buff?.sources.some((s) => s.kind === 'relicAffix' && s.id === id), `Unlinked parameter ${id}/${spEffectId}`);
    assert.equal(field === 'duration' ? buff.duration : buff.rates[field], expected);
  }
  return { effectId: id, name: a.name, detail, evidence, isCurse: a.isCurse, normal: a.poolIds.some((p) => [110, 210, 310].includes(p)), deep: a.poolIds.some((p) => [2000000, 2100000, 2200000, 3000000].includes(p)) };
};
for (const hero of heroes) {
  hero.source = `https://en.bandainamcoent.eu/elden-ring/elden-ring-nightreign/characters/${hero.key}`;
  const associated = new Set(hero.abilities.flatMap((a) => a.effectIds));
  hero.otherEffectIds = affixes.filter((a) => a.name.startsWith(`【${hero.prefix}】`) && !associated.has(a.effectId)).map((a) => a.effectId);
  for (const id of [...associated, ...hero.otherEffectIds]) assert.ok(relicById.get(id)?.name.startsWith(`【${hero.prefix}】`));
}
const allIds = [...new Set([...heroes.flatMap((h) => [...h.abilities.flatMap((a) => a.effectIds), ...h.otherEffectIds]), ...generalIds])];
const output = {
  gameVersion: 'regulation 1.03.5 + DLC1', checkedAt: '2026-11-20',
  sources: {
    official: 'https://nightreign.eldenring.jp/news.html',
    gameplay: 'https://www.bandainamcoent.com/games/nightreign/gameplay-guide',
    chineseNames: 'https://wiki.biligame.com/nightreign/三语:所有菜单文本',
    chineseDlcNames: 'https://wiki.biligame.com/nightreign/三语:所有菜单文本_dlc01',
    affixes: 'https://github.com/sganggs/nightreign-relic-checker/blob/6fe8267682149568058649b5f25a1481ac06384e/data/nightreign-affixes-v1.03.4.json',
    parameters: 'https://github.com/sganggs/nightreign-relic-checker/blob/6fe8267682149568058649b5f25a1481ac06384e/data/nightreign-buffs-v1.03.5.json',
  },
  inputSha256: createHash('sha256').update(readFileSync(new URL('upstream/data/nightreign-buffs-v1.03.5.json', root))).digest('hex'),
  heroes, relics: allIds.map(entry), generalIds,
};
writeFileSync(new URL('src/data/hero-abilities.json', root), JSON.stringify(output, null, 2) + '\n');
console.log(`Prepared ${heroes.length} characters, ${heroes.length * 3} abilities and ${allIds.length} related affixes.`);

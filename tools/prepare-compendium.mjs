// Curate factual fields only. Raw research downloads remain in ignored tools/shots/.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, d) => fs.writeFileSync(`src/data/${p}.json`, JSON.stringify(d, null, 2) + '\n');
const h = read('upstream/data/nightreign-heroes-v1.03.5.json');
const b = read('upstream/data/nightreign-bosses-v1.03.5.json');
const metadata = (d, file) => ({ gameVersion: d.gameVersion, dataVersion: d.dataVersion, verifiedAt: '2026-10-31', source: 'https://github.com/sganggs/nightreign-relic-checker', inputFile: file, inputSha256: createHash('sha256').update(fs.readFileSync(`upstream/data/${file}`)).digest('hex'), sources: d.sources, caveats: d.caveats });
write('heroes', { ...metadata(h, 'nightreign-heroes-v1.03.5.json'), attributes: h.statNames.attributes.map(({ key, zh, en }) => ({ key, zh, en })), heroes: h.heroes.map(({ key, nameZh, nameEn, levels }) => ({ key, nameZh, nameEn, levels: levels.map(({level,isAnchor,stats,derived})=>({level,isAnchor,stats,hp:derived.hp,fp:derived.fp,stamina:derived.stamina})) })) });
const locationNames = [
  [/Underground.*Fort|地下堡垒/i, '地下要塞'], [/Encampment|营地/i, '营地'],
  [/Castle|城堡/i, '城堡'], [/Fort|堡垒/i, '堡垒'], [/Ruin|遗迹/i, '遗迹'],
  [/Smithy|铁匠铺/i, '铁匠铺'], [/Cathedral|Great Church|大教堂/i, '大教堂'],
  [/Marsh|Swamp|沼泽/i, '沼泽'], [/Mine|矿坑|坑道/i, '矿坑'],
  [/East\/West Tower|东西塔楼/i, '大空洞塔楼'], [/Sorcerer.*Rise|魔法师塔/i, '魔法师塔'],
];
const variant = (v) => {
  const label = (v.labelZh || v.labelEn).replace('Paramdex', '参数行名');
  const evidence = Object.values(v.roleEvidence ?? {}).flat().map((e) => e.note).join(' ');
  const locations = locationNames.filter(([pattern]) => pattern.test(label + ' ' + evidence)).map(([, name]) => name);
  if (!locations.length && v.roles?.includes('stronghold')) locations.push('其他据点');
  return { npcId:v.npcId, label, uncertain:!!v.labelUncertain, damageRates:v.damageRates, resist:v.resist, immune:v.immune, roles:v.roles, locations };
};
// noReward is not an unused-row flag: real phase bodies often delegate rewards.
const valid = (v) => v.roles?.some((r)=>r!=='unplaced');
const bosses = b.nightlords.map((n)=>({id:`lord-${n.menuId}`,nameZh:n.nameZh,nameEn:n.nameEn,group:'nightlord',form:n.variantNameZh || (n.everdark?'永夜之王':'普通'),variants:n.fights.filter(valid).map(variant)}));
for (const n of b.nightBosses) {
  if (n.hidden) continue;
  const variants = n.variants.filter(valid).map(variant);
  if (variants.length) bosses.push({id:n.id,nameZh:n.nameZh || n.nameEn,nameEn:n.nameEn,group:'boss',form:'按场合 / 阶段选择',variants});
}
const chineseBossNames = {
  'Large Golden Hippopotamus': '大型黄金河马', 'Storm King': '风暴之王',
  'Alabaster Lord': '白王', 'Cemetery Shade': '墓地影子', 'Dreg Wormface': '污秽蚯蚓脸',
  'Fingercreeper': '指怪', 'Fire Knight': '火焰骑士', 'Fire Knight Captain': '火焰骑士队长',
  'Fire Knight Elder': '火焰骑士长者', 'Fire Knight Sage': '火焰骑士贤者',
  'Frenzied Miranda': '癫火米兰达之花', 'Funeral Steed': '送葬马',
  'Giant Skeleton Torso': '巨型骷髅上半身', 'Onyx Lord': '黑王', 'Putrid Flesh': '腐败肉块', 'Troll': '山妖',
};
for (const extra of read('src/data/resource-bosses.json').bosses) {
  const existing = bosses.find((boss) => boss.nameEn === extra.nameEn);
  if (existing) {
    existing.nameZh = extra.nameZh;
    for (const v of extra.variants) if (!existing.variants.some((old) => old.npcId === v.npcId)) existing.variants.push(v);
  } else bosses.push(extra);
}
for (const boss of bosses) {
  boss.nameZh = chineseBossNames[boss.nameEn] ?? boss.nameZh;
  if (/[A-Za-z]/.test(boss.nameZh)) throw Error(`Missing Chinese boss name: ${boss.nameZh}`);
}
write('bosses', {...metadata(b,'nightreign-bosses-v1.03.5.json'),verifiedAt:'2026-11-20',bosses:bosses.filter(n=>n.variants.length)});
const maps=['limveld','crater','mountaintop','rotted_woods','noklateo','great_hollow'];
const aliases = { 'Demihuman Queen & Swordmaster':'Demi-Human Queen and Swordmaster', "Night's Cavalries":"Night's Cavalry Duo", "Duke's Dear Freja":"The Duke's Dear Freja", 'Tree Sentinel':'Tree Sentinel and Royal Cavalrymen','Crucible Knight & Hippo':'Crucible Knight and Golden Hippopotamus','Draconic Tree Sentinel':'Draconic Tree Sentinel and Royal Cavalrymen','Dancer':'Dancer of the Boreal Valley' };
const normalized = (s) => aliases[s] ?? s;
const patterns=maps.flatMap(earth=>read(`tools/shots/records-${earth}.json`).patterns.map(p=>({id:p.id,earth,nightlord:p.nightlord,night1:normalized(p.night1?.boss),night2:normalized(p.night2?.boss)})));
if(patterns.length!==520 || new Set(patterns.map(p=>p.id)).size!==520 || patterns.some(p=>!p.night1||!p.night2))throw Error('Incomplete pattern snapshot');
write('night-patterns',{gameVersion:'1.03.2',verifiedAt:'2026-10-31',snapshotDate:'2026-09-26',source:'https://nightfarerledger.com/nightmap',originalSource:'https://nightreign-seed-finder.com/faq',credits:['Artimuz','thefifthmatt','kevins78'],sourceFiles:maps.map(m=>`https://nightfarerledger.com/nightreign/nightmap/${m}.json`),aliases,patterns});
console.log(`Prepared ${h.heroes.length} heroes, ${bosses.filter(n=>n.variants.length).length} boss groups, ${patterns.length} exact pattern pairs.`);

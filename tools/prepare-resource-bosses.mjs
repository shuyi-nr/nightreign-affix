
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='tools/shots/hero-details/';
const read = name => JSON.parse(fs.readFileSync(base+name+'.json','utf8'));
const names=new Map(read('NpcParam-names').Entries.map(n=>[n.ID,n.Entries[0]]));
const rows=new Map(read('NpcParam').map(r=>[r.ID,r]));
const damageFields={standard:'neutralDamageCutRate',slash:'slashDamageCutRate',strike:'blowDamageCutRate',pierce:'thrustDamageCutRate',magic:'magicDamageCutRate',fire:'fireDamageCutRate',lightning:'thunderDamageCutRate',holy:'darkDamageCutRate'};
const resistFields={poison:'resist_poison',rot:'resist_desease',bleed:'resist_blood',frost:'resist_freeze',sleep:'resist_sleep',madness:'resist_madness',death:'resist_curse'};
const pick=(r,fields)=>Object.fromEntries(Object.entries(fields).map(([k,f])=>{assert.equal(typeof r[f],'number',f);return[k,Number(r[f].toFixed(6))]}));
const specs=[
 ['失乡骑士','Banished Knight',[[30100270,'营地 · 剑盾'],[30101250,'营地 · 双剑'],[30102240,'营地 · 戟'],[30100010,'城堡 · 剑盾'],[30101010,'城堡 · 双剑'],[30102010,'城堡 · 戟'],[30100280,'城堡 · 红眼剑盾'],[30101260,'城堡 · 红眼双剑']]],
 ['君王军队长','Lordsworn Captain',[[43510020,'堡垒 · 队长']]],
 ['罗德尔骑士','Leyndell Knight',[[43530035,'营地 · 首领'],[43530030,'营地 · 塔旁剑盾'],[43531030,'营地 · 中央'],[43532030,'营地 · 投石机旁']]],
 ['红狮子骑士','Redmane Knight',[[43540015,'营地 · 首领'],[43541010,'营地 · 投石机旁'],[43542010,'营地 · 塔中']]],
 ['南瓜头士兵','Mad Pumpkin Head',[[43401010,'营地 · 南瓜头']]],
 ['魔像守卫','Guardian Golem',[[46601010,'堡垒 · 魔像']]],
 ['结晶人','Crystalian',[[33500020,'堡垒 · 结晶人']]],
 ['大型白金之子','Large Albinauric',[[34715315,'遗迹 · 首领'],[34715310,'遗迹 · 守卫']]],
 ['战场魔法师','Battlemage',[[37040025,'遗迹 · 首领']]],
 ['法姆·亚兹拉兽人','Azula Beastman',[[39701125,'遗迹 · 首领变体'],[39701120,'遗迹 · 首领']]],
 ['火焰主教','Fire Prelate',[[39100130,'火山口 · 雾门旁'],[39100140,'火山口'],[39101120,'火山口 · 第二武器变体']]],
 ['恶兆之子','Omen',[[21400310,'地下要塞 · 东方要塞剑型精英'],[21401310,'地下要塞 · 东方要塞斧型精英']]],
 ['白金之子弓箭手','Albinauric Archer',[[31700020,'山顶遗迹 · 首领'],[31700040,'遗迹 · 首领']]],
 ['白金之子的狼','Albinauric Archer Wolf',[[31800020,'山顶遗迹 · 弓手伴随狼'],[31800030,'遗迹 · 弓手伴随狼']]],
 ['鲜血贵族','Sanguine Noble',[[35500010,'遗迹']]],
 ['堕落调香师','Depraved Perfumer',[[37000010,'遗迹 · 守卫']]],
 ['调香师','Perfumer',[[37010030,'遗迹 · 守卫']]],
 ['辉石魔法师','Glintstone Sorcerer',[[37020030,'堡垒 · 首领']]],
 ['魔法师球','Graven Mass',[[37300210,'地下要塞 · 西方要塞精英']]],
 ['归树看门犬','Erdtree Burial Watchdog',[[42601610,'遗迹 · 权杖']]],
 ['火焰战车','Flame Chariot',[[44600015,'营地 · 带首领血条']]],
 ['卢恩熊','Runebear',[[46300010,'遗迹 · 棕色'],[46300210,'遗迹 · 银色']]],
 ['恶兆猎人','Omenkiller',[[48200020,'地下要塞 · 西方要塞精英']]],
 ['血怪之首','Chief Bloodfiend',[[50810020,'遗迹 · 首领']]],
 ['大型蜘蛛蝎','Large Spider Scorpion',[[51920020,'遗迹 · 集群首领成员']]],
 ['萨米尔的古英雄','Ancient Hero',[[71000115,'遗迹 · 带首领血条']]],
 ['睡眠巨蟹','Giant Sleep Crab',[[22740030,'大教堂 · 集群首领成员']]],
 ['仿身泪滴（山妖）','Mimic Tear Troll',[[33201110,'大教堂 · 集群首领成员']]],
 ['唤灵蜗牛','Spiritcaller Snail',[[41402210,'大教堂 · 首领']]],
 ['拷问官（肥大型）','Fat Inquisitor',[[53200010,'大教堂 · 首领']]],
];
const resourceBosses=specs.map(([nameZh,nameEn,variants])=>({
 id:'resource-'+variants[0][0],nameZh,nameEn,group:'boss',form:'资源点首领 / 相关守卫',
 variants:variants.map(([npcId,label])=>{
  const r=rows.get(npcId);assert.ok(r,npcId);
  const resist=pick(r,resistFields);
  const place=label.split(' · ')[0];
  return {npcId,label,uncertain:false,damageRates:pick(r,damageFields),resist,immune:Object.keys(resist).filter(k=>resist[k]>=999),roles:['stronghold'],locations:place==='山顶遗迹'?['遗迹','山顶遗迹']:[place],evidence:{npcId,rowName:names.get(npcId),fields:[...Object.values(damageFields),...Object.values(resistFields)]}};
 })
}));
fs.writeFileSync('src/data/resource-bosses.json',JSON.stringify({gameVersion:'regulation 10350000',verifiedAt:'2026-11-20',regulationSha256:createHash('sha256').update(fs.readFileSync('D:/SteamLibrary/steamapps/common/ELDEN RING NIGHTREIGN/Game/regulation.bin')).digest('hex'),bosses:resourceBosses},null,2)+'\n');
console.log(resourceBosses.length,resourceBosses.flatMap(b=>b.variants).length);


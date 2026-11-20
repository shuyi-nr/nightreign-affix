import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const folder='tools/shots/hero-details/';
const cache=new Map();
const table=name=>{if(!cache.has(name))cache.set(name,new Map(read(folder+name+'.json').map(r=>[r.ID,r])));return cache.get(name);};
const npcs=table('NpcParam'), attacks=table('AtkParam_Pc'),npcAttacks=table('AtkParam_Npc'),weapons=table('EquipParamWeapon'),reinforce=table('ReinforceParamWeapon');
const bosses=read('src/data/bosses.json').bosses, mechanics=read('src/data/hero-mechanics.json');
const damageFields={standard:'neutralDamageCutRate',slash:'slashDamageCutRate',strike:'blowDamageCutRate',pierce:'thrustDamageCutRate',magic:'magicDamageCutRate',fire:'fireDamageCutRate',lightning:'thunderDamageCutRate',holy:'darkDamageCutRate'};
const resistFields={poison:'resist_poison',rot:'resist_desease',bleed:'resist_blood',frost:'resist_freeze',sleep:'resist_sleep',madness:'resist_madness',death:'resist_curse'};
const close=(a,b,label)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.00001,label);
let damageNumbers=0,ailmentNumbers=0,hitNumbers=0;
for(const b of bosses){assert.ok(!/[A-Za-z]/.test(b.nameZh),b.nameZh);for(const v of b.variants){
 const r=npcs.get(v.npcId);assert.ok(r,v.npcId);
 for(const [key,field]of Object.entries(damageFields)){close(v.damageRates[key],r[field],`${v.npcId}.${key}`);damageNumbers++;}
 for(const [key,field]of Object.entries(resistFields)){close(v.resist[key],r[field],`${v.npcId}.${key}`);ailmentNumbers++;assert.equal(v.immune.includes(key),r[field]>=999,`${v.npcId} immunity ${key}`);}
}}
for(const fact of mechanics.evidence)close(fact.value,table(fact.table).get(fact.id)[fact.field],`${fact.table} ${fact.id} ${fact.field}`);
const channels={物理:['attackBasePhysics','physicsAtkRate','atkPhys','atkPhysCorrection'],魔力:['attackBaseMagic','magicAtkRate','atkMag','atkMagCorrection'],火:['attackBaseFire','fireAtkRate','atkFire','atkFireCorrection'],雷:['attackBaseThunder','thunderAtkRate','atkThun','atkThunCorrection'],圣:['attackBaseDark','darkAtkRate','atkDark','atkDarkCorrection']};
for(const h of [...mechanics.heroes.flatMap(h=>h.abilities.flatMap(a=>a.hits)),...mechanics.mixes.flatMap(m=>m.hits)]){
 const a=(h.table==='AtkParam_Pc'?attacks:npcAttacks).get(h.id),w=h.weaponId===null?null:weapons.get(h.weaponId);assert.ok(a);
 close(h.poise,a.atkSuperArmor+(w?w.saWeaponDamage*a.atkSuperArmorCorrection/100:0),'poise');
 assert.equal(h.impact,a.dmgLevel);assert.equal(h.revive,a.reviveDamageCorrection);
 for(const d of h.damage){const [base,growth,flat,mv]=channels[d.name];close(d.flat,a[flat],'flat');close(d.motion,a[mv],'motion');close(d.base,w?.[base]??0,'base');
   for(let i=0;i<h.growth.length;i++){close(h.growth[i][d.name],reinforce.get(w.reinforceTypeId+i)[growth],'growth');hitNumbers++;}
 }
 hitNumbers+=3+h.damage.length*3;
}
const extra=read('src/data/resource-bosses.json');
// Ensure no row explicitly labelled as a resource-site boss/elite is left out.
const represented=new Set(bosses.flatMap(b=>b.variants.map(v=>v.npcId)));
const site='Encampment|Fort|Ruin|Castle|Mine|Smithy|Church|Cathedral|Rise|Cave|Tunnel';
const tagged=new RegExp(`(${site}).*(Boss|Elite|healthbar)|(Boss|Elite|healthbar).*(${site})`);
const explicitRows=read(folder+'NpcParam-names.json').Entries.filter(r=>r.Entries.some(n=>tagged.test(n)));
for(const r of explicitRows)assert.ok(represented.has(r.ID),`Missing named resource leader ${r.ID} ${r.Entries[0]}`);
const sha256=createHash('sha256').update(fs.readFileSync('D:/SteamLibrary/steamapps/common/ELDEN RING NIGHTREIGN/Game/regulation.bin')).digest('hex');
assert.equal(extra.regulationSha256,sha256);assert.equal(mechanics.regulationSha256,sha256);
const report={checkedAt:new Date().toISOString(),regulationSha256:sha256,definitionCommit:mechanics.definitionCommit,checks:{bossGroups:bosses.length,variants:bosses.flatMap(b=>b.variants).length,damageNumbers,ailmentNumbers,heroMechanicFacts:mechanics.evidence.length,hitNumbers,resourceClasses:extra.bosses.length,resourceVariants:extra.bosses.flatMap(b=>b.variants).length,explicitResourceLeaderRows:explicitRows.length},differences:[]};
fs.writeFileSync('COMBAT_DATA_VERIFICATION.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

import heroFile from '../data/heroes.json';
import bossFile from '../data/bosses.json';
import patternFile from '../data/night-patterns.json';

export interface HeroLevel { level:number; isAnchor:boolean; stats:Record<string,number>; hp:number; fp:number; stamina:number }
export interface Hero { key:string; nameZh:string; nameEn:string; levels:HeroLevel[] }
export interface BossVariant { npcId:number; label:string; uncertain:boolean; damageRates:Record<string,number>; resist:Record<string,number>; immune:string[]; roles:string[] }
export interface Boss { id:string; nameZh:string; nameEn:string; group:string; form:string; variants:BossVariant[] }
export interface Pattern { id:string; earth:string; nightlord:string; night1:string; night2:string }
export const heroes = heroFile.heroes as Hero[];
export const attributes = heroFile.attributes;
export const bosses = bossFile.bosses as unknown as Boss[];
export const patterns = patternFile.patterns as Pattern[];
export const gameDataVersion = heroFile.gameVersion;
export const maps:Record<string,string> = {limveld:'宁姆韦德（无地形变化）',crater:'火山口',mountaintop:'山顶',rotted_woods:'腐败森林',noklateo:'隐城',great_hollow:'大空洞'};
export const nightlords:Record<string,{name:string;expedition:string}> = {
  gladius:{name:'格拉狄乌斯',expedition:'三头野兽'},adel:{name:'艾德雷',expedition:'碎身巨颚'},gnoster:{name:'格诺斯塔',expedition:'慧心虫'},maris:{name:'玛利斯',expedition:'征兆'},libra:{name:'利普拉',expedition:'平衡律法的魔物'},fulghor:{name:'弗格尔',expedition:'暗中飞驰的猎人'},caligo:{name:'卡莉果',expedition:'雾中裂缝'},heolstor:{name:'布德奇冥',expedition:'黑夜化形者'},balancers:{name:'哈尔莫妮亚',expedition:'安定者们'},dreglord:{name:'史柴格斯',expedition:'废弃物之王'},
};
export const nightNames:Record<string,string> = {
  'Demi-Human Queen and Swordmaster':'亚人女王与剑圣','Bell Bearing Hunter':'铃珠猎人',"Night's Cavalry Duo":'双黑夜骑兵','Gaping Dragon':'贪食魔龙',"The Duke's Dear Freja":'公爵的夫雷迪亚','Wormface':'蚯蚓脸','Valiant Gargoyle':'英雄石像鬼','Tibia Mariner':'提比亚的唤声船','Smelter Demon':'镕铁恶魔','Battlefield Commander':'战场老将','Ulcerated Tree Spirit':'腐烂树灵','Centipede Demon':'百足恶魔','Grafted Monarch':'接肢君王','Royal Revenant':'王室幽魂','DBW & Curseblade':'神兽战士与咒剑士','Demons':'双恶魔','Great Red Bear':'大红熊','Death Knights':'死骑士组合','Tree Sentinel and Royal Cavalrymen':'大树守卫与王室骑兵','Morgott':'恶兆（源表 Morgott）','Ancient Dragon':'古龙','Crucible Knight and Golden Hippopotamus':'熔炉骑士与黄金河马','Outland Commander':'偏地老将','Great Wyrm':'大土龙','Dragonkin Soldier':'龙人士兵','Draconic Tree Sentinel and Royal Cavalrymen':'龙装大树守卫与王室骑兵','Godskin Duo':'神皮双人组','Fallingstar Beast':'坠星成兽','Death Rite Bird':'死亡仪式鸟','Nameless King':'无名王','Dancer of the Boreal Valley':'冷冽谷的舞娘','Mohg':'鲜血君王','Demon Prince':'恶魔王子','Dancing Lion':'神兽舞狮','Artorias':'骑士亚尔特留斯',
};
export function damageNegation(rate:number):number { return Math.round((1-rate)*1000)/10; }
export function filterPatterns(first:string,second:string,earth:string,scope:string):Pattern[] {
  return patterns.filter(p=>(!first||p.night1===first)&&(!second||p.night2===second)&&(!earth||p.earth===earth)&&(scope==='base'?Number(p.id)<1000:scope==='dlc'?Number(p.id)>=1000:true));
}

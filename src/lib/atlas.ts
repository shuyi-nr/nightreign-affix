import atlasFile from '../data/world-atlas.json';
import terrainFile from '../data/terrain-guides.json';

export type TerrainId = keyof typeof atlasFile.terrains;
export interface BossPoint { id:string; x:number; y:number; names:string[] }
export interface CrystalPoint { id:string; x:number; y:number; sets:string[]; underground:boolean }
export interface MapPoint { id:string; x:number; y:number; kind:'boss'|'crystal'|'reward'; title:string; detail:string; underground?:boolean }
export const atlas = atlasFile;
export const terrainGuides = terrainFile.guides;
export const terrainSources = terrainFile.sources;
export const crystals = atlasFile.crystals as CrystalPoint[];
export const crystalSets = ['A','B','C','D'];
export const bossNames:Record<string,string> = {
 'Royal Carian Knight':'卡利亚王室骑士','Erdtree Avatar':'黄金树化身','Death Rite Bird':'死亡仪式鸟','Bell Bearing Hunter':'铃珠猎人','Tree Sentinel':'大树守卫','Ulcerated Tree Spirit':'腐烂树灵','Draconic Tree Sentinel':'龙装大树守卫','Ancestor Spirit':'祖灵','Black Blade Kindred':'黑剑眷属','Magma Wyrm':'土龙','Ancient Hero of Zamor':'萨米尔的古英雄','Grafted Scion':'接肢贵族后裔','Demi-Human Queen':'亚人女王','Black Knife Assassin':'黑刀刺客',"Night's Cavalry":'黑夜骑兵','Red Wolf':'红狼','Royal Revenant':'王室幽魂','Miranda Blossom':'米兰达花','Golden Hippopotamus':'黄金河马','Elder Lion':'Elder Lion（来源原名）','Leonine Misbegotten':'狮子混种','Flying Dragon':'飞龙','Fallingstar Beast':'坠星兽','Fire Prelates':'火焰主教组合','Valiant Gargoyle':'英雄石像鬼','Giant Crows':'巨鸦','Demi-Human Swordmaster':'亚人剑圣','Mountaintop Ice Dragon':'山顶冰龙','Snowfield Trolls':'雪原山妖','Astel':'黑暗弃子','Dragonkin Soldier':'龙人士兵','Headless Troll':'无头山妖','Godskin Duo':'神皮双人组','Chief Purple Fiend':'首席紫色血怪（社区标注）','Crucible Knights':'熔炉骑士组合','Spider Scorpions':'蜘蛛蝎组合','Chief Bloodfiend':'血怪首领','Curseblade':'咒剑士','Bloodbane Giant Crows':'血之巨鸦','Mimic Tears':'仿身泪滴组合','Giant Crabs':'巨蟹组合','Ghostflame Dragon':'灵火龙','Spiritcaller Snail':'唤灵蜗牛','Elder Inquisitor':'拷问官长老','Divine Beast Warrior':'神兽战士','Putrid Avatar':'腐败化身','Cleanrot Knights':'尊腐骑士组合','Inquisitor':'拷问官',
};
export const displayBossName = (name:string) => bossNames[name] ?? name;
export function pointsForTerrain(id:TerrainId):MapPoint[] {
 const terrain=atlasFile.terrains[id];
 return [
  ...terrain.bosses.map(p=>({id:p.id,x:p.x,y:p.y,kind:'boss' as const,title:p.names.length===1?displayBossName(p.names[0]):`候选 Boss 点 ${p.id}`,detail:p.names.map(displayBossName).join('、')})),
  ...terrain.blessings.map((p,i)=>({id:`R${i+1}`,x:p.x,y:p.y,kind:'reward' as const,title:'腐败森林恩惠候选点',detail:'三个候选位置每局选择其一；先读取要塞线索定位。'})),
 ];
}
export function crystalPoints(set:string, floor:string):MapPoint[] {
 return crystals.filter(c=>(!set||c.sets.includes(set))&&(floor==='all'||(floor==='below')===c.underground)).map(c=>({id:c.id,x:c.x,y:c.y,kind:'crystal',title:`${c.underground?'地下':'野外'}共鸣结晶 ${c.id}`,detail:`分布组 ${c.sets.join(' / ')} · 地图投影 (${c.x}, ${c.y})。候选点，需在本局实地确认。`,underground:c.underground}));
}
// These points belong to the separate underground inset of the source atlas.
// They must use the independently calibrated underground screenshot.
const undergroundBossIds=new Set(['B10','B11','B12','B14','B15','B19','B20','B23']);
export function hollowBossPoints(floor:string):MapPoint[] {
 return pointsForTerrain('great_hollow').filter(p=>floor==='all'||(floor==='below')===undergroundBossIds.has(p.id));
}

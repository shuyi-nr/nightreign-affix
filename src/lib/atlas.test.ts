import { describe,expect,it } from 'vitest';
import { atlas,crystals,crystalPoints,crystalSets,pointsForTerrain,terrainGuides,hollowBossPoints,type TerrainId } from './atlas';
import events from '../data/world-events.json';
import castles from '../data/hollow-castles.json';
import {parseHash,buildHash} from './url';

describe('exploration data and coordinate integrity',()=>{
 it('keeps all 21 crystal sites, six underground, and exactly eight per independent distribution',()=>{
  expect(crystals).toHaveLength(21);expect(new Set(crystals.map(c=>c.id)).size).toBe(21);
  expect(crystals.filter(c=>c.underground)).toHaveLength(6);
  for(const set of crystalSets)expect(crystalPoints(set,'all')).toHaveLength(8);
  expect(crystalPoints('','above')).toHaveLength(15);expect(crystalPoints('','below')).toHaveLength(6);
 });
 it('preserves projected source coordinates without treating underground as another surface location',()=>{
  const points=crystalPoints('A','all');
  expect(points.find(p=>p.id==='C18')).toMatchObject({x:915,y:825,underground:true});
  expect(crystalPoints('A','above').some(p=>p.id==='C18')).toBe(false);
  for(const point of [...crystals,...Object.keys(atlas.terrains).flatMap(t=>pointsForTerrain(t as TerrainId))]){
   expect(point.x).toBeGreaterThanOrEqual(0);expect(point.x).toBeLessThanOrEqual(1000);expect(point.y).toBeGreaterThanOrEqual(0);expect(point.y).toBeLessThanOrEqual(1000);
  }
 });
 it('retains 80 Hollow records and the three alternative rot reward sites',()=>{
  expect(atlas.terrains.great_hollow.records).toBe(80);
  expect(pointsForTerrain('great_hollow')).toHaveLength(23);
  expect(hollowBossPoints('above')).toHaveLength(15);
  expect(hollowBossPoints('below')).toHaveLength(8);
  expect(new Set([...hollowBossPoints('above'),...hollowBossPoints('below')].map(p=>p.id)).size).toBe(23);
  expect(pointsForTerrain('rotted_woods').filter(p=>p.kind==='reward').map(p=>[p.x,p.y])).toEqual([[650,786],[812.5,605.5],[565,664.5]]);
  for(const t of ['crater','mountaintop','noklateo'] as const)expect(pointsForTerrain(t).some(p=>p.kind==='reward')).toBe(false);
 });
 it('keeps independent encounters separate and resolves every event source',()=>{
  expect(events.events).toHaveLength(15);
  expect(events.events.filter(e=>e.category!=='encounter')).toHaveLength(13);
  expect(events.events.filter(e=>e.category==='encounter').map(e=>e.id).sort()).toEqual(['cataclysm-camp','scale-bearing-merchant']);
  for(const event of events.events){expect(event.steps.length).toBeGreaterThan(0);for(const id of event.sources)expect(events.sources.some(s=>s.id===id)).toBe(true);}
 });
 it('has distinct castle configurations with complete layer and enemy descriptions',()=>{
  expect(castles.castles).toHaveLength(2);
  for(const castle of castles.castles)for(const config of castle.configs){expect(new Set(config.nodes.map(n=>n.id)).size).toBe(config.nodes.length);for(const node of config.nodes){expect([0,1,2]).toContain(node.layer);expect(node.targets.length).toBeGreaterThan(0);expect(node.note.length).toBeGreaterThan(0);}}
  expect(terrainGuides).toHaveLength(4);
 });
 it('opens both new pages without losing an existing deep relic selection',()=>{
  for(const page of ['world','hollow'] as const){const state=parseHash('#/check?mode=DEEP_POSITIVE&ids=1,,3&full=1&curses=4,,6&relic=11');expect(parseHash(buildHash({...state,page}))).toEqual({...state,page});}
 });
});

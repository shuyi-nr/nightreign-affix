import { describe, expect, it } from 'vitest';
import { baseAttack, mechanics, type SkillHit } from './heroMechanics';
import abilities from '../data/hero-abilities.json';
import catalog from '../data/affixes.json';
import { bosses, nightNames, patterns } from './compendium';
import { atlas, displayBossName } from './atlas';
const hits = mechanics.heroes.flatMap(h => h.abilities.flatMap(a => a.hits as SkillHit[]));

describe('character mechanics and damage meaning', () => {
  it('covers every character and all thirty localized abilities with actual details', () => {
    expect(mechanics.heroes.map(h => h.key)).toEqual(abilities.heroes.map(h => h.key));
    for (const hero of mechanics.heroes) {
      expect(hero.abilities.map(a => a.kind)).toEqual(['passive', 'skill', 'art']);
      for (const a of hero.abilities) expect(a.details.length).toBeGreaterThanOrEqual(2);
    }
    for (const h of abilities.heroes) for (const a of h.abilities) expect(a.name).not.toMatch(/[a-z]/i);
  });
  it('links every displayed relic to an existing effect and the correct character', () => {
    const entries = new Map(catalog.affixes.map(a => [a.effectId, a]));
    const relics = new Map(abilities.relics.map(a => [a.effectId, a]));
    for (const hero of abilities.heroes) for (const id of [...hero.abilities.flatMap(a => a.effectIds), ...hero.otherEffectIds]) {
      expect(relics.get(id)?.name).toBe(entries.get(id)?.name);
      expect(entries.get(id)?.name.startsWith(`【${hero.prefix}】`)).toBe(true);
    }
    for (const id of abilities.generalIds) expect(relics.has(id)).toBe(true);
  });
  it('keeps charge damage, stance damage, and impact separate', () => {
    const tap = hits.find(h => h.id === 700000006)!;
    const charged = hits.find(h => h.id === 700000001)!;
    expect(baseAttack(tap, 1)).toEqual([{name: '物理', value: 205}, {name: '火', value: 205}]);
    expect(baseAttack(charged, 1)).toEqual([{name: '物理', value: 307.5}, {name: '火', value: 307.5}]);
    expect(baseAttack(charged, 15)).toEqual([{name: '物理', value: 608.85}, {name: '火', value: 608.85}]);
    expect(tap.poise).toBe(75); expect(charged.poise).toBe(150);
    expect(tap.impact).toBe(10); expect(charged.impact).toBe(10);
  });
  it('does not invent weapon growth for flat NPC or cocktail attack rows', () => {
    const beast = hits.find(h => h.table === 'AtkParam_Npc' && h.id === 10450)!;
    expect(baseAttack(beast, 1)).toEqual([{name: '物理', value: 290}]);
    expect(baseAttack(beast, 15)).toEqual(baseAttack(beast, 1));
    expect(beast.scaling).toBe(true);
    expect(hits.some(h => [700000130, 700000131, 700000132].includes(h.id))).toBe(false);
  });
  it('contains all fourteen element sets and preserves actual damage types', () => {
    expect(mechanics.mixes).toHaveLength(14);
    expect(new Set(mechanics.mixes.map(m => m.elements)).size).toBe(14);
    expect(mechanics.mixes.filter(m => !m.elements.includes('+'))).toHaveLength(4);
    expect(mechanics.mixes.filter(m => m.elements.split('+').length === 2)).toHaveLength(6);
    expect(mechanics.mixes.filter(m => m.elements.split('+').length === 3)).toHaveLength(4);
    expect(mechanics.mixes.find(m => m.elements === '魔力 + 雷')!.hits[0].damage[0]).toMatchObject({name:'雷',flat:577});
  });
  it('keeps unconfirmed timing explicit rather than fabricating a verified field', () => {
    const restage=mechanics.heroes.find(h=>h.key==='duchess')!.abilities.find(a=>a.kind==='skill')!;
    expect(restage.details.some(d=>d.title.includes('待核实') && d.body.includes('3 秒'))).toBe(true);
    expect(mechanics.evidence.every(e=>!e.field.startsWith('unknown'))).toBe(true);
  });
});
describe('resource leaders and Chinese enemy labels', () => {
  it('includes concrete camp, fort and ruin configurations without duplicate parameter rows', () => {
    expect(bosses).toHaveLength(150);
    expect(bosses.flatMap(b=>b.variants)).toHaveLength(278);
    for(const b of bosses)expect(new Set(b.variants.map(v=>v.npcId)).size).toBe(b.variants.length);
    for(const [id,place]of [[30100270,'营地'],[43510020,'堡垒'],[34715315,'遗迹']] as const)
      expect(bosses.flatMap(b=>b.variants).find(v=>v.npcId===id)?.locations).toContain(place);
  });
  it('resolves every enemy shown in the resistance, prediction and map pages into Chinese', () => {
    for(const b of bosses){expect(b.nameZh).not.toMatch(/[a-z]/i);for(const v of b.variants)expect(v.label).not.toMatch(/[a-z]{3}/i);}
    for(const p of patterns)for(const name of [p.night1,p.night2])expect(nightNames[name]).toMatch(/[\u3400-\u9fff]/);
    for(const terrain of Object.values(atlas.terrains))for(const point of terrain.bosses)for(const name of point.names)
      expect(displayBossName(name)).not.toMatch(/[a-z]{3}/i);
  });
});

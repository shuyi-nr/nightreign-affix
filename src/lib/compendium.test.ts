import { describe, expect, it } from 'vitest';
import { attributes, bosses, damageNegation, filterPatterns, heroes, nightlords, patterns } from './compendium';
import { buildHash, parseHash } from './url';

describe('curated game data',()=>{
  it('contains all ten characters and 15 complete levels without relic stats',()=>{
    expect(heroes).toHaveLength(10);
    expect(heroes.map(h=>h.key)).toEqual(expect.arrayContaining(['scholar','undertaker']));
    for(const hero of heroes){expect(hero.levels).toHaveLength(15);for(const row of hero.levels){
      for(const a of attributes){expect(Number.isInteger(row.stats[a.key])).toBe(true);expect(row.stats[a.key]).toBeGreaterThanOrEqual(0);expect(row.stats[a.key]).toBeLessThanOrEqual(80);}
      expect(row.hp).toBe(20*row.stats.vigor+80);expect(row.fp).toBe(5*row.stats.mind+45);expect(row.stamina).toBe(2*row.stats.endurance+48);
    }}
    expect(heroes.find(h=>h.key==='wylder')!.levels[14].stats.strength).toBe(50);
  });
  it('retains real nightlord bodies even when noReward is set upstream',()=>{
    expect(bosses.filter(b=>b.group==='nightlord')).toHaveLength(18);
    expect(bosses.find(b=>b.id==='lord-1')!.variants.some(v=>v.roles.includes('nightlord'))).toBe(true);
    for(const boss of bosses)for(const variant of boss.variants){expect(variant.roles.some(r=>r!=='unplaced')).toBe(true);for(const key of ['standard','slash','strike','pierce','magic','fire','lightning','holy'])expect(Number.isFinite(variant.damageRates[key])).toBe(true);expect(Array.isArray(variant.immune)).toBe(true);}
  });
  it('converts actual Gladius multipliers without inverting weakness and resistance',()=>{
    const v=bosses.find(b=>b.id==='lord-0')!.variants[0];
    expect(damageNegation(v.damageRates.fire)).toBe(50);
    expect(damageNegation(v.damageRates.holy)).toBe(-35);
    expect(damageNegation(1)).toBe(0);
  });
});
describe('exact nightlord pattern filtering',()=>{
  it('has 520 unique paired records including 200 DLC entries',()=>{
    expect(patterns).toHaveLength(520);expect(new Set(patterns.map(p=>p.id)).size).toBe(520);
    expect(filterPatterns('','','','base')).toHaveLength(320);expect(filterPatterns('','','','dlc')).toHaveLength(200);
    for(const p of patterns){expect(nightlords[p.nightlord]).toBeDefined();expect(p.night1).toBeTruthy();expect(p.night2).toBeTruthy();}
  });
  it('matches observed night pairs within the same record, not independent boss pools',()=>{
    for(const p of patterns){const found=filterPatterns(p.night1,p.night2,p.earth,'all');expect(found.some(f=>f.id===p.id)).toBe(true);expect(found.every(f=>f.night1===p.night1&&f.night2===p.night2)).toBe(true);}
    expect(filterPatterns('not-a-boss','','','all')).toEqual([]);
  });
  it('narrows or keeps candidates when a second observation is added',()=>{
    const p=patterns[0];const first=filterPatterns(p.night1,'','','all');const pair=filterPatterns(p.night1,p.night2,'','all');expect(pair.length).toBeLessThanOrEqual(first.length);
  });
  it('adds data pages without losing existing positional relic state',()=>{
    for(const page of ['heroes','bosses','nightlord'] as const){const state={page,mode:'CURRENT_NORMAL' as const,ids:[7000000,null,7000100]};expect(parseHash(buildHash(state))).toEqual(state);}
  });
});

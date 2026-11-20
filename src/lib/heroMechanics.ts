import raw from '../data/hero-mechanics.json';

export interface SkillHit {
  id: number; table: string; label: string; weaponId: number | null;
  damage: { name: string; flat: number; base: number; motion: number }[];
  growth: Record<string, number>[]; poise: number; impact: number; revive: number; scaling: boolean;
}
export const mechanics = raw;
/** Components before attribute correction, defense, resistances and temporary buffs. */
export function baseAttack(hit: SkillHit, level: number) {
  const growth = hit.growth[Math.min(15, Math.max(1, level)) - 1];
  return hit.damage.map(d => ({ name: d.name, value: Number((d.flat + d.base * d.motion / 100 * (growth?.[d.name] ?? 1)).toFixed(2)) }));
}

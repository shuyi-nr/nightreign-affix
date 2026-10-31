// Read-only source audit; downloads stay in tools/shots. Does not publish anything.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const folder = 'tools/shots/final-audit';
fs.mkdirSync(folder, { recursive: true });
const report = { checkedAt: new Date().toISOString(), sources: [], checks: {}, differences: [] };
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const get = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'nightreign-affix-data-audit' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.json();
};
const head = await get('https://api.github.com/repos/sganggs/nightreign-relic-checker/commits/main');
async function source(name) {
  const meta = await get(`https://api.github.com/repos/sganggs/nightreign-relic-checker/contents/data/${name}?ref=${head.sha}`);
  const blob = meta.content ? meta : await get(`https://api.github.com/repos/sganggs/nightreign-relic-checker/git/blobs/${meta.sha}`);
  const buffer = Buffer.from(blob.content, 'base64');
  fs.writeFileSync(`${folder}/${name}`, buffer);
  report.sources.push({ url: `https://github.com/sganggs/nightreign-relic-checker/blob/${head.sha}/data/${name}`, sha256: createHash('sha256').update(buffer).digest('hex') });
  return JSON.parse(buffer.toString('utf8'));
}
const [rawHeroes, rawBosses] = await Promise.all([source('nightreign-heroes-v1.03.5.json'), source('nightreign-bosses-v1.03.5.json')]);
const heroes = json('src/data/heroes.json');
let numbers = 0;
for (const hero of heroes.heroes) {
  const sourceHero = rawHeroes.heroes.find(h => h.key === hero.key);
  assert(sourceHero, `Missing hero ${hero.key}`);
  assert.equal(hero.nameZh, sourceHero.nameZh);
  for (const row of hero.levels) {
    const sourceRow = sourceHero.levels.find(r => r.level === row.level);
    for (const [key, value] of Object.entries(row.stats)) {
      assert.equal(value, sourceRow.stats[key], `${hero.key} ${row.level} ${key}`);
      const low = [...sourceHero.anchors].reverse().find(a => a.level <= row.level);
      const high = sourceHero.anchors.find(a => a.level >= row.level);
      const interpolated = low.level === high.level ? low.stats[key] : Math.floor(low.stats[key] + (high.stats[key] - low.stats[key]) * (row.level - low.level) / (high.level - low.level));
      assert.equal(value, interpolated, `Anchor interpolation ${hero.key} ${row.level} ${key}`);
      numbers++;
    }
    for (const field of ['hp', 'fp', 'stamina']) { assert.equal(row[field], sourceRow.derived[field]); numbers++; }
  }
}
report.checks.heroNumbers = numbers;
const bosses = json('src/data/bosses.json').bosses;
let variants = 0, damageNumbers = 0, ailmentNumbers = 0;
for (const boss of bosses) {
  const sourceBoss = boss.group === 'nightlord' ? rawBosses.nightlords.find(b => `lord-${b.menuId}` === boss.id) : rawBosses.nightBosses.find(b => b.id === boss.id);
  assert(sourceBoss, boss.id);
  assert.equal(boss.nameZh, sourceBoss.nameZh || sourceBoss.nameEn);
  for (const v of boss.variants) {
    const s = (sourceBoss.fights ?? sourceBoss.variants).find(s => s.npcId === v.npcId);
    assert(s, `Missing NPC ${v.npcId}`);
    assert.deepEqual(v.damageRates, s.damageRates, `Damage rates NPC ${v.npcId}`);
    assert.deepEqual(v.resist, s.resist, `Ailments NPC ${v.npcId}`);
    assert.deepEqual(v.immune, s.immune, `Immunity NPC ${v.npcId}`);
    variants++; damageNumbers += Object.keys(v.damageRates).length; ailmentNumbers += Object.keys(v.resist).length;
  }
}
Object.assign(report.checks, { bossGroups: bosses.length, variants, damageNumbers, ailmentNumbers });
const stored = json('src/data/night-patterns.json');
const earths = ['limveld', 'crater', 'mountaintop', 'rotted_woods', 'noklateo', 'great_hollow'];
let patternCount = 0;
await Promise.all(earths.map(async earth => {
  const url = `https://nightfarerledger.com/nightreign/nightmap/${earth}.json`;
  const data = await get(url);
  fs.writeFileSync(`${folder}/${earth}.json`, JSON.stringify(data));
  report.sources.push({ url, gameVersion: data.gameVersion, snapshotDate: data.fetchedAt });
  const norm = s => stored.aliases[s] ?? s;
  for (const p of data.patterns) {
    const expected = { id: p.id, earth, nightlord: p.nightlord, night1: norm(p.night1?.boss), night2: norm(p.night2?.boss) };
    assert.deepEqual(stored.patterns.find(r => r.id === p.id), expected, `Pattern ${p.id}`);
    patternCount++;
  }
}));
assert.equal(patternCount, 520);
assert.equal(new Set(stored.patterns.map(p => p.id)).size, 520);
report.checks.patterns = patternCount;
let independent = 0;
for (const lord of ['Gladius','Adel','Gnoster','Maris','Libra','Fulghor','Caligo','Heolstor']) {
  const rows = json(`tools/shots/${lord}.json`);
  for (const p of rows) {
    const record = stored.patterns.find(r => Number(r.id) === Number(p.layout_number) - 1);
    assert(record, `Independent pattern ${p.layout_number}`);
    assert.equal(record.night1, stored.aliases[p.night1.boss] ?? p.night1.boss);
    assert.equal(record.night2, stored.aliases[p.night2.boss] ?? p.night2.boss);
    independent++;
  }
}
report.checks.independentBasePairs = independent;
assert.equal(independent, 320);
fs.writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.checks, null, 2));
console.log('Source audit passed; no differences in the displayed numeric fields or 520 paired records.');

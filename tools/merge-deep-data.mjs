// Run after refreshing upstream/ from the same revision as affixes.json.
import { readFileSync, writeFileSync } from 'node:fs';
const source = JSON.parse(readFileSync(new URL('../upstream/data/nightreign-relics-v1.03.4.json', import.meta.url), 'utf8'));
const affixes = JSON.parse(readFileSync(new URL('../src/data/affixes.json', import.meta.url), 'utf8'));
if (source.gameVersion !== affixes.gameVersion || source.dataVersion !== affixes.dataVersion) {
  throw new Error('Relic and affix dataset versions must match');
}
// Exclude two unnamed test/fixed records outside the supported random pools.
// They are not ordinary drawable relics and must not receive a legal verdict.
const relics = source.relics.filter((r) => r.deep && r.id >= 2000000 && r.id <= 2013322 && r.slots.length === 3 && r.slots.every((p) => [2000000, 2100000, 2200000].includes(p)));
writeFileSync(new URL('../src/data/deep-relics.json', import.meta.url), JSON.stringify({ gameVersion: source.gameVersion, dataVersion: source.dataVersion, sources: source.sources, relics }, null, 2) + '\n');
console.log(`Extracted ${relics.length} three-slot deep relics without modifying game parameters.`);

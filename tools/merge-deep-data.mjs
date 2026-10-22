// Run after refreshing upstream/ from the same revision as affixes.json.
import { readFileSync, writeFileSync } from 'node:fs';
const source = JSON.parse(readFileSync(new URL('../upstream/data/nightreign-relics-v1.03.4.json', import.meta.url), 'utf8'));
const affixes = JSON.parse(readFileSync(new URL('../src/data/affixes.json', import.meta.url), 'utf8'));
if (source.gameVersion !== affixes.gameVersion || source.dataVersion !== affixes.dataVersion) {
  throw new Error('Relic and affix dataset versions must match');
}
const relics = source.relics.filter((r) => r.deep && r.slots.filter((p) => p !== -1).length === 3);
writeFileSync(new URL('../src/data/deep-relics.json', import.meta.url), JSON.stringify({ gameVersion: source.gameVersion, dataVersion: source.dataVersion, sources: source.sources, relics }, null, 2) + '\n');
console.log(`Extracted ${relics.length} three-slot deep relics without modifying game parameters.`);

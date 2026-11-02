// Input is a local, verified extraction of factual coordinates. No remote art/code is copied.
import fs from 'node:fs';
const input = process.argv[2] ?? 'tools/shots/atlas/facts.json';
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const terrains = Object.fromEntries(Object.entries(raw.terrains).map(([id, data]) => [id, {
  records: data.records,
  bosses: data.points.map(({ id, x, y, names }) => ({ id, x, y, names })),
  blessings: data.blessings,
}]));
const output = {
  checkedAt: raw.checkedAt,
  patternVersion: '1.03.2 / 2026-09-26',
  coordinateSystem: '0–1000 projected map plane; x right, y down; no elevation or routing data',
  artwork: 'Original point overlays and castle structure diagrams; raster backgrounds are owner-provided gameplay screenshots. See public/maps/SOURCES.txt and MAP_ASSETS.md.',
  crystalSource: raw.crystalSource,
  crystalScript: raw.crystalScript,
  crystalSourceSha256: raw.crystalSourceSha256,
  crystalCredits: ['Alex0Goat', 'SisterNun', 'Nightfarer Ledger'],
  patternCredits: ['Artimuz', 'thefifthmatt', 'kevins78'],
  crystals: raw.crystals,
  terrains,
};
fs.writeFileSync('src/data/world-atlas.json', JSON.stringify(output, null, 2) + '\n');
console.log('Prepared original atlas coordinate data; no external artwork included.');

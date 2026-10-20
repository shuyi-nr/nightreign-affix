// Merge upstream affixes.json (authoritative legality fields) with the user's
// xlsx (richer Chinese effect text / notes). Legality fields are NEVER overridden
// by xlsx. xlsx-only IDs (removed / unimplemented / fixed reference affixes) are
// emitted into a separate reference list.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const upstreamFile = path.join(ROOT, 'upstream', 'data', 'nightreign-affixes-v1.03.4.json');
const outDir = path.join(ROOT, 'src', 'data');
const xlsxDir = path.join(ROOT, 'xlsx-out');

const upstream = JSON.parse(fs.readFileSync(upstreamFile, 'utf8'));
const upAffixes = upstream.affixes;

function loadXlsx(name) {
  const d = JSON.parse(fs.readFileSync(path.join(xlsxDir, `${name}.json`), 'utf8'));
  // skip title row (row1) and header row (row2)
  return d.rows.filter((r) => /^\d+$/.test(String(r.cells[0])));
}

const mainRows = loadXlsx('局外词条（遗物+武器固有效果）');
const deepRows = loadXlsx('深夜模式局外词条（遗物+武器固有效果）');

// Build xlsx lookup: effectId -> { type, effect, note, stacking, kind }
const xlsxById = new Map();
function text(cell) {
  if (cell == null || cell === '') return '';
  return String(cell);
}
function addRows(rows, kind) {
  for (const r of rows) {
    const id = parseInt(String(r.cells[0]), 10);
    const entry = xlsxById.get(id) || { kind };
    entry.name = text(r.cells[1]) || entry.name || '';
    entry.effect = text(r.cells[3]) || entry.effect || '';
    entry.note = text(r.cells[4]) || entry.note || '';
    entry.type = text(r.cells[2]) || entry.type || '';
    // stacking column differs: main sheet col5, deep sheet col6
    const stacking = kind === 'deep' ? text(r.cells[6]) : text(r.cells[5]);
    entry.stacking = stacking || entry.stacking || '';
    xlsxById.set(id, entry);
  }
}
addRows(mainRows, 'normal');
addRows(deepRows, 'deep');

// numeric "notes" like 11 / 995 are stray placeholders, not real notes
function cleanNote(s) {
  if (/^\d+$/.test(s.trim())) return '';
  return s;
}

const merged = upAffixes.map((a) => {
  const x = xlsxById.get(a.effectId);
  const out = { ...a };
  if (x) {
    if (x.effect && x.effect !== a.explanation) out.xlsxEffect = x.effect;
    const note = cleanNote(x.note || '');
    if (note) out.note = note;
    if (x.type && x.type !== a.category) out.xlsxType = x.type;
    if (x.stacking) out.xlsxStacking = x.stacking;
    out.inXlsx = true;
  } else {
    out.inXlsx = false;
  }
  return out;
});

// xlsx-only reference affixes (not in upstream) -> not drawable, reference only
const upIds = new Set(upAffixes.map((a) => a.effectId));
const referenceOnly = [];
for (const [id, x] of xlsxById) {
  if (upIds.has(id)) continue;
  referenceOnly.push({
    effectId: id,
    name: x.name || '',
    type: x.type || '',
    effect: x.effect || '',
    note: cleanNote(x.note || ''),
    stacking: x.stacking || '',
    kind: x.kind,
    drawable: false,
  });
}
referenceOnly.sort((a, b) => a.effectId - b.effectId);

const out = {
  schemaVersion: upstream.schemaVersion,
  gameVersion: upstream.gameVersion,
  dataVersion: upstream.dataVersion,
  generatedAt: upstream.generatedAt,
  sources: upstream.sources,
  mergedFromXlsx: true,
  counts: {
    affixes: merged.length,
    referenceOnly: referenceOnly.length,
    inXlsx: merged.filter((a) => a.inXlsx).length,
    withXlsxEffect: merged.filter((a) => a.xlsxEffect).length,
    withNote: merged.filter((a) => a.note).length,
  },
  affixes: merged,
  referenceOnly,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'affixes.json'), JSON.stringify(out, null, 2));

console.log('merged affixes:', merged.length);
console.log('referenceOnly (xlsx-only, not drawable):', referenceOnly.length);
console.log('in xlsx:', out.counts.inXlsx, ' with richer effect:', out.counts.withXlsxEffect, ' with note:', out.counts.withNote);
console.log('wrote', path.join(outDir, 'affixes.json'));

// Convert an .xlsx file to per-sheet JSON arrays of rows.
// Minimal parser: reads sharedStrings.xml and worksheet XML directly.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error('usage: node xlsx2json.mjs <file.xlsx> [outdir]');
  process.exit(1);
}

const outDir = process.argv[3] || './xlsx-out';
const tmp = path.join(outDir, '._extract');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execSync(`unzip -o -q "${xlsxPath}" -d "${tmp}"`);

// --- shared strings ---
const ssPath = path.join(tmp, 'xl', 'sharedStrings.xml');
let sharedStrings = [];
if (fs.existsSync(ssPath)) {
  const ssXml = fs.readFileSync(ssPath, 'utf8');
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(ssXml))) {
    // gather all <t>...</t> within this <si>
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm;
    let text = '';
    while ((tm = tRe.exec(m[1]))) {
      text += tm[1];
    }
    sharedStrings.push(decodeXml(text));
  }
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n').replace(/&#13;/g, '\r')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

// --- workbook sheet names + rIds ---
const wbPath = path.join(tmp, 'xl', 'workbook.xml');
const relsPath = path.join(tmp, 'xl', '_rels', 'workbook.xml.rels');
const wbXml = fs.readFileSync(wbPath, 'utf8');
const relsXml = fs.readFileSync(relsPath, 'utf8');

// rId -> target
const relMap = {};
for (const m of relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap[m[1]] = m[2];
}
// sheets: name + rId (order preserved)
const sheets = [];
for (const m of wbXml.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)) {
  const target = relMap[m[2]] || '';
  sheets.push({ name: m[1], rId: m[2], target });
}

// --- parse a worksheet into rows of cells (with types) ---
function parseSheet(sheetPath) {
  const xml = fs.readFileSync(sheetPath, 'utf8');
  // extract <row ...> ... </row>
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  const rows = [];
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rowNum = parseInt(rm[1], 10);
    const cells = [];
    const cellRe = /<c([^>]*r="([A-Z]+)(\d+)"[^>]*)>([\s\S]*?)<\/c>|<c([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(rm[2]))) {
      const attr = cm[1] || cm[5];
      const ref = cm[2] || '';
      const inner = cm[4] || cm[6];
      const tMatch = /t="([^"]+)"/.exec(attr);
      const t = tMatch ? tMatch[1] : 'n';
      let val = '';
      const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
      if (vMatch) {
        val = vMatch[1];
        if (t === 's') {
          val = sharedStrings[parseInt(val, 10)] ?? '';
        } else if (t === 'b') {
          val = val === '1';
        } else if (t === 'str' || t === 'inlineStr') {
          val = decodeXml(val);
        } else if (t === 'n') {
          val = Number(val);
        } else if (t === 'e') {
          val = val; // error
        } else {
          val = val;
        }
      } else if (t === 'inlineStr') {
        const isMatch = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/.exec(inner);
        val = isMatch ? decodeXml(isMatch[1]) : '';
      }
      // cell column from ref letters
      let col = -1;
      if (ref) {
        col = lettersToNum(ref.replace(/\d+$/, ''));
      }
      cells.push({ col, ref, t, val });
    }
    // normalize to dense array by column index (0-based)
    if (cells.length === 0) continue;
    const maxCol = Math.max(...cells.map(c => c.col));
    const dense = new Array(maxCol + 1).fill('');
    for (const c of cells) {
      dense[c.col] = c.val;
    }
    rows.push({ row: rowNum, cells: dense });
  }
  return rows;
}

function lettersToNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// --- write output ---
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const sheet of sheets) {
  const target = sheet.target.replace(/^\//, '');
  const relPath = target.startsWith('xl/') ? target : path.join('xl', target);
  const abs = path.join(tmp, relPath);
  if (!fs.existsSync(abs)) {
    console.log(`SKIP (missing): ${sheet.name} -> ${relPath}`);
    continue;
  }
  const rows = parseSheet(abs);
  const safeName = sheet.name.replace(/[\\/:*?"<>|]/g, '_');
  const outFile = path.join(outDir, `${safeName}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ sheet: sheet.name, rows }, null, 2));
  manifest.push({ name: sheet.name, file: outFile, rowCount: rows.length });
  console.log(`${sheet.name}\t${rows.length} rows\t-> ${outFile}`);
}

fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
console.log('\nDone. Manifest written to ' + path.join(outDir, '_manifest.json'));

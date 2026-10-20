// Generates the PWA icons + Open Graph preview image with zero dependencies.
// Draws the site's brand mark (a gold diamond) on the dark theme background
// using a hand-rolled PNG encoder (zlib + CRC32) and 2x2 supersampled AA.
//
//   node tools/gen-icons.mjs
//
import zlib from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- PNG encoder ----------
let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- drawing ----------
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// theme palette (matches styles.css)
const BG_CENTER = [0x13, 0x17, 0x22];
const BG_EDGE = [0x0a, 0x0c, 0x13];
const GOLD_TOP = [0xf0, 0xd4, 0x89];
const GOLD_BOTTOM = [0x9c, 0x74, 0x40];

function radialBg(fx, fy, w, h) {
  const dx = (fx - w / 2) / (w / 2);
  const dy = (fy - h / 2) / (h / 2);
  const t = Math.min(1, Math.sqrt(dx * dx + dy * dy));
  return lerpColor(BG_CENTER, BG_EDGE, t);
}

function diamond(fx, fy, cx, cy, a, b) {
  // 0..1 distance metric; <=1 inside. Vertical gold gradient.
  const d = Math.abs(fx - cx) / a + Math.abs(fy - cy) / b;
  if (d > 1) return null;
  const t = Math.max(0, Math.min(1, (fy - (cy - b)) / (2 * b)));
  return lerpColor(GOLD_TOP, GOLD_BOTTOM, t);
}

// Supersampled renderer: drawFn(fx, fy) -> [r,g,b,a] with a in [0,1].
function render(w, h, drawFn) {
  const out = Buffer.alloc(w * h * 4);
  const SS = 2;
  const inv = 1 / SS;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [rr, gg, bb, aa] = drawFn(x + (sx + 0.5) * inv, y + (sy + 0.5) * inv);
          r += rr * aa; g += gg * aa; b += bb * aa; a += aa;
        }
      }
      if (a > 0) { r /= a; g /= a; b /= a; }
      a *= inv * inv;
      const idx = (y * w + x) * 4;
      out[idx] = Math.round(Math.min(255, r));
      out[idx + 1] = Math.round(Math.min(255, g));
      out[idx + 2] = Math.round(Math.min(255, b));
      out[idx + 3] = Math.round(Math.min(255, a * 255));
    }
  }
  return out;
}

function squareIcon(size, halfExtent) {
  return render(size, size, (fx, fy) => {
    const g = diamond(fx, fy, size / 2, size / 2, halfExtent, halfExtent);
    if (g) return [...g, 1];
    return [...radialBg(fx, fy, size, size), 1];
  });
}

function ogImage(w, h) {
  const cy = h / 2;
  const a = w * 0.09;
  const b = h * 0.22;
  const centers = [0.3, 0.5, 0.7].map((p) => p * w);
  return render(w, h, (fx, fy) => {
    for (const cx of centers) {
      const g = diamond(fx, fy, cx, cy, a, b);
      if (g) return [...g, 1];
    }
    return [...radialBg(fx, fy, w, h), 1];
  });
}

// ---------- write ----------
const iconsDir = join(ROOT, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const files = [
  ['icons/icon-192.png', 192, 192, squareIcon(192, 192 * 0.3)],
  ['icons/icon-512.png', 512, 512, squareIcon(512, 512 * 0.3)],
  ['icons/icon-maskable-512.png', 512, 512, squareIcon(512, 512 * 0.24)],
  ['icons/apple-touch-icon.png', 180, 180, squareIcon(180, 180 * 0.3)],
  ['og-image.png', 1200, 630, ogImage(1200, 630)],
];

for (const [rel, w, h, rgba] of files) {
  const png = encodePng(w, h, rgba);
  const abs = join(ROOT, 'public', rel);
  writeFileSync(abs, png);
  console.log(`${rel}  ${w}x${h}  ${(png.length / 1024).toFixed(1)} KB`);
}
console.log('done.');

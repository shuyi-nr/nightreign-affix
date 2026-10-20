// Highlight helpers for the affix picker search. Pure & DOM-free so they can be
// unit-tested in Node. Matching uses a length-preserving fold (lowercase +
// full-width→half-width), so matched ranges map 1:1 back onto the source text.

export interface MatchRange {
  start: number;
  end: number; // exclusive
}

/**
 * Length-preserving case/full-width fold used to locate matches. Unlike the
 * catalog's `normalizeFold`, it never deletes characters, so every index in the
 * folded string still corresponds to the same index in the original.
 */
export function foldForMatch(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0);
    else if (code === 0x3000) out += ' ';
    else out += s[i];
  }
  return out.toLowerCase();
}

/** All non-overlapping occurrences of `query` in `text` (case/full-width-insensitive). */
export function findMatchRanges(text: string, query: string): MatchRange[] {
  const q = foldForMatch(query.trim());
  if (!q) return [];
  const t = foldForMatch(text);
  const ranges: MatchRange[] = [];
  let from = 0;
  while (from <= t.length - q.length) {
    const found = t.indexOf(q, from);
    if (found === -1) break;
    ranges.push({ start: found, end: found + q.length });
    from = found + q.length;
  }
  return ranges;
}

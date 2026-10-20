import type { ReactNode } from 'react';
import { findMatchRanges } from '../lib/highlight';

/** Wraps the matching parts of `text` for `query` in a <mark> for the picker list. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const ranges = findMatchRanges(text, query);
  if (ranges.length === 0) return text;

  const parts: ReactNode[] = [];
  let last = 0;
  ranges.forEach((r, i) => {
    if (r.start > last) parts.push(<span key={`t${i}`}>{text.slice(last, r.start)}</span>);
    parts.push(
      <mark key={`m${i}`} className="hl">
        {text.slice(r.start, r.end)}
      </mark>,
    );
    last = r.end;
  });
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>);
  return parts;
}

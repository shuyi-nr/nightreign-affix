import { describe, expect, it } from 'vitest';
import { findMatchRanges, foldForMatch } from './highlight';

describe('foldForMatch', () => {
  it('lowercases ASCII', () => {
    expect(foldForMatch('Hello WORLD')).toBe('hello world');
  });

  it('maps full-width latin/digits/punct to half-width', () => {
    expect(foldForMatch('ＡＢＣ１２３＋，')).toBe('abc123+,');
  });

  it('keeps CJK unchanged and length preserved', () => {
    expect(foldForMatch('攻击力')).toBe('攻击力');
    expect(foldForMatch('攻击力').length).toBe(3);
  });
});

describe('findMatchRanges', () => {
  it('returns empty for an empty or whitespace query', () => {
    expect(findMatchRanges('攻击力', '')).toEqual([]);
    expect(findMatchRanges('攻击力', '   ')).toEqual([]);
  });

  it('finds a case-insensitive substring', () => {
    expect(findMatchRanges('Increase ATK', 'atk')).toEqual([{ start: 9, end: 12 }]);
  });

  it('finds a full-width query against half-width text', () => {
    expect(findMatchRanges('abc123', '１２３')).toEqual([{ start: 3, end: 6 }]);
  });

  it('returns only non-overlapping occurrences', () => {
    expect(findMatchRanges('aaa', 'aa')).toEqual([{ start: 0, end: 2 }]);
  });

  it('finds CJK substrings at the correct offsets', () => {
    expect(findMatchRanges('提升攻击力上限', '攻击力')).toEqual([{ start: 2, end: 5 }]);
  });

  it('returns empty when there is no match', () => {
    expect(findMatchRanges('防御', '攻击')).toEqual([]);
  });
});

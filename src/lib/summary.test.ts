import { describe, expect, it } from 'vitest';
import { CheckStatus } from './types';
import { buildTextSummary, statusLabel } from './summary';

describe('statusLabel', () => {
  it('maps each status to its Chinese label', () => {
    expect(statusLabel(CheckStatus.VALID)).toBe('合法');
    expect(statusLabel(CheckStatus.WRONG_ORDER)).toBe('顺序错误');
    expect(statusLabel(CheckStatus.INVALID)).toBe('非法');
    expect(statusLabel(CheckStatus.INCOMPLETE)).toBe('待补全');
  });
});

describe('buildTextSummary', () => {
  it('builds a one-line summary for a valid build', () => {
    const s = buildTextSummary('CURRENT_NORMAL', ['攻击力提升', '减伤率提升', 'HP 回复'], CheckStatus.VALID);
    expect(s).toBe('遗物类型：普通 1.03 | 词条：攻击力提升、减伤率提升、HP 回复 | 判定：合法');
  });

  it('reports an empty build as 未选 / 待补全', () => {
    const s = buildTextSummary('DEEP_POSITIVE', [], CheckStatus.INCOMPLETE);
    expect(s).toBe('遗物类型：深夜正面 | 词条：（未选） | 判定：待补全');
  });
});

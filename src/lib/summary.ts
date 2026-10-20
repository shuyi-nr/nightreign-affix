// Plain-text result summary for the "复制文本摘要" action, plus the canonical
// Chinese label for each check status. Pure & testable.

import type { CheckModeKey } from './types';
import { CheckStatus } from './types';
import { CHECK_MODES } from './engine';

export function statusLabel(status: CheckStatus): string {
  switch (status) {
    case CheckStatus.VALID:
      return '合法';
    case CheckStatus.WRONG_ORDER:
      return '顺序错误';
    case CheckStatus.INVALID:
      return '非法';
    case CheckStatus.INCOMPLETE:
      return '待补全';
  }
}

export function buildTextSummary(mode: CheckModeKey, names: string[], status: CheckStatus): string {
  const type = CHECK_MODES[mode].title;
  const affixes = names.length > 0 ? names.join('、') : '（未选）';
  return `遗物类型：${type} | 词条：${affixes} | 判定：${statusLabel(status)}`;
}

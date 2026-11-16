import { deepRelics } from './deep';
import { canFitPoolSlots, CHECK_MODES, SLOT_COUNT } from './engine';
import type { CatalogEntry, CheckModeKey } from './types';

type Slots = readonly (number | null)[];
type PairedSelection = { curses: Slots; relicId: number };

function canAdd(chosen: readonly CatalogEntry[], entry: CatalogEntry): boolean {
  return chosen.every((other) => other.effectId !== entry.effectId
    && (entry.compatibilityId === -1 || other.compatibilityId !== entry.compatibilityId));
}

function canComplete(
  ids: Slots,
  curses: Slots | undefined,
  positives: readonly CatalogEntry[],
  negatives: readonly CatalogEntry[],
  positiveById: ReadonlyMap<number, CatalogEntry>,
  negativeById: ReadonlyMap<number, CatalogEntry>,
  templates: readonly (readonly number[])[],
): boolean {
  const positiveSlots = ids.map((id) => id == null ? null : positiveById.get(id));
  const negativeSlots = curses?.map((id) => id == null ? null : negativeById.get(id)) ?? [];
  const chosen: CatalogEntry[] = [];
  const chosenPositives = positiveSlots.filter((entry): entry is CatalogEntry => entry != null);
  for (const entry of [...positiveSlots, ...negativeSlots]) {
    if (entry === null) continue;
    if (!entry || !canAdd(chosen, entry)) return false;
    chosen.push(entry);
  }
  if (positiveSlots.some((entry, row) => entry && !entry.requiresCurse && negativeSlots[row])) return false;

  const fitsTemplate = () => templates.length === 0 || templates.some((pools) => canFitPoolSlots(chosenPositives, pools));
  if (!fitsTemplate()) return false;

  function completeRows(row: number): boolean {
    if (row === SLOT_COUNT) return true;
    const fixedPositive = positiveSlots[row];
    const fixedNegative = negativeSlots[row];

    function completePair(positive: CatalogEntry): boolean {
      if (!curses) return completeRows(row + 1);
      if (fixedNegative) return positive.requiresCurse && completeRows(row + 1);
      if (!positive.requiresCurse) return completeRows(row + 1);

      return negatives.some((negative) => {
        if (!canAdd(chosen, negative)) return false;
        chosen.push(negative);
        const works = completeRows(row + 1);
        chosen.pop();
        return works;
      });
    }

    if (fixedPositive) return completePair(fixedPositive);
    return positives.some((positive) => {
      if (!canAdd(chosen, positive) || (fixedNegative && !positive.requiresCurse)) return false;
      chosen.push(positive);
      chosenPositives.push(positive);
      const works = fitsTemplate() && completePair(positive);
      chosenPositives.pop();
      chosen.pop();
      return works;
    });
  }

  return completeRows(0);
}

/** Keep a candidate when the other selections can still lead to a complete relic. */
export function compatibleAffixes(
  mode: CheckModeKey,
  ids: Slots,
  positives: CatalogEntry[],
  negatives: CatalogEntry[],
  paired?: PairedSelection,
): { positive: CatalogEntry[][]; negative: CatalogEntry[][] } {
  if (paired && !deepRelics.some((relic) => relic.id === paired.relicId)) {
    return { positive: ids.map(() => []), negative: paired.curses.map(() => []) };
  }

  const curses = paired?.curses;
  const templates = paired ? [] : CHECK_MODES[mode].slotPoolSequences;
  // The complete Deep check uses the curse pool and the positive pool union.
  const curseOptions = paired ? negatives.filter((entry) => entry.isCurse && entry.poolIds.includes(3_000_000)) : [];
  const positiveById = new Map(positives.map((entry) => [entry.effectId, entry]));
  const negativeById = new Map(curseOptions.map((entry) => [entry.effectId, entry]));
  const completes = (nextIds: Slots, nextCurses: Slots | undefined) => canComplete(
    nextIds, nextCurses, positives, curseOptions, positiveById, negativeById, templates,
  );
  const replace = (slots: Slots, index: number, id: number) => slots.map((value, i) => i === index ? id : value);

  return {
    positive: ids.map((_, i) => positives.filter((entry) => completes(replace(ids, i, entry.effectId), curses))),
    negative: curses?.map((_, i) => curseOptions.filter((entry) => completes(ids, replace(curses, i, entry.effectId)))) ?? [],
  };
}

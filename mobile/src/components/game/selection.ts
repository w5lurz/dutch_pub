import type { TCard } from '@dutch-pub/shared';

/** Where a selection id points: "hand", "up" (face-up table card) or "down" (face-down). */
const placeOf = (id: string) => id.split('-')[0];

/**
 * The selection after tapping card `id`. Several cards of the same value from the same place
 * (your hand, or your face-up cards) can be selected, to be laid together; tapping a selected
 * card deselects it, tapping any other card starts a new selection with it. Face-down cards
 * (no card known: `cardOf` gives undefined) are only ever selected alone.
 */
export function nextSelection(current: readonly string[], id: string, cardOf: (id: string) => TCard | undefined): string[] {
    if (current.includes(id)) return current.filter(selected => selected !== id);
    const card = cardOf(id);
    const first = current.length > 0 ? cardOf(current[0]) : undefined;
    if (card && first && placeOf(current[0]) === placeOf(id) && first.value === card.value) return [...current, id];
    return [id];
}

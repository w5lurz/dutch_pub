import { canLayCard, isCallNext, type CardRules, type Cards, type TCard } from '@dutch-pub/shared';

type Situation = {
    /** Whether the card may be played at all now (hand first, then face-up, then face-down). */
    touchable: boolean;
    /** Your turn. */
    active: boolean;
    swapPhase: boolean;
    /** How many other players are still in the game. */
    others: number;
    laidCards: Cards | null;
    rules?: CardRules;
};

/**
 * Whether laying `card` (one card, several of the same value, or a face-down card's index)
 * first needs you to pick who must lay a magic card: an Ace ("Call Next") that may be laid now,
 * with two or more other players to choose from (with one, it is always them).
 */
export function needsAceCall(card: TCard | number | Cards, { touchable, active, swapPhase, others, laidCards, rules }: Situation): boolean {
    const first = Array.isArray(card) ? card[0] : card;
    if (typeof first !== 'object' || !first || !isCallNext(first)) return false;
    return touchable && active && !swapPhase && others > 1 && canLayCard(first, laidCards, rules);
}

import type { Cards, TCard, UserCards } from './types';

// Special cards (see the deck in backend/src/game.js):
//   2  "Start Over" (magic) - the next card can be anything >= 2
//   0  "Mirror"     (magic) - the next card is compared to the first non-Mirror card below it
//   9  "You lose"   (tease) - the next card must be between 3 and 7
//   10 "Clear all"  (magic) - burns the pile (handled on the server)
//   14 "Call Next"  (magic) - only magic cards can follow

const isStartOver = (card: TCard) => !!card.isMagicCard && card.value === 2;
const isMirror = (card: TCard) => !!card.isMagicCard && card.value === 0;

/**
 * Whether `card` may be laid on the current pile, from the client's point of view.
 *
 * `laidCards` is ordered top card first. A `number` card is the index of a face-down
 * table card: it is played blind, so it is always allowed here and the server decides.
 */
export function canLayCard(card: TCard | number, laidCards: Cards | null): boolean {
    if (typeof card === 'number') {
        return true;
    }
    if (!laidCards || laidCards.length === 0) {
        return true;
    }

    const top = laidCards[0];

    // Regular top card or "Start Over": anything of equal or higher value.
    if ((!top.isMagicCard && !top.isTeaseCard) || isStartOver(top)) {
        if (top.value <= card.value) {
            return true;
        }
    }
    // Magic cards can be laid on anything except a tease card.
    if (!top.isTeaseCard && card.isMagicCard) {
        return true;
    }
    // "Mirror": mirrors the first non-Mirror card below it, however many Mirrors are
    // stacked on top of each other. Anything goes if there are only Mirrors.
    // OPEN QUESTION: only the mirrored card's *value* is compared, and magic cards are always
    // allowed on a Mirror. Whether a Mirror should fully act as the mirrored card (e.g. Mirror
    // over "You lose" -> only 3-7, Mirror over "Call Next" -> only magic cards) is undecided;
    // possibly a per-room setting on an admin / room config page later.
    if (isMirror(top)) {
        const mirrored = laidCards.find(laidCard => !isMirror(laidCard));
        if (!mirrored || mirrored.value <= card.value) {
            return true;
        }
    }
    // Tease card: only 3-7.
    if (top.isTeaseCard && card.value >= 3 && card.value <= 7) {
        return true;
    }
    return false;
}

/**
 * Whether the player has at least one card they can lay. When this is false on the
 * player's turn they must pick up the pile (`draw-cards`).
 *
 * Cards are played from the hand first, then the face-up table cards, then the
 * face-down table cards (which are always playable, blind).
 */
export function hasAnyPlayableCard(userCards: UserCards, laidCards: Cards | null): boolean {
    const { hand, tableFlipped, table } = userCards;
    if (hand.length === 0 && tableFlipped.length === 0 && table > 0) {
        return true;
    }
    const cardsToCheck = hand.length > 0 ? hand : tableFlipped;
    return cardsToCheck.some(card => canLayCard(card, laidCards));
}

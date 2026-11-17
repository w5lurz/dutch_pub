import type { TCard } from './types';

/** The rank printed on a French-suited card. */
export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export const CARD_SUITS: readonly CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

/**
 * The rank on the card's face. Mostly the `value`, except where the game gives a physical
 * card a different value: the 8 is "Mirror" (value 0) and the Ace is "Call Next" (14).
 */
export function cardRank(card: Pick<TCard, 'value'>): CardRank {
    switch (card.value) {
        case 0:
            return '8';
        case 11:
            return 'J';
        case 12:
            return 'Q';
        case 13:
            return 'K';
        case 14:
            return 'A';
        default:
            if (card.value >= 2 && card.value <= 10) return String(card.value) as CardRank;
            throw new Error(`Unknown card value ${card.value}`);
    }
}

/** Hearts and diamonds are red; clubs and spades black. */
export function isRedSuit(suit: string): boolean {
    return suit === 'hearts' || suit === 'diamonds';
}

/** Special cards (magic or tease) carry a rule; their `name` says which ("Clear all", ...). */
export function isSpecialCard(card: Pick<TCard, 'isMagicCard' | 'isTeaseCard'>): boolean {
    return !!card.isMagicCard || !!card.isTeaseCard;
}

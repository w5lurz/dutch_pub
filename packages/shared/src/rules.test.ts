import { describe, expect, it } from 'vitest';
import { canLayCard, hasAnyPlayableCard } from './rules';
import type { Cards, TCard, UserCards } from './types';

// One suit of the deck from backend/src/game.js (suit doesn't affect the rules).
const SUIT: Cards = [
    { name: 'Start Over', value: 2, color: 'clubs', isMagicCard: true },
    { name: '3', value: 3, color: 'clubs' },
    { name: '4', value: 4, color: 'clubs' },
    { name: '5', value: 5, color: 'clubs' },
    { name: '6', value: 6, color: 'clubs' },
    { name: '7', value: 7, color: 'clubs' },
    { name: 'Mirror', value: 0, color: 'clubs', isMagicCard: true },
    { name: 'You lose', value: 9, color: 'clubs', isTeaseCard: true },
    { name: 'Clear all', value: 10, color: 'clubs', isMagicCard: true },
    { name: 'J', value: 11, color: 'clubs' },
    { name: 'Q', value: 12, color: 'clubs' },
    { name: 'K', value: 13, color: 'clubs' },
    { name: 'Call Next', value: 14, color: 'clubs', isMagicCard: true },
];

const byName = (name: string): TCard => {
    const card = SUIT.find(c => c.name === name);
    if (!card) throw new Error(`No card ${name}`);
    return card;
};

/** The rule as it was written inline in the former web app (frontend/src/hooks/useCard.ts) before extraction. */
function legacyCanLayCard(card: TCard | number, laidCards: Cards | null): boolean {
    const getSecondArrayItem = (arr: any[]) => arr && arr.length >= 2 && arr[1];
    const lastLaidCard: any = laidCards ? laidCards[0] : null;
    if (typeof card === 'number') return true;
    return !!(
        !laidCards ||
        (lastLaidCard.value <= card.value &&
            ((!lastLaidCard.isMagicCard && !lastLaidCard.isTeaseCard) || (lastLaidCard.isMagicCard && lastLaidCard.value === 2))) ||
        (laidCards && !lastLaidCard.isTeaseCard && card.isMagicCard) ||
        (laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 14 && card.isMagicCard) ||
        (laidCards &&
            lastLaidCard.isMagicCard &&
            lastLaidCard.value === 0 &&
            ((getSecondArrayItem(laidCards) as any).value <= card.value || !getSecondArrayItem(laidCards))) ||
        (laidCards && lastLaidCard.isMagicCard && lastLaidCard.value === 2 && lastLaidCard.value <= card.value) ||
        (laidCards && lastLaidCard.isTeaseCard && card.value >= 3 && card.value <= 7)
    );
}

describe('canLayCard', () => {
    // The legacy rule only looked one card below a Mirror; for piles of up to two cards that is
    // the same as looking for the first non-Mirror card, so the results must match exactly.
    it('matches the legacy inline rule for every pile of up to two cards', () => {
        const piles: Array<Cards | null> = [null];
        for (const top of SUIT) {
            piles.push([top]);
            for (const below of SUIT) piles.push([top, below]);
        }
        for (const pile of piles) {
            for (const card of SUIT) {
                expect(canLayCard(card, pile), `${card.name} on ${pile?.map(c => c.name).join(' > ') ?? 'empty'}`).toBe(
                    legacyCanLayCard(card, pile),
                );
            }
        }
    });

    it('allows anything on an empty pile', () => {
        expect(canLayCard(byName('3'), null)).toBe(true);
        expect(canLayCard(byName('3'), [])).toBe(true);
    });

    it('always allows a face-down table card (played blind, checked by the server)', () => {
        expect(canLayCard(1, [byName('K')])).toBe(true);
    });

    it('requires equal or higher value on a regular card', () => {
        expect(canLayCard(byName('Q'), [byName('J')])).toBe(true);
        expect(canLayCard(byName('J'), [byName('J')])).toBe(true);
        expect(canLayCard(byName('4'), [byName('J')])).toBe(false);
    });

    it('allows magic cards on anything except a tease card', () => {
        expect(canLayCard(byName('Mirror'), [byName('K')])).toBe(true);
        expect(canLayCard(byName('Clear all'), [byName('K')])).toBe(true);
        expect(canLayCard(byName('Start Over'), [byName('You lose')])).toBe(false);
    });

    it('"Start Over" (2) lets anything of value >= 2 follow', () => {
        expect(canLayCard(byName('3'), [byName('Start Over'), byName('K')])).toBe(true);
    });

    it('"Call Next" (14) only lets magic cards follow', () => {
        expect(canLayCard(byName('K'), [byName('Call Next')])).toBe(false);
        expect(canLayCard(byName('Mirror'), [byName('Call Next')])).toBe(true);
    });

    it('"Mirror" (0) compares against the card below it', () => {
        expect(canLayCard(byName('3'), [byName('Mirror')])).toBe(true);
        expect(canLayCard(byName('Q'), [byName('Mirror'), byName('J')])).toBe(true);
        expect(canLayCard(byName('4'), [byName('Mirror'), byName('J')])).toBe(false);
    });

    it('stacked "Mirror"s all mirror the first non-Mirror card, however deep', () => {
        const pile = [byName('Mirror'), byName('Mirror'), byName('Mirror'), byName('Mirror'), byName('J'), byName('3')];
        expect(canLayCard(byName('Q'), pile)).toBe(true);
        expect(canLayCard(byName('J'), pile)).toBe(true);
        expect(canLayCard(byName('4'), pile)).toBe(false);
    });

    it('a pile of only "Mirror"s lets anything follow', () => {
        expect(canLayCard(byName('3'), [byName('Mirror'), byName('Mirror'), byName('Mirror')])).toBe(true);
    });

    it('a tease card (9) only lets 3-7 follow', () => {
        expect(canLayCard(byName('3'), [byName('You lose')])).toBe(true);
        expect(canLayCard(byName('7'), [byName('You lose')])).toBe(true);
        expect(canLayCard(byName('J'), [byName('You lose')])).toBe(false);
    });
});

describe('hasAnyPlayableCard', () => {
    const cards = (hand: Cards, tableFlipped: Cards = [], table = 3): UserCards => ({ hand, tableFlipped, table });

    it('checks the hand while it has cards, ignoring face-up table cards', () => {
        expect(hasAnyPlayableCard(cards([byName('4')], [byName('K')]), [byName('J')])).toBe(false);
        expect(hasAnyPlayableCard(cards([byName('4'), byName('Q')]), [byName('J')])).toBe(true);
    });

    it('checks face-up table cards once the hand is empty', () => {
        expect(hasAnyPlayableCard(cards([], [byName('K')]), [byName('J')])).toBe(true);
        expect(hasAnyPlayableCard(cards([], [byName('4')]), [byName('J')])).toBe(false);
    });

    it('is always true when only face-down table cards are left', () => {
        expect(hasAnyPlayableCard(cards([], [], 2), [byName('Call Next')])).toBe(true);
    });

    it('is false when no cards are left at all', () => {
        expect(hasAnyPlayableCard(cards([], [], 0), [byName('J')])).toBe(false);
    });
});

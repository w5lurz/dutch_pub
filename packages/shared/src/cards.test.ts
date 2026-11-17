import { describe, expect, it } from 'vitest';
import { cardRank, isRedSuit, isSpecialCard } from './cards';
import type { TCard } from './types';

// One suit of the deck from backend/src/game.js.
const SUIT: TCard[] = [
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

describe('cardRank', () => {
    it('maps every card of a suit to the 13 French ranks in order', () => {
        expect(SUIT.map(cardRank)).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']);
    });

    it('rejects unknown values', () => {
        expect(() => cardRank({ value: 1 })).toThrow();
        expect(() => cardRank({ value: 15 })).toThrow();
    });
});

describe('isRedSuit / isSpecialCard', () => {
    it('knows the red suits', () => {
        expect(['hearts', 'diamonds', 'clubs', 'spades'].map(isRedSuit)).toEqual([true, true, false, false]);
    });

    it('flags magic and tease cards only', () => {
        expect(SUIT.filter(isSpecialCard).map(card => card.name)).toEqual(['Start Over', 'Mirror', 'You lose', 'Clear all', 'Call Next']);
    });
});

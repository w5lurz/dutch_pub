import type { Cards, Game, TCard } from '@dutch-pub/shared';

import { pileDrawSignature } from '../autoDraw';
import { baseCardHeight, cardDimensions } from '../cardSize';
import { stackOffset, tableSpots } from '../TableStacks';

const card = (value: number, color = 'hearts', extra: Partial<TCard> = {}): TCard => ({
    name: String(value),
    value,
    color,
    ...extra,
});

const game = (overrides: Partial<Game> = {}): Game => ({
    userCards: { hand: [card(5)], tableFlipped: [card(9)], table: 3 },
    opponents: {},
    laidCards: null,
    burntCards: null,
    deck: 10,
    active: true,
    ...overrides,
});

describe('tableSpots', () => {
    it('puts the face-up cards on the first spots, one spot per face-down card', () => {
        const up: Cards = [card(3), card(4)];
        expect(tableSpots(up, 3)).toEqual([
            { faceUp: up[0], faceDown: true },
            { faceUp: up[1], faceDown: true },
            { faceUp: null, faceDown: true },
        ]);
    });

    it('keeps face-up cards that have no face-down card left below', () => {
        expect(tableSpots([card(3), card(4)], 1)).toEqual([
            { faceUp: card(3), faceDown: true },
            { faceUp: card(4), faceDown: false },
        ]);
    });

    it('is empty when no table cards are left', () => {
        expect(tableSpots([], 0)).toEqual([]);
    });
});

describe('card sizes', () => {
    it('scales an md card from the landscape window height (86dp on a 780x360 phone)', () => {
        expect(baseCardHeight({ width: 780, height: 360 })).toBe(86);
        expect(cardDimensions({ width: 780, height: 360 }, 'md')).toEqual({ width: 61, height: 86 });
    });

    it('clamps to 56-132dp', () => {
        expect(baseCardHeight({ width: 200, height: 100 })).toBe(56);
        expect(baseCardHeight({ width: 3000, height: 2000 })).toBe(132);
    });

    it('keeps the card aspect ratio for every size', () => {
        for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
            const { width, height } = cardDimensions({ width: 780, height: 360 }, size);
            expect(height / width).toBeCloseTo(1.4, 1);
        }
    });

    it('lets a face-down card peek out by at least 3dp', () => {
        expect(stackOffset(10)).toBe(3);
        expect(stackOffset(61)).toBe(8);
    });
});

describe('pileDrawSignature (auto pick-up)', () => {
    it('is null when a card can be laid', () => {
        expect(pileDrawSignature(1, game({ laidCards: [card(4)] }))).toBeNull();
    });

    it('is null when it is not your turn, or outside a game', () => {
        const stuck = { laidCards: [card(13)] };
        expect(pileDrawSignature(1, game({ ...stuck, active: false }))).toBeNull();
        expect(pileDrawSignature(undefined, game(stuck))).toBeNull();
    });

    it('is set when nothing can be laid, and the same for the same state', () => {
        const stuck = game({ laidCards: [card(13)] });
        const signature = pileDrawSignature(1, stuck);
        expect(signature).not.toBeNull();
        expect(pileDrawSignature(1, { ...stuck })).toBe(signature);
        expect(pileDrawSignature(1, game({ laidCards: [card(13), card(12)] }))).not.toBe(signature);
    });

    it('is null for a player without cards (they have won)', () => {
        const empty = { hand: [], tableFlipped: [], table: 0 };
        expect(pileDrawSignature(1, game({ userCards: empty, laidCards: [card(13)] }))).toBeNull();
    });
});

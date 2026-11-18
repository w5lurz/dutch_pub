import type { Cards, Game, TCard } from '@dutch-pub/shared';

import { pileDrawSignature } from '../autoDraw';
import { baseCardHeight, cardDimensions, tableLayout } from '../cardSize';
import { handFanLayout } from '../HandFan';
import { handArcLayout } from '../handArc';
import { cardJitter } from '../jitter';
import { seatPositions } from '../seats';
import { nextSelection } from '../selection';
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

describe('table layout', () => {
    it('is wide only when the window is more than 1.2 times as wide as tall', () => {
        expect(tableLayout({ width: 360, height: 800 })).toBe('portrait');
        expect(tableLayout({ width: 800, height: 800 })).toBe('portrait');
        expect(tableLayout({ width: 960, height: 800 })).toBe('portrait');
        expect(tableLayout({ width: 961, height: 800 })).toBe('wide');
        expect(tableLayout({ width: 800, height: 360 })).toBe('wide');
    });
});

describe('card sizes', () => {
    it('scales an md card from the width in portrait (63x88dp on a 360dp phone)', () => {
        expect(cardDimensions({ width: 360, height: 640 }, 'md')).toEqual({ width: 63, height: 88 });
        expect(cardDimensions({ width: 360, height: 800 }, 'md')).toEqual({ width: 63, height: 88 });
        expect(cardDimensions({ width: 360, height: 800 }, 'lg').width).toBe(69);
        expect(cardDimensions({ width: 360, height: 800 }, 'sm').width).toBe(50);
        expect(cardDimensions({ width: 360, height: 800 }, 'xs').width).toBe(35);
    });

    it('caps portrait cards by the height (narrow browser windows)', () => {
        expect(baseCardHeight({ width: 500, height: 800 })).toBe(112);
    });

    it('scales an md card from the height in the wide layout', () => {
        expect(baseCardHeight({ width: 780, height: 360 })).toBe(82);
        expect(baseCardHeight({ width: 844, height: 390 })).toBe(89);
    });

    it('clamps to 56-132dp (tablets and the desktop stop at 132dp)', () => {
        expect(baseCardHeight({ width: 200, height: 100 })).toBe(56);
        expect(baseCardHeight({ width: 3000, height: 2000 })).toBe(132);
        expect(baseCardHeight({ width: 1024, height: 1366 })).toBe(132);
    });

    it('keeps the card aspect ratio for every size', () => {
        for (const window of [{ width: 780, height: 360 }, { width: 360, height: 800 }]) {
            for (const size of ['xxs', 'xs', 'sm', 'md', 'lg'] as const) {
                const { width, height } = cardDimensions(window, size);
                expect(height / width).toBeCloseTo(1.4, 1);
            }
        }
    });

    it('lets a face-down card peek out by at least 3dp', () => {
        expect(stackOffset(10)).toBe(3);
        expect(stackOffset(61)).toBe(8);
    });
});

describe('seatPositions', () => {
    const seats = (order: string[], me: string | undefined, layout: 'portrait' | 'wide') =>
        seatPositions(order, me, layout).map(seat => `${seat.name}:${seat.position}`);

    it('seats 2 players opposite each other', () => {
        expect(seats(['me', 'a'], 'me', 'portrait')).toEqual(['a:top']);
        expect(seats(['a', 'me'], 'me', 'wide')).toEqual(['a:top']);
    });

    it('seats 3 players top-left / top-right in portrait, left / right in wide', () => {
        expect(seats(['me', 'a', 'b'], 'me', 'portrait')).toEqual(['a:top-left', 'b:top-right']);
        expect(seats(['me', 'a', 'b'], 'me', 'wide')).toEqual(['a:left', 'b:right']);
    });

    it('seats 4 players left, top, right in both layouts', () => {
        expect(seats(['me', 'a', 'b', 'c'], 'me', 'portrait')).toEqual(['a:left', 'b:top', 'c:right']);
        expect(seats(['me', 'a', 'b', 'c'], 'me', 'wide')).toEqual(['a:left', 'b:top', 'c:right']);
    });

    it('goes clockwise in turn order, starting with the player after you', () => {
        expect(seats(['a', 'b', 'me', 'c'], 'me', 'portrait')).toEqual(['c:left', 'a:top', 'b:right']);
        expect(seats(['a', 'me', 'b'], 'me', 'portrait')).toEqual(['b:top-left', 'a:top-right']);
        expect(seats(['a', 'b', 'c', 'me'], 'me', 'wide')).toEqual(['a:left', 'b:top', 'c:right']);
    });

    it('takes the order as starting after you when you are not in it', () => {
        expect(seats(['a', 'b', 'c'], undefined, 'portrait')).toEqual(['a:left', 'b:top', 'c:right']);
        expect(seats(['a', 'b'], 'me', 'wide')).toEqual(['a:left', 'b:right']);
    });

    it('handles no opponents, duplicates and more than 3 opponents', () => {
        expect(seats(['me'], 'me', 'portrait')).toEqual([]);
        expect(seats(['me', 'a', 'a'], 'me', 'portrait')).toEqual(['a:top']);
        expect(seats(['me', 'a', 'b', 'c', 'd'], 'me', 'wide')).toEqual(['a:left', 'b:top', 'c:top', 'd:right']);
    });
});

describe('handFanLayout', () => {
    it('draws one back per card while they fit', () => {
        expect(handFanLayout(4, 25, 10)).toEqual({ drawn: 4, step: 10, width: 55, compressed: false });
        expect(handFanLayout(10, 25, 10)).toMatchObject({ drawn: 10, width: 115, compressed: false });
    });

    it('squeezes more cards into the width of a full fan', () => {
        const fan = handFanLayout(15, 25, 10);
        expect(fan).toMatchObject({ drawn: 15, width: 115, compressed: true });
        expect(25 + fan.step * (fan.drawn - 1)).toBeCloseTo(115);
        expect(handFanLayout(40, 25, 10)).toMatchObject({ drawn: 20, width: 115, compressed: true });
    });

    it('is empty without cards', () => {
        expect(handFanLayout(0, 25)).toMatchObject({ drawn: 0, width: 0 });
    });
});

describe('handArcLayout (hand held as a fan)', () => {
    const W = 63;
    const H = 88;

    it('is empty without cards', () => {
        expect(handArcLayout(0, W, H, 300)).toEqual({ cards: [], height: 0, step: 0 });
    });

    it('centres a single card, untilted', () => {
        const { cards } = handArcLayout(1, W, H, 300, 10);
        expect(cards).toEqual([{ left: Math.round((300 - W) / 2), top: 10, rotation: 0 }]);
    });

    it('tilts the cards symmetrically, left to right, and drops the ends (an arch)', () => {
        const { cards } = handArcLayout(5, W, H, 300);
        const rotations = cards.map(c => c.rotation);
        expect(rotations[0]).toBeLessThan(0);
        expect(rotations[2]).toBe(0);
        expect(rotations[4]).toBe(-rotations[0]);
        expect(cards[0].top).toBe(cards[4].top);
        expect(cards[0].top).toBeGreaterThan(cards[2].top);
        // Centred: equal room on both sides.
        expect(cards[0].left).toBeCloseTo(300 - (cards[4].left + W), -1);
    });

    it('spreads a short hand comfortably and closes up a long one to fit, without scrolling', () => {
        expect(handArcLayout(4, W, H, 344).step).toBeCloseTo(W * 0.62);
        const long = handArcLayout(20, W, H, 344);
        expect(long.cards[19].left + W).toBeLessThanOrEqual(344 + 1);
        expect(long.cards[0].left).toBeGreaterThanOrEqual(-1);
        // Still each card's corner index (about a quarter of the width) shows.
        expect(long.step).toBeGreaterThan(W * 0.22);
    });

    it('caps the total tilt and has room for the lift and the dropped, tilted ends', () => {
        const { cards, height } = handArcLayout(30, W, H, 344, 14);
        expect(cards[29].rotation - cards[0].rotation).toBeLessThanOrEqual(50);
        expect(height).toBeGreaterThan(14 + H);
        expect(Math.max(...cards.map(c => c.top))).toBeLessThan(height - H);
    });
});

describe('cardJitter (how a card lies on a pile)', () => {
    it('is the same for the same key (no jumping between renders)', () => {
        expect(cardJitter('hearts-5-3', 6, 4)).toEqual(cardJitter('hearts-5-3', 6, 4));
    });

    it('stays within the limits', () => {
        for (let i = 0; i < 200; i++) {
            const { rotation, dx, dy } = cardJitter(`card-${i}`, 6, 4);
            expect(Math.abs(rotation)).toBeLessThanOrEqual(6);
            expect(Math.abs(dx)).toBeLessThanOrEqual(4);
            expect(Math.abs(dy)).toBeLessThanOrEqual(4);
        }
    });

    it('differs between cards and spreads both ways', () => {
        const rotations = Array.from({ length: 50 }, (_, i) => cardJitter(`card-${i}`, 6).rotation);
        expect(new Set(rotations).size).toBeGreaterThan(30);
        expect(Math.min(...rotations)).toBeLessThan(-2);
        expect(Math.max(...rotations)).toBeGreaterThan(2);
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

describe('nextSelection', () => {
    const cards: Record<string, TCard> = {
        'hand-clubs-5-0': { name: '5', value: 5, color: 'clubs' },
        'hand-spades-5-0': { name: '5', value: 5, color: 'spades' },
        'hand-hearts-8-0': { name: '8', value: 8, color: 'hearts' },
        'up-0-diamonds-5': { name: '5', value: 5, color: 'diamonds' },
    };
    const cardOf = (id: string) => cards[id];

    it('adds cards of the same value from the same place', () => {
        expect(nextSelection(['hand-clubs-5-0'], 'hand-spades-5-0', cardOf)).toEqual(['hand-clubs-5-0', 'hand-spades-5-0']);
    });

    it('starts over with another value, another place or a face-down card', () => {
        expect(nextSelection(['hand-clubs-5-0'], 'hand-hearts-8-0', cardOf)).toEqual(['hand-hearts-8-0']);
        expect(nextSelection(['hand-clubs-5-0'], 'up-0-diamonds-5', cardOf)).toEqual(['up-0-diamonds-5']);
        expect(nextSelection(['down-0'], 'down-1', cardOf)).toEqual(['down-1']);
    });

    it('deselects a selected card', () => {
        expect(nextSelection(['hand-clubs-5-0', 'hand-spades-5-0'], 'hand-clubs-5-0', cardOf)).toEqual(['hand-spades-5-0']);
    });
});

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { applyLay, buildPlayerView, timeOutTurn, validateLayCard } from '../../src/game.js';
import { games, modifyRooms, roomsList } from '../../src/rooms.js';

// Add-ons: after laying a card, its player may lay more of that value out of turn (e.g. another 7
// drawn from the deck) until the next player moves.

const card = (value, color = 'clubs', extra = {}) => ({ name: String(value), value, color, ...extra });
const ROOM_ID = 1;
const socketA = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };

/** "a" is on turn with `hand`, "b" and "c" wait; the deck gives `deck` (first card first). */
const setUp = ({ hand, deck = [], laid = [card(5, 'hearts')] }) => {
    modifyRooms({
        [ROOM_ID]: {
            name: 'test room',
            owner: 'a',
            players: [
                { username: 'a', socketId: socketA.id },
                { username: 'b', socketId: 'socket-b' },
                { username: 'c', socketId: 'socket-c' },
            ],
            slots: 3,
            visibility: 'public',
        },
    });
    games[ROOM_ID] = {
        laidCards: laid,
        burntCards: null,
        deck,
        players: {
            a: { active: true, userCards: { hand, tableFlipped: [], table: [] } },
            b: { active: false, userCards: { hand: [card(13)], tableFlipped: [], table: [] } },
            c: { active: false, userCards: { hand: [card(13)], tableFlipped: [], table: [] } },
        },
    };
    return games[ROOM_ID];
};

const lay = (payload) => validateLayCard(socketA, { roomId: ROOM_ID, username: 'a', ...payload });

describe('add-ons', () => {
    test('a 7 drawn right after laying a 7 can follow it out of turn; the turn stays with the next player', () => {
        const game = setUp({ hand: [card(7), card(12)], deck: [card(7, 'hearts')] });
        applyLay(game, 'a', [card(7)]);
        assert.equal(game.players.b.active, true);
        assert.equal(game.addOnBy, 'a');
        assert.equal(buildPlayerView(roomsList[ROOM_ID], game, 'b').addOnBy, 'a');

        const checked = lay({ card: card(7, 'hearts') });
        assert.equal(checked.error, undefined);
        assert.equal(checked.addOn, true);
        applyLay(game, 'a', [checked.card], 0, { addOn: true });
        assert.deepEqual(game.laidCards.map((c) => c.value), [7, 7, 5]);
        assert.equal(game.players.b.active, true);
        assert.equal(game.addOnBy, 'a');
    });

    test('only the top card\'s value, and not blind', () => {
        const game = setUp({ hand: [card(7), card(12)], deck: [card(8)] });
        applyLay(game, 'a', [card(7)]);
        assert.equal(lay({ card: card(8) }).error, 'It is not your turn.');
        assert.equal(lay({ card: card(12) }).error, 'It is not your turn.');
        assert.equal(lay({ card: 0 }).error, 'It is not your turn.');
    });

    test('a 9 on a 9 counts as laid together (the tease rule is not checked)', () => {
        const nine = (color) => card(9, color, { isTeaseCard: true });
        const game = setUp({ hand: [nine('clubs'), card(12)], deck: [nine('hearts')] });
        applyLay(game, 'a', [nine('clubs')]);
        assert.equal(lay({ card: nine('hearts') }).addOn, true);
    });

    test('over once the next player moves, or their turn times out', () => {
        const game = setUp({ hand: [card(7), card(12)], deck: [card(7, 'hearts')] });
        applyLay(game, 'a', [card(7)]);
        applyLay(game, 'b', [card(13)]);
        assert.equal(game.addOnBy, 'b');
        assert.equal(lay({ card: card(7, 'hearts') }).error, 'It is not your turn.');

        const again = setUp({ hand: [card(7), card(12)], deck: [card(7, 'hearts')] });
        applyLay(again, 'a', [card(7)]);
        timeOutTurn(again);
        assert.equal(again.addOnBy, null);
        assert.equal(lay({ card: card(7, 'hearts') }).error, 'It is not your turn.');
    });

    test('an add-on making four of a kind burns the pile, and its player goes again', () => {
        const game = setUp({ hand: [card(7), card(7, 'hearts'), card(7, 'spades')], deck: [card(7, 'diamonds')], laid: [card(4)] });
        applyLay(game, 'a', [card(7), card(7, 'hearts'), card(7, 'spades')]);
        assert.equal(game.players.b.active, true);
        const checked = lay({ card: card(7, 'diamonds') });
        applyLay(game, 'a', [checked.card], 0, { addOn: true });
        assert.equal(game.laidCards, null);
        assert.equal(game.players.a.active, true);
        assert.equal(game.players.b.active, false);
        assert.equal(game.addOnBy, null);
    });

    test("an Ace's call stays on an added Ace", () => {
        const ace = (color) => card(14, color, { isMagicCard: true });
        const game = setUp({ hand: [ace('clubs'), card(12)], deck: [ace('hearts')] });
        applyLay(game, 'a', [ace('clubs')], 0, { call: 'c' });
        assert.deepEqual(game.call, { by: 'a', target: 'c' });
        applyLay(game, 'a', [lay({ card: ace('hearts') }).card], 0, { addOn: true });
        assert.deepEqual(game.call, { by: 'a', target: 'c' });
        assert.equal(game.players.c.active, true);
    });
});

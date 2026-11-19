import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { applyLay, buildPlayerView, clearSpots, markReady, nthCardSpot, spotsView, swapCards, validateLayCard, withoutCards } from '../../src/game.js';
import { games, modifyRooms, roomsList } from '../../src/rooms.js';

const card = (value, color = 'clubs') => ({ name: String(value), value, color });
const ROOM_ID = 1;
const socketA = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };

/** "a" is on turn; `laid` is the pile (top first). */
const setUp = ({ hand, tableFlipped = [], laid = [card(5, 'hearts')], deck = [], burnt = null }) => {
    modifyRooms({
        [ROOM_ID]: {
            name: 'test room',
            owner: 'a',
            players: [
                { username: 'a', socketId: socketA.id },
                { username: 'b', socketId: 'socket-b' },
            ],
            slots: 2,
            visibility: 'public',
        },
    });
    games[ROOM_ID] = {
        laidCards: laid,
        burntCards: burnt,
        deck,
        players: {
            a: { active: true, userCards: { hand, tableFlipped, table: [] } },
            b: { active: false, userCards: { hand: [card(13)], tableFlipped: [], table: [] } },
        },
    };
    return games[ROOM_ID];
};

describe('withoutCards', () => {
    test('removes one copy per laid card (two decks: identical cards)', () => {
        assert.deepEqual(withoutCards([card(7), card(7), card(9)], [card(7)]), [card(7), card(9)]);
        assert.deepEqual(withoutCards([card(7), card(7), card(9)], [card(7), card(7)]), [card(9)]);
    });
});

describe('validateLayCard with several cards', () => {
    test('accepts cards of the same value whose first fits the pile', () => {
        setUp({ hand: [card(5, 'clubs'), card(5, 'spades'), card(5, 'diamonds'), card(8)] });
        const cards = [card(5, 'clubs'), card(5, 'spades'), card(5, 'diamonds')];
        assert.deepEqual(validateLayCard(socketA, { card: cards[0], cards, roomId: ROOM_ID, username: 'a' }), { card: cards[0], cards });
    });

    test('rejects different values', () => {
        setUp({ hand: [card(5), card(8)] });
        assert.deepEqual(validateLayCard(socketA, { card: card(5), cards: [card(5), card(8)], roomId: ROOM_ID, username: 'a' }), {
            error: 'Only cards of the same value can be laid together.',
        });
    });

    test('needs a copy for every requested card', () => {
        setUp({ hand: [card(7), card(9)] });
        assert.deepEqual(validateLayCard(socketA, { card: card(7), cards: [card(7), card(7)], roomId: ROOM_ID, username: 'a' }), {
            error: "You don't have that card.",
        });
        setUp({ hand: [card(7), card(7), card(9)] });
        assert.equal(validateLayCard(socketA, { card: card(7), cards: [card(7), card(7)], roomId: ROOM_ID, username: 'a' }).error, undefined);
    });

    test('rejects cards that do not fit the pile', () => {
        setUp({ hand: [card(4), card(4, 'hearts')] });
        assert.deepEqual(
            validateLayCard(socketA, { card: card(4), cards: [card(4), card(4, 'hearts')], roomId: ROOM_ID, username: 'a' }),
            { error: 'You cannot lay that card.' },
        );
    });
});

describe('applyLay', () => {
    test('lays several cards, refills the hand to 3 and passes the turn', () => {
        const game = setUp({ hand: [card(5, 'clubs'), card(5, 'spades'), card(8)], deck: [card(11), card(12), card(13)] });
        applyLay(game, 'a', [card(5, 'clubs'), card(5, 'spades')], 0);
        assert.deepEqual(game.laidCards.map(c => `${c.value}${c.color[0]}`), ['5s', '5c', '5h']);
        assert.equal(game.players.a.userCards.hand.length, 3);
        assert.equal(game.deck.length, 1);
        assert.equal(game.players.a.active, false);
        assert.equal(game.players.b.active, true);
    });

    test('lays only the copies laid (two identical cards in hand)', () => {
        const game = setUp({ hand: [card(7), card(7), card(9), card(11)] });
        applyLay(game, 'a', [card(7)], 0);
        assert.deepEqual(game.players.a.userCards.hand, [card(7), card(9), card(11)]);
    });

    test('four of a kind on top burns the pile and the player goes again', () => {
        const game = setUp({ hand: [card(5, 'clubs'), card(5, 'spades'), card(5, 'diamonds'), card(8)], laid: [card(5, 'hearts'), card(3)] });
        applyLay(game, 'a', [card(5, 'clubs'), card(5, 'spades'), card(5, 'diamonds')], 0);
        assert.equal(game.laidCards, null);
        assert.equal(game.burntCards.length, 5);
        assert.equal(game.burntCards[0].value, 5);
        assert.equal(game.players.a.active, true);
    });

    test('a 10 burns the pile', () => {
        const game = setUp({ hand: [card(10), card(10, 'hearts'), card(4)], laid: [card(9)] });
        applyLay(game, 'a', [card(10), card(10, 'hearts')], 0);
        assert.equal(game.laidCards, null);
        assert.equal(game.burntCards.length, 3);
        assert.equal(game.players.a.active, true);
    });

    test('plays face-up cards once the hand is empty, not touching the hand', () => {
        const game = setUp({ hand: [], tableFlipped: [card(6), card(6, 'hearts'), card(12)] });
        applyLay(game, 'a', [card(6), card(6, 'hearts')], 0);
        // The played cards' spots stay empty: the 12 keeps its spot (on its face-down card).
        assert.deepEqual(game.players.a.userCards.tableFlipped, [null, null, card(12)]);
        assert.deepEqual(game.players.a.userCards.hand, []);
    });
});

describe('table spots', () => {
    test('nthCardSpot finds the n-th card still there', () => {
        const spots = [null, card(4), null, card(7)];
        assert.equal(nthCardSpot(spots, 0), 1);
        assert.equal(nthCardSpot(spots, 1), 3);
        assert.equal(nthCardSpot(spots, 2), -1);
    });

    test('clearSpots empties one spot per card', () => {
        assert.deepEqual(clearSpots([card(5), card(5), card(8)], [card(5)]), [null, card(5), card(8)]);
    });

    test('spotsView: each spot with its face-up card and whether a face-down card is under it', () => {
        const userCards = { hand: [], tableFlipped: [null, card(9), null], table: [card(2), card(3), null] };
        assert.deepEqual(spotsView(userCards), [
            { faceUp: null, faceDown: true },
            { faceUp: card(9), faceDown: true },
        ]);
        assert.deepEqual(spotsView({ hand: [], tableFlipped: [null], table: [null] }), []);
    });

    test('the view sends compact lists (older apps) and the spots', () => {
        const game = setUp({ hand: [], tableFlipped: [null, card(9), card(11)] });
        game.players.a.userCards.table = [card(2), null, card(4)];
        const view = buildPlayerView(roomsList[ROOM_ID], game, 'a');
        assert.deepEqual(view.userCards.tableFlipped, [card(9), card(11)]);
        assert.equal(view.userCards.table, 2);
        assert.deepEqual(view.userCards.spots, [
            { faceUp: null, faceDown: true },
            { faceUp: card(9), faceDown: false },
            { faceUp: card(11), faceDown: true },
        ]);
        const opponentView = buildPlayerView(roomsList[ROOM_ID], game, 'b');
        assert.deepEqual(opponentView.opponents.a.tableFlipped, [card(9), card(11)]);
        assert.equal(opponentView.opponents.a.table, 2);
        assert.equal(opponentView.opponents.a.spots.length, 3);
    });

    test('a blind card is chosen by its place among the face-down cards still there', () => {
        const game = setUp({ hand: [], tableFlipped: [null, null, null] });
        game.players.a.userCards.table = [null, card(4), card(8)];
        assert.deepEqual(validateLayCard(socketA, { card: 1, cardIndex: 2, roomId: ROOM_ID, username: 'a' }), { card: 1 });
        assert.equal(validateLayCard(socketA, { card: 2, cardIndex: 2, roomId: ROOM_ID, username: 'a' }).error, 'That card does not exist.');
    });

    test('face-down cards wait while face-up cards are left, even with gaps', () => {
        const game = setUp({ hand: [], tableFlipped: [null, card(9), null] });
        game.players.a.userCards.table = [card(2), card(3), card(4)];
        assert.equal(validateLayCard(socketA, { card: 0, cardIndex: 0, roomId: ROOM_ID, username: 'a' }).error, 'You have to play your other cards first.');
    });
});

describe('swap phase', () => {
    test('a hand card and a face-up card trade places', () => {
        const game = setUp({ hand: [card(3), card(9)], tableFlipped: [card(12), card(5)] });
        game.phase = 'swap';
        assert.equal(swapCards(game, 'a', card(3), card(12)), null);
        assert.deepEqual(game.players.a.userCards.hand, [card(12), card(9)]);
        assert.deepEqual(game.players.a.userCards.tableFlipped, [card(3), card(5)]);
    });

    test('rejects unknown cards, ready players and the play phase', () => {
        const game = setUp({ hand: [card(3)], tableFlipped: [card(12)] });
        game.phase = 'swap';
        assert.equal(swapCards(game, 'a', card(4), card(12)), "You don't have that card.");
        game.players.a.ready = true;
        assert.equal(swapCards(game, 'a', card(3), card(12)), 'You are ready already.');
        game.phase = 'play';
        assert.equal(swapCards(game, 'a', card(3), card(12)), 'Cards can only be swapped before the game starts.');
    });

    test('the play phase starts once everyone is ready', () => {
        const game = setUp({ hand: [card(3)] });
        game.phase = 'swap';
        assert.equal(markReady(game, 'a'), false);
        assert.equal(game.phase, 'swap');
        assert.equal(markReady(game, 'b'), true);
        assert.equal(game.phase, 'play');
    });

    test('no cards can be laid during the swap phase or while a missed blind card is shown', () => {
        const game = setUp({ hand: [card(8)] });
        game.phase = 'swap';
        assert.deepEqual(validateLayCard(socketA, { card: card(8), roomId: ROOM_ID, username: 'a' }), {
            error: 'Swap your cards first, then tap Ready.',
        });
        game.phase = 'play';
        game.blindMiss = { username: 'b', card: card(4) };
        assert.deepEqual(validateLayCard(socketA, { card: card(8), roomId: ROOM_ID, username: 'a' }), {
            error: 'Wait a moment, the pile is being picked up.',
        });
    });
});

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { validateLayCard } from '../../src/game.js';
import { games, modifyRooms } from '../../src/rooms.js';

const card = (name, value, extra = {}) => ({ name, value, color: 'clubs', ...extra });
const ROOM_ID = 1;
// Sockets as set up by socketAuth.js: `data.user` is the authenticated identity.
const socketA = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };
const socketB = { id: 'socket-b', data: { user: { id: 2, username: 'b', isGuest: true } } };
const anonymousSocket = { id: 'socket-anon', data: {} };

/** Two players: "a" (active, holds 4 and Q) and "b"; a J is on top of the pile. */
const setUpGame = ({ handA = [card('4', 4), card('Q', 12)], tableFlippedA = [card('K', 13)], tableA = [card('3', 3)] } = {}) => {
    modifyRooms({
        [ROOM_ID]: {
            name: 'test room',
            owner: 'a',
            players: [
                { username: 'a', socketId: socketA.id },
                { username: 'b', socketId: socketB.id },
            ],
            slots: 2,
            visibility: 'public',
        },
    });
    games[ROOM_ID] = {
        laidCards: [card('J', 11)],
        deck: [],
        players: {
            a: { active: true, userCards: { hand: handA, tableFlipped: tableFlippedA, table: tableA } },
            b: { active: false, userCards: { hand: [card('K', 13)], tableFlipped: [], table: [] } },
        },
    };
};

describe('validateLayCard', () => {
    beforeEach(() => setUpGame());

    test('accepts a valid card and returns the server copy', () => {
        const result = validateLayCard(socketA, { card: card('Q', 12), roomId: ROOM_ID, username: 'a' });
        assert.deepEqual(result, { card: card('Q', 12) });
        assert.equal(result.card, games[ROOM_ID].players.a.userCards.hand[1], 'must be the server-side object');
    });

    test('rejects a card that does not fit the pile', () => {
        assert.deepEqual(validateLayCard(socketA, { card: card('4', 4), roomId: ROOM_ID, username: 'a' }), {
            error: 'You cannot lay that card.',
        });
    });

    test('ignores client-sent card flags (fake magic card)', () => {
        const fake = card('4', 4, { isMagicCard: true });
        assert.deepEqual(validateLayCard(socketA, { card: fake, roomId: ROOM_ID, username: 'a' }), {
            error: 'You cannot lay that card.',
        });
    });

    test("rejects a card the player doesn't hold", () => {
        assert.deepEqual(validateLayCard(socketA, { card: card('K', 13), roomId: ROOM_ID, username: 'a' }), {
            error: "You don't have that card.",
        });
    });

    test('rejects a move out of turn', () => {
        assert.deepEqual(validateLayCard(socketB, { card: card('K', 13), roomId: ROOM_ID, username: 'b' }), {
            error: 'It is not your turn.',
        });
    });

    test('rejects playing as another player', () => {
        assert.deepEqual(validateLayCard(socketB, { card: card('Q', 12), roomId: ROOM_ID, username: 'a' }), {
            error: 'You can only act as yourself.',
        });
    });

    test('rejects an unauthenticated socket', () => {
        assert.deepEqual(validateLayCard(anonymousSocket, { card: card('Q', 12), roomId: ROOM_ID, username: 'a' }), {
            error: 'You need to log in or join as a guest first.',
        });
    });

    test('rejects the right user on a different socket than the one in the room', () => {
        const otherSocketOfA = { id: 'socket-a-2', data: { user: { id: 1, username: 'a', isGuest: false } } };
        assert.deepEqual(validateLayCard(otherSocketOfA, { card: card('Q', 12), roomId: ROOM_ID, username: 'a' }), {
            error: 'You are not a player in this game.',
        });
    });

    test('rejects an unknown room', () => {
        assert.deepEqual(validateLayCard(socketA, { card: card('Q', 12), roomId: 99, username: 'a' }), {
            error: 'This game does not exist.',
        });
    });

    test('plays face-up table cards once the hand is empty', () => {
        setUpGame({ handA: [] });
        assert.deepEqual(validateLayCard(socketA, { card: card('K', 13), roomId: ROOM_ID, username: 'a' }), { card: card('K', 13) });
    });

    describe('face-down (blind) table cards', () => {
        test('are rejected while the hand is not empty', () => {
            assert.deepEqual(validateLayCard(socketA, { card: 0, roomId: ROOM_ID, username: 'a' }), {
                error: 'You have to play your other cards first.',
            });
        });

        test('are rejected while face-up table cards are left', () => {
            setUpGame({ handA: [] });
            assert.deepEqual(validateLayCard(socketA, { card: 0, roomId: ROOM_ID, username: 'a' }), {
                error: 'You have to play your other cards first.',
            });
        });

        test('are accepted by index once only face-down cards are left', () => {
            setUpGame({ handA: [], tableFlippedA: [] });
            assert.deepEqual(validateLayCard(socketA, { card: 0, roomId: ROOM_ID, username: 'a' }), { card: 0 });
        });

        test('reject an out-of-range index', () => {
            setUpGame({ handA: [], tableFlippedA: [] });
            assert.deepEqual(validateLayCard(socketA, { card: 5, roomId: ROOM_ID, username: 'a' }), {
                error: 'That card does not exist.',
            });
        });
    });
});

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { modifyRoomMessages, roomMessages } from '../../src/chat.js';
import { games, modifyRooms, roomsList, stopGame, stopGameError } from '../../src/rooms.js';

const ROOM_ID = 1;
const OTHER_ROOM_ID = 2;
// Sockets as set up by socketAuth.js: `data.user` is the authenticated identity.
const ownerSocket = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };
const otherSocket = { id: 'socket-b', data: { user: { id: 2, username: 'b', isGuest: true } } };
const anonymousSocket = { id: 'socket-anon', data: {} };

const room = (owner, extra = {}) => ({
    name: `${owner}'s room`,
    owner,
    players: [
        { username: 'a', socketId: ownerSocket.id },
        { username: 'b', socketId: otherSocket.id },
    ],
    slots: 2,
    visibility: 'public',
    socketRoomId: `game-${ROOM_ID}`,
    ...extra,
});

const setUp = ({ inGame = true } = {}) => {
    modifyRooms({ [ROOM_ID]: room('a', { inGame }), [OTHER_ROOM_ID]: room('c') });
    for (const key of Object.keys(games)) delete games[key];
    if (inGame) games[ROOM_ID] = { players: {}, deck: [] };
    modifyRoomMessages({ [`game-${ROOM_ID}`]: [{ id: 1 }], [`game-${OTHER_ROOM_ID}`]: [{ id: 2 }] });
};

describe('stopGameError', () => {
    beforeEach(() => setUp());

    test('lets the owner stop a running game', () => {
        assert.equal(stopGameError(ownerSocket, ROOM_ID), null);
    });

    test('rejects other players', () => {
        assert.equal(stopGameError(otherSocket, ROOM_ID), 'Only the room owner can do that.');
    });

    test('rejects anonymous sockets', () => {
        assert.match(stopGameError(anonymousSocket, ROOM_ID), /log in/i);
    });

    test('rejects unknown rooms', () => {
        assert.equal(stopGameError(ownerSocket, 99), 'This room does not exist.');
    });

    test('rejects a room whose game has not started', () => {
        setUp({ inGame: false });
        assert.equal(stopGameError(ownerSocket, ROOM_ID), 'The game has not started.');
    });
});

describe('stopGame', () => {
    beforeEach(() => setUp());

    test('removes the game, the room and its chat, and nothing else', () => {
        const rooms = stopGame(ROOM_ID);
        assert.equal(games[ROOM_ID], undefined);
        assert.deepEqual(Object.keys(rooms), [String(OTHER_ROOM_ID)]);
        assert.equal(roomsList, rooms);
        assert.deepEqual(roomMessages, { [`game-${OTHER_ROOM_ID}`]: [{ id: 2 }] });
    });
});

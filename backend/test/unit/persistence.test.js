import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { modifyRoomMessages, roomMessages } from '../../src/chat.js';
import { restoreRooms, snapshotOf } from '../../src/persistence.js';
import { games, modifyRooms, roomsList } from '../../src/rooms.js';

describe('game snapshots', () => {
    test('a room, its game and its chat come back exactly as they were', () => {
        const room = { name: 'pub', owner: 'a', players: [{ username: 'a', socketId: 's1' }], slots: 2, visibility: 'public', inGame: true };
        const game = { phase: 'play', direction: -1, players: { a: { active: true, userCards: { hand: [{ name: '5', value: 5, color: 'clubs' }], tableFlipped: [null], table: [] } } } };
        const messages = [{ id: 1, senderName: 'a', message: 'hi', time: '10:00' }];
        modifyRooms({ 4: room, 5: { ...room, name: 'lobby', inGame: false } });
        games[4] = game;
        modifyRoomMessages({ 'game-4': messages });
        const rows = [4, 5].map(roomId => ({ room_id: roomId, state: snapshotOf(roomId) }));

        modifyRooms({});
        delete games[4];
        modifyRoomMessages({});

        assert.deepEqual(restoreRooms(rows), [4, 5]);
        assert.deepEqual(roomsList[4], room);
        assert.equal(roomsList[5].name, 'lobby');
        assert.deepEqual(games[4], game);
        assert.equal(games[5], undefined, 'a lobby room has no game');
        assert.deepEqual(roomMessages['game-4'], messages);
    });

    test('restoring replaces what is in memory', () => {
        modifyRooms({ 9: { name: 'old', owner: 'x', players: [], slots: 2 } });
        games[9] = { phase: 'play', players: {} };
        restoreRooms([]);
        assert.deepEqual(roomsList, {});
        assert.equal(games[9], undefined);
    });
});

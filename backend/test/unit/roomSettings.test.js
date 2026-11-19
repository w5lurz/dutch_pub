import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { modifyRooms, roomsList, validateRoomSettingsUpdate } from '../../src/rooms.js';

const ROOM_ID = 1;
// Sockets as set up by socketAuth.js: `data.user` is the authenticated identity.
const ownerSocket = { id: 'socket-a', data: { user: { id: 1, username: 'a', isGuest: false } } };
const otherSocket = { id: 'socket-b', data: { user: { id: 2, username: 'b', isGuest: true } } };
const anonymousSocket = { id: 'socket-anon', data: {} };

const setUpRoom = (extra = {}) =>
    modifyRooms({
        [ROOM_ID]: {
            name: 'test room',
            owner: 'a',
            players: [
                { username: 'a', socketId: ownerSocket.id },
                { username: 'b', socketId: otherSocket.id },
            ],
            slots: 2,
            visibility: 'public',
            settings: { showCardPowers: true, cardBack: 'red', turnTimer: 30 },
            ...extra,
        },
    });

describe('validateRoomSettingsUpdate', () => {
    beforeEach(() => setUpRoom());

    test('lets the owner change a setting', () => {
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { showCardPowers: false } }), {
            settings: { showCardPowers: false, cardBack: 'red', turnTimer: 30 },
            visibility: 'public',
        });
    });

    test('drops unknown keys and keeps current values for invalid ones', () => {
        setUpRoom({ settings: { showCardPowers: false, cardBack: 'blue', turnTimer: 60 } });
        assert.deepEqual(
            validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { showCardPowers: 'yes', cardBack: 'green', turnTimer: 45, mirror: true } }),
            { settings: { showCardPowers: false, cardBack: 'blue', turnTimer: 60 }, visibility: 'public' },
        );
    });

    test('lets the owner change the card back colour', () => {
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { cardBack: 'blue' } }), {
            settings: { showCardPowers: true, cardBack: 'blue', turnTimer: 30 },
            visibility: 'public',
        });
    });

    test('rejects an unknown card back colour', () => {
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { cardBack: 'green' } }), {
            settings: { showCardPowers: true, cardBack: 'red', turnTimer: 30 },
            visibility: 'public',
        });
    });

    test('fills defaults for a room without settings', () => {
        setUpRoom({ settings: undefined });
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: {} }), {
            settings: { showCardPowers: true, cardBack: 'red', turnTimer: 30 },
            visibility: 'public',
        });
    });

    test('does not change the room itself', () => {
        validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { showCardPowers: false } });
        assert.deepEqual(roomsList[ROOM_ID].settings, { showCardPowers: true, cardBack: 'red', turnTimer: 30 });
    });

    test('lets the owner change the turn timer (off, 15, 30, 60 s)', () => {
        for (const turnTimer of [0, 15, 60]) {
            assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { turnTimer } }), {
                settings: { showCardPowers: true, cardBack: 'red', turnTimer },
                visibility: 'public',
            });
        }
    });

    test('lets the owner switch the room between public and private', () => {
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, visibility: 'private' }), {
            settings: { showCardPowers: true, cardBack: 'red', turnTimer: 30 },
            visibility: 'private',
        });
        setUpRoom({ visibility: 'private' });
        assert.equal(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, visibility: 'public' }).visibility, 'public');
    });

    test('keeps the visibility when it is missing or invalid', () => {
        assert.equal(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { turnTimer: 15 } }).visibility, 'public');
        assert.equal(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, visibility: 'secret' }).visibility, 'public');
    });

    test('rejects a visibility change by anyone but the owner', () => {
        assert.deepEqual(validateRoomSettingsUpdate(otherSocket, { roomId: ROOM_ID, visibility: 'private' }), {
            error: 'Only the room owner can do that.',
        });
    });

    test('rejects anyone but the owner', () => {
        assert.deepEqual(validateRoomSettingsUpdate(otherSocket, { roomId: ROOM_ID, settings: { showCardPowers: false } }), {
            error: 'Only the room owner can do that.',
        });
    });

    test('rejects anonymous sockets', () => {
        assert.deepEqual(validateRoomSettingsUpdate(anonymousSocket, { roomId: ROOM_ID, settings: {} }), {
            error: 'You need to log in or join as a guest first.',
        });
    });

    test('rejects an unknown room or a missing payload', () => {
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: 99, settings: {} }), { error: 'This room does not exist.' });
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, null), { error: 'This room does not exist.' });
    });

    test('rejects changes after the game has started', () => {
        setUpRoom({ inGame: true });
        assert.deepEqual(validateRoomSettingsUpdate(ownerSocket, { roomId: ROOM_ID, settings: { showCardPowers: false } }), {
            error: 'Settings cannot be changed after the game has started.',
        });
    });
});

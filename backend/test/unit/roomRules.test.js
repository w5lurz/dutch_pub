import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { createRoomError, deleteRoomError, joinRoomError, leaveRoomError, modifyRooms, startGameError } from '../../src/rooms.js';

// Sockets as set up by socketAuth.js: `data.user` is the authenticated identity.
const socketOf = (username, isGuest = false) => ({ id: `socket-${username}`, data: { user: { id: 1, username, isGuest } } });
const owner = socketOf('owner');
const player = socketOf('player');
const guest = socketOf('guest', true);
const outsider = socketOf('outsider');

const room = (extra = {}) => ({
    name: 'room',
    owner: 'owner',
    players: [
        { username: 'owner', socketId: owner.id },
        { username: 'player', socketId: player.id },
    ],
    slots: 3,
    visibility: 'public',
    ...extra,
});

describe('room rules (the server checks what the app only hides)', () => {
    beforeEach(() => modifyRooms({ 1: room() }));

    describe('create-room', () => {
        const valid = { name: 'Pub', owner: 'outsider', slots: 2, visibility: 'private' };
        test('a registered user outside any room may create one', () => {
            assert.equal(createRoomError(outsider, valid), null);
        });
        test('guests may not', () => {
            assert.equal(createRoomError(guest, { ...valid, owner: 'guest' }), 'Guests cannot create rooms. Log in to create one.');
        });
        test('not while in a room (owner or player)', () => {
            assert.equal(createRoomError(owner, { ...valid, owner: 'owner' }), 'You are in a room already.');
            assert.equal(createRoomError(player, { ...valid, owner: 'player' }), 'You are in a room already.');
        });
        test('needs a name, 2-4 seats and a visibility', () => {
            assert.match(createRoomError(outsider, { ...valid, name: '  ' }), /name/);
            assert.match(createRoomError(outsider, { ...valid, name: 'x'.repeat(41) }), /name/);
            assert.equal(createRoomError(outsider, { ...valid, slots: 5 }), 'A room has 2, 3 or 4 seats.');
            assert.equal(createRoomError(outsider, { ...valid, visibility: 'secret' }), 'A room is public or private.');
        });
        test('not when the server is full (MAX_ROOMS, default 300)', () => {
            const before = process.env.MAX_ROOMS;
            try {
                modifyRooms(Object.fromEntries(Array.from({ length: 300 }, (_, i) => [i + 1, room({ owner: `o${i}`, players: [] })])));
                assert.match(createRoomError(outsider, valid), /server is full/);
                process.env.MAX_ROOMS = '301';
                assert.equal(createRoomError(outsider, valid), null);
                process.env.MAX_ROOMS = '2';
                modifyRooms({ 1: room(), 2: room({ owner: 'x', players: [] }) });
                assert.match(createRoomError(outsider, valid), /server is full/);
            } finally {
                if (before === undefined) delete process.env.MAX_ROOMS;
                else process.env.MAX_ROOMS = before;
            }
        });
        test('only as yourself', () => {
            assert.equal(createRoomError(outsider, { ...valid, owner: 'someone' }), 'You can only act as yourself.');
        });
    });

    describe('join-room', () => {
        test('a free seat in a public room', () => {
            assert.equal(joinRoomError(outsider, { username: 'outsider', roomId: 1 }), null);
            assert.equal(joinRoomError(guest, { username: 'guest', roomId: 1 }), null);
        });
        test('guests cannot join private rooms; registered users can', () => {
            modifyRooms({ 1: room({ visibility: 'private' }) });
            assert.equal(joinRoomError(guest, { username: 'guest', roomId: 1 }), 'Guests cannot join private rooms.');
            assert.equal(joinRoomError(outsider, { username: 'outsider', roomId: 1 }), null);
        });
        test('not a full room, a started game, or a second room', () => {
            modifyRooms({ 1: room({ slots: 2 }) });
            assert.equal(joinRoomError(outsider, { username: 'outsider', roomId: 1 }), 'This room is full.');
            modifyRooms({ 1: room({ inGame: true }) });
            assert.equal(joinRoomError(outsider, { username: 'outsider', roomId: 1 }), 'The game in this room has started already.');
            modifyRooms({ 1: room(), 2: room({ owner: 'x', players: [] }) });
            assert.equal(joinRoomError(player, { username: 'player', roomId: 2 }), 'You are in a room already.');
        });
        test('an unknown room', () => {
            assert.equal(joinRoomError(outsider, { username: 'outsider', roomId: 9 }), 'This room does not exist.');
        });
    });

    describe('leave-room', () => {
        test('a player leaves before the start', () => {
            assert.equal(leaveRoomError(player, { username: 'player', roomId: 1 }), null);
        });
        test('not the owner, not during a game, not a room you are not in', () => {
            assert.equal(leaveRoomError(owner, { username: 'owner', roomId: 1 }), 'The owner cannot leave the room; delete it instead.');
            assert.equal(leaveRoomError(outsider, { username: 'outsider', roomId: 1 }), 'You are not in this room.');
            modifyRooms({ 1: room({ inGame: true }) });
            assert.equal(leaveRoomError(player, { username: 'player', roomId: 1 }), 'You cannot leave a running game.');
        });
    });

    describe('delete-room', () => {
        test('the owner, before the start', () => {
            assert.equal(deleteRoomError(owner, 1), null);
            assert.equal(deleteRoomError(player, 1), 'Only the room owner can do that.');
            modifyRooms({ 1: room({ inGame: true }) });
            assert.equal(deleteRoomError(owner, 1), 'The game is running; stop it instead.');
        });
    });

    describe('start-game', () => {
        test('the owner, with 2+ players, once', () => {
            assert.equal(startGameError(owner, 1), null);
            assert.equal(startGameError(player, 1), 'Only the room owner can do that.');
            modifyRooms({ 1: room({ players: [{ username: 'owner', socketId: owner.id }] }) });
            assert.equal(startGameError(owner, 1), 'At least 2 players are needed to start.');
            modifyRooms({ 1: room({ inGame: true }) });
            assert.equal(startGameError(owner, 1), 'The game has started already.');
        });
    });
});

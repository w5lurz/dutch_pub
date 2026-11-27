import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';

import { sendUiDataToSocket } from '../../src/game.js';
import { broadcastRooms, modifyRooms } from '../../src/rooms.js';

/** A stand-in for the socket.io server that records what was sent, and to whom. */
const fakeIo = () => {
    const sent = [];
    const target = (to, except = []) => ({ emit: (event, ...args) => sent.push({ to, except, event, args }) });
    return {
        sent,
        emit: (event, ...args) => sent.push({ to: 'all', except: [], event, args }),
        except: rooms => target('all', rooms),
        to: id => target(id),
    };
};

const room = (id, inGame = false) => ({
    name: `room ${id}`,
    owner: `owner${id}`,
    players: [{ username: `owner${id}`, socketId: `s${id}a` }, { username: `guest${id}`, socketId: `s${id}b` }],
    slots: 2,
    socketRoomId: `game-${id}`,
    visibility: 'public',
    inGame,
});

describe('room list broadcasts', () => {
    let run = 0;
    beforeEach(() => {
        // Each test further in the future, so the throttle's last broadcast (from earlier tests) is long past.
        mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() + 10 ** 9 * ++run });
        modifyRooms({ 1: room(1), 2: room(2, true) });
    });
    afterEach(() => mock.timers.reset());

    test('go out at once, but not to the players of running games', () => {
        const io = fakeIo();
        broadcastRooms(io, 'joined-room');
        assert.equal(io.sent.length, 1);
        assert.deepEqual(io.sent[0].except, ['game-2']);
        assert.equal(io.sent[0].event, 'joined-room');
        assert.deepEqual(Object.keys(io.sent[0].args[0]), ['1', '2']);
    });

    test('changes within a second go out together at its end: the latest list, the latest name', () => {
        const io = fakeIo();
        broadcastRooms(io, 'rooms-listed');
        broadcastRooms(io, 'joined-room');
        modifyRooms({ 1: room(1), 2: room(2, true), 3: room(3) });
        broadcastRooms(io, 'left-room');
        assert.equal(io.sent.length, 1, 'only the first so far');
        mock.timers.tick(1000);
        assert.equal(io.sent.length, 2);
        assert.equal(io.sent[1].event, 'left-room');
        assert.deepEqual(Object.keys(io.sent[1].args[0]), ['1', '2', '3']);
    });
});

describe('game updates', () => {
    test('carry only the game\'s own room; the start carries the whole list', () => {
        const rooms = { 1: room(1, true), 2: room(2) };
        modifyRooms(rooms);
        const game = {
            players: {
                owner1: { userCards: { hand: [], table: [], tableFlipped: [] }, active: true },
                guest1: { userCards: { hand: [], table: [], tableFlipped: [] }, active: false },
            },
            deck: [],
        };
        const io = fakeIo();
        sendUiDataToSocket(io, rooms[1], game, 'card-laid');
        assert.deepEqual(io.sent.map(sent => sent.to), ['s1a', 's1b']);
        assert.deepEqual(io.sent[0].args[1], { 1: rooms[1] });

        const start = fakeIo();
        sendUiDataToSocket(start, rooms[1], game, 'game-started', 1);
        assert.deepEqual(Object.keys(start.sent[0].args[1]), ['1', '2']);
        assert.equal(start.sent[0].args[2], 1);
    });
});

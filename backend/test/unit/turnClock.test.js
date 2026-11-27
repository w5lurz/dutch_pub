import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlayerView, clearTurnClock, startTurnClock, timeOutTurn } from '../../src/game.js';
import { games, modifyRooms } from '../../src/rooms.js';

const ROOM_ID = 7;

/** A fake socket.io server that records what is emitted, as [target, event, ...args]. */
const fakeIo = () => {
    const sent = [];
    return { sent, to: target => ({ emit: (...args) => sent.push([target, ...args]) }) };
};

const setUp = ({ turnTimer = 15, phase = 'play' } = {}) => {
    const room = {
        name: 'clock room',
        owner: 'a',
        players: [
            { username: 'a', socketId: 'socket-a' },
            { username: 'b', socketId: 'socket-b' },
            { username: 'c', socketId: 'socket-c' },
        ],
        slots: 3,
        visibility: 'public',
        inGame: true,
        settings: { showCardPowers: true, cardBack: 'red', turnTimer },
    };
    modifyRooms({ [ROOM_ID]: room });
    const cards = () => ({ hand: [], tableFlipped: [], table: [] });
    const game = {
        laidCards: null,
        burntCards: null,
        deck: [],
        phase,
        players: {
            a: { active: true, userCards: cards() },
            b: { active: false, userCards: cards() },
            c: { active: false, userCards: cards() },
        },
    };
    games[ROOM_ID] = game;
    return { room, game };
};

const activeName = game => Object.entries(game.players).find(([, player]) => player.active)?.[0];

describe('turn timer', () => {
    beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'Date'] }));
    afterEach(() => {
        if (games[ROOM_ID]) clearTurnClock(games[ROOM_ID]);
        delete games[ROOM_ID];
        mock.timers.reset();
    });

    test('timeOutTurn passes the turn on and returns who was skipped', () => {
        const { game } = setUp();
        assert.equal(timeOutTurn(game), 'a');
        assert.equal(activeName(game), 'b');
        assert.equal(timeOutTurn(game), 'b');
        assert.equal(timeOutTurn(game), 'c');
        assert.equal(activeName(game), 'a', 'wraps around');
    });

    test('skips the turn when the room’s time runs out, then times the next turn', () => {
        const { room, game } = setUp({ turnTimer: 15 });
        const io = fakeIo();
        startTurnClock(io, ROOM_ID, game);
        assert.equal(buildPlayerView(room, game, 'a').turnTimeLeft, 15000);
        assert.equal(buildPlayerView(room, game, 'b').turnTime, 15000);

        mock.timers.tick(10000);
        assert.equal(buildPlayerView(room, game, 'a').turnTimeLeft, 5000);
        assert.equal(activeName(game), 'a');

        mock.timers.tick(5000);
        assert.equal(activeName(game), 'b');
        assert.deepEqual(io.sent[0], [`game-${ROOM_ID}`, 'turn-timed-out', 'a']);
        const updates = io.sent.filter(([, event]) => event === 'game-updated');
        assert.equal(updates.length, 3, 'every player gets the new view');
        assert.equal(updates[0][2].turnTimeLeft, 15000, 'the next turn has its full time');

        mock.timers.tick(15000);
        assert.equal(activeName(game), 'c');
    });

    test('restarting the clock (a move was made) gives the full time again', () => {
        const { room, game } = setUp({ turnTimer: 30 });
        const io = fakeIo();
        startTurnClock(io, ROOM_ID, game);
        mock.timers.tick(20000);
        startTurnClock(io, ROOM_ID, game);
        mock.timers.tick(20000);
        assert.equal(activeName(game), 'a', 'the first clock was cancelled');
        assert.equal(buildPlayerView(room, game, 'a').turnTimeLeft, 10000);
    });

    test('no clock when the timer is off, in the swap phase, or during a missed blind card', () => {
        for (const [options, extra] of [
            [{ turnTimer: 0 }, {}],
            [{ phase: 'swap' }, {}],
            [{}, { blindMiss: { username: 'a', card: { name: '4', value: 4, color: 'clubs' } } }],
        ]) {
            const { room, game } = setUp(options);
            Object.assign(game, extra);
            const io = fakeIo();
            startTurnClock(io, ROOM_ID, game);
            assert.equal(buildPlayerView(room, game, 'a').turnTimeLeft, null);
            mock.timers.tick(120000);
            assert.equal(activeName(game), 'a');
            assert.equal(io.sent.length, 0);
        }
    });

    test('a stopped or finished game is never skipped', () => {
        const { game } = setUp();
        const io = fakeIo();
        startTurnClock(io, ROOM_ID, game);
        delete games[ROOM_ID];
        mock.timers.tick(15000);
        assert.equal(activeName(game), 'a');
        assert.equal(io.sent.length, 0);
    });

    test('clearTurnClock stops it', () => {
        const { room, game } = setUp();
        const io = fakeIo();
        startTurnClock(io, ROOM_ID, game);
        clearTurnClock(game);
        mock.timers.tick(60000);
        assert.equal(activeName(game), 'a');
        assert.equal(buildPlayerView(room, game, 'a').turnTimeLeft, null);
    });
});

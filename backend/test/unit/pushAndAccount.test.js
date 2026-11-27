import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DELETED_PLAYER, isReservedUsername, withoutPlayer } from '../../src/account.js';
import { buildLeaderBoard } from '../../src/controllers/played_game.controller.js';
import { isAway, isExpoPushToken, turnMessage } from '../../src/push.js';

const fakeIo = sockets => ({ of: () => ({ sockets: new Map(sockets.map((socket, i) => [i, socket])) }) });
const socketOf = (username, { connected = true, background = false } = {}) => ({ connected, data: { user: { username }, background } });

describe('push notifications', () => {
    test('only Expo push tokens are accepted', () => {
        assert.ok(isExpoPushToken('ExponentPushToken[abc-123]'));
        assert.ok(isExpoPushToken('ExpoPushToken[abc]'));
        assert.equal(isExpoPushToken('abc'), false);
        assert.equal(isExpoPushToken('ExponentPushToken[]'), false);
        assert.equal(isExpoPushToken(null), false);
    });

    test('a player is away without a connected socket in the foreground', () => {
        assert.equal(isAway(fakeIo([socketOf('a')]), 'a'), false);
        assert.equal(isAway(fakeIo([socketOf('a', { background: true })]), 'a'), true);
        assert.equal(isAway(fakeIo([socketOf('a', { connected: false })]), 'a'), true);
        assert.equal(isAway(fakeIo([socketOf('b')]), 'a'), true);
        assert.equal(isAway(fakeIo([socketOf('a', { background: true }), socketOf('a')]), 'a'), false, 'open on another phone');
    });

    test('the message: your turn, or an Ace call', () => {
        const room = { name: 'Pub' };
        assert.deepEqual(turnMessage(room, { call: null }, 'a'), { title: 'Your turn', body: 'Lay a card in Pub.' });
        assert.deepEqual(turnMessage(room, { call: { by: 'b', target: 'a' } }, 'a'), {
            title: 'b called you!',
            body: 'Lay a magic card or pick up the pile (Pub).',
        });
    });
});

describe('account deletion', () => {
    test("a deleted player's name is replaced in played games, only where it is the whole name", () => {
        assert.equal(withoutPlayer('anna,annabel,bob', 'anna'), `${DELETED_PLAYER},annabel,bob`);
        assert.equal(withoutPlayer('bob', 'anna'), 'bob');
    });

    test('the placeholder name is reserved', () => {
        assert.ok(isReservedUsername('[deleted]'));
        assert.ok(isReservedUsername(' [Deleted] '));
        assert.equal(isReservedUsername('deleted'), false);
    });

    test('deleted players are neither on the leaderboard nor anyone\'s favourite friend', () => {
        const board = buildLeaderBoard([
            { winner: DELETED_PLAYER, players: `${DELETED_PLAYER},bob`, game_date: '2026-01-01' },
            { winner: 'bob', players: `bob,${DELETED_PLAYER}`, game_date: '2026-01-02' },
            { winner: 'bob', players: `bob,${DELETED_PLAYER}`, game_date: '2026-01-03' },
            { winner: 'bob', players: 'bob,cecil', game_date: '2026-01-04' },
        ]);
        assert.deepEqual(
            board.map(entry => [entry.winner, entry.wins, entry.favouriteFriend]),
            [['bob', 3, 'cecil']],
        );
    });
});

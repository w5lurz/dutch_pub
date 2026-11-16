// End-to-end tests: run the real server against the database configured in backend/.env.
// Creates one `e2e_*` user and deletes it again afterwards.
//
// TODO missing coverage:
// - `draw-cards` happy path: picking up the pile (hand gets the laid cards, turn passes on).
//   (Rejection out of turn is covered below.)
// - Winning a game: `game-won` broadcast, room removed, `played_games` row written
//   (needs cleanup of that row, like the test user) and shown on the leaderboard.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

import db from '../../src/models/index.js';
import { startServer, waitFor } from './helpers.js';

const stamp = Date.now().toString(36);
const user = { username: `e2e_${stamp}`, email: `e2e_${stamp}@example.test`, password: 'e2e-password-123' };
const guestName = `e2e_guest_${stamp}`;

let server;
let sessionCookie = ''; // web client: token in the session cookie
let userToken = ''; // mobile client: token from the login response
let guestToken = '';

const request = (path, { method = 'GET', body, cookie, token } = {}) =>
    fetch(server.baseUrl + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(cookie && { cookie }),
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...(body && { body: JSON.stringify(body) }),
    });

/** Connects a socket; resolves once connected (or rejects with the connect error). */
const connectSocket = async options => {
    const socket = io(server.baseUrl, { transports: ['websocket'], reconnection: false, ...options });
    await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
    });
    return socket;
};

before(async () => {
    server = await startServer();
});

after(async () => {
    await server?.stop();
    await db.user.destroy({ where: { username: user.username } });
    await db.sequelize.close();
});

describe('auth API', () => {
    test('signs up a new user', async () => {
        const res = await request('/api/auth/signup', { method: 'POST', body: user });
        assert.equal(res.status, 201);
    });

    test('rejects a duplicate signup', async () => {
        const res = await request('/api/auth/signup', { method: 'POST', body: user });
        assert.equal(res.status, 400);
    });

    test('rejects a wrong password', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: 'wrong' } });
        assert.equal(res.status, 401);
    });

    test('rejects an unknown user', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: `nobody_${stamp}`, password: 'x' } });
        assert.equal(res.status, 404);
    });

    test('logs in, sets a session cookie and returns a token', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: user.password } });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.username, user.username);
        assert.equal(body.password, undefined);
        assert.equal(typeof body.token, 'string');
        userToken = body.token;
        sessionCookie = res.headers
            .getSetCookie()
            .map(cookie => cookie.split(';')[0])
            .join('; ');
        assert.match(sessionCookie, /app-session=/);
    });

    test('adds a guest and returns a guest token', async () => {
        const res = await request('/api/auth/add-guest', { method: 'POST', body: { username: guestName } });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.isGuest, true);
        assert.equal(typeof body.token, 'string');
        guestToken = body.token;
    });

    test('rejects a duplicate or empty guest name', async () => {
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: guestName } })).status, 403);
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: user.username } })).status, 403);
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: '  ' } })).status, 400);
    });
});

describe('users API', () => {
    test('returns the current user with a session cookie (web)', async () => {
        const res = await request('/api/users/user', { cookie: sessionCookie });
        assert.equal(res.status, 200);
        assert.equal((await res.json()).username, user.username);
    });

    test('returns the current user with a bearer token (mobile)', async () => {
        const res = await request('/api/users/user', { token: userToken });
        assert.equal(res.status, 200);
        assert.equal((await res.json()).username, user.username);
    });

    test('returns the guest for a guest token', async () => {
        const res = await request('/api/users/user', { token: guestToken });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(typeof body.id, 'number');
        assert.deepEqual(body, { id: body.id, username: guestName, isGuest: true });
    });

    test('rejects requests without a session or token', async () => {
        assert.equal((await request('/api/users/user')).status, 403);
    });

    test('rejects an invalid bearer token', async () => {
        assert.equal((await request('/api/users/user', { token: 'not-a-jwt' })).status, 401);
    });

    test('rejects a forged session cookie', async () => {
        const res = await request('/api/users/user', { cookie: 'app-session=forged; app-session.sig=bad' });
        assert.equal(res.status, 403);
    });

    test('/api/users/all requires a session', async () => {
        assert.equal((await request('/api/users/all')).status, 403);
    });

    test('/api/users/all never exposes passwords or emails', async () => {
        const res = await request('/api/users/all', { token: userToken });
        assert.equal(res.status, 200);
        const users = await res.json();
        assert.ok(users.some(u => u.username === user.username));
        for (const u of users) {
            assert.deepEqual(Object.keys(u).sort(), ['id', 'username']);
        }
    });
});

describe('games API and frontend', () => {
    test('serves the leaderboard', async () => {
        const res = await request('/api/games/leaderboard');
        assert.ok([200, 404].includes(res.status), `status ${res.status}`); // 404 = no games played yet
    });

    test('serves index.html for / and client-side routes', async () => {
        for (const path of ['/', '/play', '/game']) {
            const res = await request(path);
            assert.equal(res.status, 200, path);
            assert.match(await res.text(), /<div id="root">/, path);
        }
    });
});

describe('socket authentication', () => {
    test('anonymous sockets can list rooms but not act', async () => {
        const anonymous = await connectSocket();
        try {
            anonymous.emit('list-rooms');
            await waitFor(anonymous, 'rooms-listed');

            anonymous.emit('create-room', { name: 'nope', owner: user.username, slots: 2, visibility: 'public' });
            const [reason] = await waitFor(anonymous, 'action-rejected');
            assert.equal(reason, 'You need to log in or join as a guest first.');
        } finally {
            anonymous.close();
        }
    });

    test('anonymous sockets get an empty game state', async () => {
        const anonymous = await connectSocket();
        try {
            anonymous.emit('get-game-state');
            const [state] = await waitFor(anonymous, 'game-state');
            assert.equal(state.roomId, null);
            assert.equal(state.game, null);
            assert.deepEqual(state.messages, []);
        } finally {
            anonymous.close();
        }
    });

    test('an invalid handshake token is rejected', async () => {
        await assert.rejects(connectSocket({ auth: { token: 'not-a-jwt' } }), { message: 'unauthorized' });
    });

    test('web sockets are identified from the session cookie', async () => {
        const web = await connectSocket({ extraHeaders: { cookie: sessionCookie } });
        try {
            // Identified (otherwise: "You need to log in ..."), but only as themselves.
            web.emit('create-room', { name: 'nope', owner: guestName, slots: 2, visibility: 'public' });
            const [reason] = await waitFor(web, 'action-rejected');
            assert.equal(reason, 'You can only act as yourself.');
        } finally {
            web.close();
        }
    });
});

describe('socket game flow', () => {
    let a; // the registered user (token), room owner
    let b; // the guest (guest token)
    let roomId;
    let games; // { a: Game, b: Game } as last received

    before(async () => {
        a = await connectSocket({ auth: { token: userToken } });
        b = await connectSocket({ auth: { token: guestToken } });
    });

    after(() => {
        a?.close();
        b?.close();
    });

    test('creates a room and broadcasts it', async () => {
        const broadcast = waitFor(b, 'rooms-listed');
        a.emit('create-room', { name: `room_${stamp}`, owner: user.username, slots: 2, visibility: 'public' });
        const [rooms] = await broadcast;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `room_${stamp}`));
        assert.ok(roomId, 'room not found in broadcast');
    });

    test('rejects joining a room as someone else', async () => {
        a.emit('join-room', { username: guestName, roomId });
        const [reason] = await waitFor(a, 'action-rejected');
        assert.equal(reason, 'You can only act as yourself.');
    });

    test('lets another player join', async () => {
        const broadcast = waitFor(a, 'joined-room');
        b.emit('join-room', { username: guestName, roomId });
        const [rooms] = await broadcast;
        assert.deepEqual(
            rooms[roomId].players.map(player => player.username),
            [user.username, guestName],
        );
    });

    test('only the owner can start the game', async () => {
        b.emit('start-game', roomId, b.id);
        const [reason] = await waitFor(b, 'action-rejected');
        assert.equal(reason, 'Only the room owner can do that.');
    });

    test('starts the game for both players', async () => {
        const startedA = waitFor(a, 'game-started');
        const startedB = waitFor(b, 'game-started');
        a.emit('start-game', roomId, a.id);
        const [[gameA], [gameB]] = await Promise.all([startedA, startedB]);
        games = { a: gameA, b: gameB };

        for (const game of [gameA, gameB]) {
            assert.equal(game.userCards.hand.length, 3);
            assert.equal(game.userCards.tableFlipped.length, 3);
            assert.equal(game.userCards.table, 3);
            assert.equal(game.laidCards, null);
        }
        assert.notEqual(!!gameA.active, !!gameB.active, 'exactly one player must be active');
    });

    test('players who reconnect with a new socket get their seat and state back', async () => {
        const handsBefore = { a: games.a.userCards.hand, b: games.b.userCards.hand };
        a.close();
        b.close();
        // New sockets (new ids), as after the app was in the background past the recovery window.
        a = await connectSocket({ auth: { token: userToken } });
        b = await connectSocket({ auth: { token: guestToken } });

        a.emit('get-game-state');
        b.emit('get-game-state');
        const [[stateA], [stateB]] = await Promise.all([waitFor(a, 'game-state'), waitFor(b, 'game-state')]);

        for (const [state, name] of [
            [stateA, 'a'],
            [stateB, 'b'],
        ]) {
            assert.equal(state.roomId, roomId);
            assert.ok(state.rooms[roomId].inGame);
            assert.deepEqual(state.game.userCards.hand, handsBefore[name]);
        }
        assert.equal(stateA.game.opponents[guestName].hand, 3);
        games = { a: stateA.game, b: stateB.game };
        // The following tests act and listen on the new sockets, so they also prove the
        // server re-bound both seats (moves are only accepted from the seat's socket).
    });

    const players = () =>
        games.a.active
            ? { active: { socket: a, name: user.username, game: games.a }, waiting: { socket: b, name: guestName, game: games.b } }
            : { active: { socket: b, name: guestName, game: games.b }, waiting: { socket: a, name: user.username, game: games.a } };

    test('rejects a move out of turn', async () => {
        const { waiting } = players();
        waiting.socket.emit('lay-card', { card: waiting.game.userCards.hand[0], cardIndex: 0, roomId, username: waiting.name });
        const [reason] = await waitFor(waiting.socket, 'lay-card-rejected');
        assert.equal(reason, 'It is not your turn.');
    });

    test('rejects picking up the pile out of turn', async () => {
        const { waiting } = players();
        waiting.socket.emit('draw-cards', { roomId, username: waiting.name });
        const [reason] = await waitFor(waiting.socket, 'action-rejected');
        assert.equal(reason, 'It is not your turn.');
    });

    test('rejects playing as another player', async () => {
        const { active, waiting } = players();
        waiting.socket.emit('lay-card', { card: active.game.userCards.hand[0], cardIndex: 0, roomId, username: active.name });
        const [reason] = await waitFor(waiting.socket, 'lay-card-rejected');
        assert.equal(reason, 'You can only act as yourself.');
    });

    test('accepts a valid move and broadcasts it', async () => {
        const { active } = players();
        const card = active.game.userCards.hand[0];
        const laidA = waitFor(a, 'card-laid');
        const laidB = waitFor(b, 'card-laid');
        active.socket.emit('lay-card', { card, cardIndex: 0, roomId, username: active.name });
        const [[afterA], [afterB]] = await Promise.all([laidA, laidB]);

        for (const game of [afterA, afterB]) {
            // A 10 burns the pile instead of staying on it.
            const top = (game.laidCards ?? game.burntCards)[0];
            assert.deepEqual({ value: top.value, color: top.color }, { value: card.value, color: card.color });
        }
    });

    test('rejects chat messages sent as someone else', async () => {
        a.emit('send-message', { roomId, username: guestName, message: 'spoofed' });
        const [reason] = await waitFor(a, 'action-rejected');
        assert.equal(reason, 'You can only act as yourself.');
    });

    test('delivers chat messages to the room', async () => {
        const received = waitFor(b, 'message-sent');
        a.emit('send-message', { roomId, username: user.username, message: 'hello' });
        const [messages] = await received;
        assert.deepEqual(
            { senderName: messages.at(-1).senderName, message: messages.at(-1).message },
            { senderName: user.username, message: 'hello' },
        );
    });

    test('only the owner can delete the room', async () => {
        b.emit('delete-room', roomId);
        const [reason] = await waitFor(b, 'action-rejected');
        assert.equal(reason, 'Only the room owner can do that.');
    });
});

describe('logout', () => {
    test('clears the session', async () => {
        const res = await request('/api/auth/logout', { method: 'POST', cookie: sessionCookie });
        assert.equal(res.status, 200);
    });
});

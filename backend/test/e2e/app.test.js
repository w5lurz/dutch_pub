// End-to-end tests: run the real server against the database configured in backend/.env.
// Creates one `e2e_*` user with a `user_profiles` row (their avatar) and, by playing a game to
// the end, one `played_games` row, and deletes them again afterwards.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { canLayCard, DEFAULT_ROOM_SETTINGS } from '@dutch-pub/shared';
import { io } from 'socket.io-client';

import db from '../../src/models/index.js';
import { startServer, waitFor } from './helpers.js';

const stamp = Date.now().toString(36);
const user = { username: `e2e_${stamp}`, email: `e2e_${stamp}@example.test`, password: 'e2e-password-123' };
const guestName = `e2e_guest_${stamp}`;

let server;
let userToken = ''; // from the login response
let guestToken = '';
let userRefresh = ''; // refresh tokens from the login / add-guest responses
let guestRefresh = '';

const request = (path, { method = 'GET', body, token } = {}) =>
    fetch(server.baseUrl + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
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
    const created = await db.user.findOne({ where: { username: user.username }, attributes: ['id'], raw: true });
    if (created) await db.user_profile.destroy({ where: { user_id: created.id } });
    if (created) await db.refresh_token.destroy({ where: { user_id: created.id } });
    await db.user.destroy({ where: { username: user.username } });
    await db.played_game.destroy({ where: { winner: [user.username, guestName] } });
    await db.game_snapshot.destroy({ where: { scope: { [db.Sequelize.Op.like]: 'e2e-%' } } });
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

    test('rejects an unknown user with the same answer as a wrong password', async () => {
        const unknown = await request('/api/auth/login', { method: 'POST', body: { username: `nobody_${stamp}`, password: 'x' } });
        const wrong = await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: 'wrong' } });
        assert.equal(unknown.status, 401);
        assert.deepEqual(await unknown.json(), await wrong.json());
    });

    test('a guest who logs out frees the name at once; their old tokens stop working', async () => {
        const name = `e2e_mate_${stamp}`;
        const first = await (await request('/api/auth/add-guest', { method: 'POST', body: { username: name } })).json();
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: name } })).status, 403, 'taken while logged in');
        assert.equal((await request('/api/auth/logout', { method: 'POST', body: { refreshToken: first.refreshToken } })).status, 204);
        const again = await request('/api/auth/add-guest', { method: 'POST', body: { username: name } });
        assert.equal(again.status, 200, 'free again after logging out');
        assert.equal((await request('/api/auth/refresh', { method: 'POST', body: { refreshToken: first.refreshToken } })).status, 401);
        await request('/api/auth/logout', { method: 'POST', body: { refreshToken: (await again.json()).refreshToken } });
    });

    test('logs in with the email too', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: user.email.toUpperCase(), password: user.password } });
        assert.equal(res.status, 200);
        assert.equal((await res.json()).username, user.username);
        const wrong = await request('/api/auth/login', { method: 'POST', body: { username: user.email, password: 'wrong' } });
        assert.equal(wrong.status, 401);
    });

    test('logs in and returns a token', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: user.password } });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.username, user.username);
        assert.equal(body.password, undefined);
        assert.equal(typeof body.token, 'string');
        assert.equal(body.avatar, null, 'no avatar chosen yet');
        userToken = body.token;
        assert.equal(typeof body.refreshToken, 'string');
        userRefresh = body.refreshToken;
        assert.equal(res.headers.get('set-cookie'), null, 'no cookies: the app uses bearer tokens only');
    });

    test('adds a guest and returns a guest token', async () => {
        const res = await request('/api/auth/add-guest', { method: 'POST', body: { username: guestName } });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.isGuest, true);
        assert.equal(typeof body.token, 'string');
        guestToken = body.token;
        assert.equal(typeof body.refreshToken, 'string');
        guestRefresh = body.refreshToken;
    });

    test('rejects a duplicate or empty guest name', async () => {
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: guestName } })).status, 403);
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: user.username } })).status, 403);
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: '  ' } })).status, 400);
    });
});

describe('refresh tokens', () => {
    const refresh = refreshToken => request('/api/auth/refresh', { method: 'POST', body: { refreshToken } });

    test('a refresh token gives a new access token and a new refresh token; the old one stops working', async () => {
        const res = await refresh(userRefresh);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.username, user.username);
        assert.notEqual(body.refreshToken, userRefresh);
        assert.equal((await request('/api/users/user', { token: body.token })).status, 200);

        assert.equal((await refresh(userRefresh)).status, 401, 'used once only');
        userRefresh = body.refreshToken;
    });

    test('logging out revokes the refresh token', async () => {
        const login = await (
            await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: user.password } })
        ).json();
        assert.equal((await request('/api/auth/logout', { method: 'POST', body: { refreshToken: login.refreshToken } })).status, 204);
        assert.equal((await refresh(login.refreshToken)).status, 401);
        assert.equal((await refresh(userRefresh)).status !== 401, true, 'other sessions keep theirs');
        userRefresh = '';
    });

    test('a guest refreshes too, keeping their name', async () => {
        const res = await refresh(guestRefresh);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.username, guestName);
        assert.equal(body.isGuest, true);
        assert.equal((await request('/api/users/user', { token: body.token })).status, 200);
    });

    test('a refresh token is never accepted as an access token', async () => {
        assert.equal((await request('/api/users/user', { token: guestRefresh })).status, 401);
        assert.equal((await request('/api/users/user', { token: userRefresh || 'x' })).status, 401);
        await assert.rejects(
            new Promise((resolve, reject) => {
                const socket = io(server.baseUrl, { transports: ['websocket'], reconnection: false, auth: { token: guestRefresh } });
                socket.once('connect', () => (socket.close(), resolve()));
                socket.once('connect_error', error => (socket.close(), reject(error)));
            }),
            /unauthorized/,
        );
    });

    test('unknown or missing refresh tokens are refused', async () => {
        assert.equal((await refresh('nope')).status, 401);
        assert.equal((await request('/api/auth/refresh', { method: 'POST', body: {} })).status, 400);
    });
});

describe('users API', () => {
    test('returns the current user with a bearer token', async () => {
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

    test('rejects requests without a token', async () => {
        assert.equal((await request('/api/users/user')).status, 403);
    });

    test('rejects an invalid bearer token', async () => {
        assert.equal((await request('/api/users/user', { token: 'not-a-jwt' })).status, 401);
    });

    test('/api/users/all requires a token', async () => {
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

describe('avatar API', () => {
    const setAvatar = (avatar, token, method = 'PUT') => request('/api/auth/me/avatar', { method, body: { avatar }, token });

    test('a logged-in user saves an avatar', async () => {
        const res = await setAvatar('fox', userToken);
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), { avatar: 'fox' });
        assert.equal((await (await request('/api/users/user', { token: userToken })).json()).avatar, 'fox');
    });

    test('it survives logging in again', async () => {
        const res = await request('/api/auth/login', { method: 'POST', body: { username: user.username, password: user.password } });
        assert.equal((await res.json()).avatar, 'fox');
    });

    test('null goes back to the generated avatar; PATCH works too', async () => {
        const res = await setAvatar(null, userToken, 'PATCH');
        assert.equal(res.status, 200);
        assert.equal((await (await request('/api/users/user', { token: userToken })).json()).avatar, null);
        assert.equal((await setAvatar('fox', userToken)).status, 200);
    });

    test('rejects an unknown avatar id', async () => {
        assert.equal((await setAvatar('unicorn', userToken)).status, 400);
        assert.equal((await request('/api/auth/me/avatar', { method: 'PUT', body: {}, token: userToken })).status, 400);
        assert.equal((await (await request('/api/users/user', { token: userToken })).json()).avatar, 'fox', 'unchanged');
    });

    test('guests cannot choose one', async () => {
        assert.equal((await setAvatar('fox', guestToken)).status, 403);
    });

    test('requires a valid token', async () => {
        assert.equal((await setAvatar('fox')).status, 403);
        assert.equal((await setAvatar('fox', 'not-a-jwt')).status, 401);
    });
});

describe('games API', () => {
    test('serves the leaderboard', async () => {
        const res = await request('/api/games/leaderboard');
        assert.ok([200, 404].includes(res.status), `status ${res.status}`); // 404 = no games played yet
    });

    test('has a health endpoint and no website', async () => {
        const health = await request('/api/health');
        assert.equal(health.status, 200);
        assert.deepEqual(await health.json(), { status: 'ok', database: 'ok' });
        assert.equal((await request('/')).status, 404);
        assert.equal((await request('/play')).status, 404);
    });

    test('sends no CORS headers by default (native apps need none)', async () => {
        const res = await fetch(server.baseUrl + '/api/health', { headers: { Origin: 'https://evil.example' } });
        assert.equal(res.headers.get('access-control-allow-origin'), null);
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

    test('a guest keeps their name while disconnected', async () => {
        const guest = await connectSocket({ auth: { token: guestToken } });
        guest.close();
        await new Promise(resolve => setTimeout(resolve, 100)); // let the server see the disconnect
        const res = await request('/api/auth/add-guest', { method: 'POST', body: { username: guestName } });
        assert.equal(res.status, 403, 'the name must stay reserved until the guest token expires');
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
        a.emit('create-room', {
            name: `room_${stamp}`,
            owner: user.username,
            slots: 2,
            visibility: 'public',
            settings: { showCardPowers: false, cardBack: 'green', unknownSetting: 'dropped' },
        });
        const [rooms] = await broadcast;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `room_${stamp}`));
        assert.ok(roomId, 'room not found in broadcast');
        assert.deepEqual(rooms[roomId].settings, { ...DEFAULT_ROOM_SETTINGS, showCardPowers: false, cardBack: 'red' }, 'settings are validated');
        assert.equal(rooms[roomId].players[0].avatar, 'fox', "the owner's chosen avatar");
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
        assert.equal(rooms[roomId].players[1].avatar, null, 'guests have none (generated on the clients)');
    });

    test('a new avatar shows in the room at once', async () => {
        const broadcast = waitFor(b, 'rooms-listed');
        assert.equal((await request('/api/auth/me/avatar', { method: 'PUT', body: { avatar: 'owl' }, token: userToken })).status, 200);
        const [rooms] = await broadcast;
        assert.deepEqual(
            rooms[roomId].players.map(player => player.avatar),
            ['owl', null],
        );
    });

    test('only the owner can change the room settings', async () => {
        b.emit('update-room-settings', { roomId, settings: { showCardPowers: true } });
        const [reason] = await waitFor(b, 'action-rejected');
        assert.equal(reason, 'Only the room owner can do that.');
    });

    test('the owner changes the room settings and everyone gets them', async () => {
        const broadcast = waitFor(b, 'rooms-listed');
        a.emit('update-room-settings', { roomId, settings: { showCardPowers: true, cardBack: 'blue', unknownSetting: 1 } });
        const [rooms] = await broadcast;
        assert.deepEqual(rooms[roomId].settings, { ...DEFAULT_ROOM_SETTINGS, showCardPowers: true, cardBack: 'blue' });
    });

    test('an unknown card back colour keeps the current one', async () => {
        const broadcast = waitFor(b, 'rooms-listed');
        a.emit('update-room-settings', { roomId, settings: { cardBack: 'green' } });
        const [rooms] = await broadcast;
        assert.deepEqual(rooms[roomId].settings, { ...DEFAULT_ROOM_SETTINGS, showCardPowers: true, cardBack: 'blue' });
    });

    test('the owner switches the room to private and back; everyone sees it', async () => {
        const visibilityBefore = (await new Promise(resolve => {
            b.once('rooms-listed', resolve);
            b.emit('list-rooms');
        }))[roomId].visibility;
        for (const visibility of ['private', 'public', visibilityBefore]) {
            const broadcast = waitFor(b, 'rooms-listed');
            a.emit('update-room-settings', { roomId, visibility });
            const [rooms] = await broadcast;
            assert.equal(rooms[roomId].visibility, visibility);
            assert.deepEqual(rooms[roomId].settings, { ...DEFAULT_ROOM_SETTINGS, showCardPowers: true, cardBack: 'blue' }, 'settings unchanged');
        }
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

    test('room settings cannot be changed after the game has started', async () => {
        a.emit('update-room-settings', { roomId, settings: { showCardPowers: false } });
        const [reason] = await waitFor(a, 'action-rejected');
        assert.equal(reason, 'Settings cannot be changed after the game has started.');
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

    test('the game starts in the swap phase: no moves yet', async () => {
        assert.equal(games.a.phase, 'swap');
        const mover = games.a.active ? { socket: a, name: user.username, game: games.a } : { socket: b, name: guestName, game: games.b };
        mover.socket.emit('lay-card', { card: mover.game.userCards.hand[0], cardIndex: 0, roomId, username: mover.name });
        const [reason] = await waitFor(mover.socket, 'lay-card-rejected');
        assert.equal(reason, 'Swap your cards first, then tap Ready.');
    });

    test('a player swaps a hand card with a face-up card; the other player sees it', async () => {
        const hand = games.a.userCards.hand[0];
        const faceUp = games.a.userCards.tableFlipped[0];
        const updatedA = waitFor(a, 'game-updated');
        const updatedB = waitFor(b, 'game-updated');
        a.emit('swap-cards', { roomId, username: user.username, hand, faceUp });
        const [[viewA], [viewB]] = await Promise.all([updatedA, updatedB]);
        assert.deepEqual(viewA.userCards.hand[0], faceUp);
        assert.deepEqual(viewA.userCards.tableFlipped[0], hand);
        assert.deepEqual(viewB.opponents[user.username].tableFlipped[0], hand);
        games = { a: viewA, b: viewB };
    });

    test('the play phase starts once both players are ready', async () => {
        const first = waitFor(b, 'game-updated');
        a.emit('player-ready', { roomId, username: user.username });
        const [afterFirst] = await first;
        assert.equal(afterFirst.phase, 'swap');
        assert.equal(afterFirst.opponents[user.username].ready, true);

        a.emit('swap-cards', { roomId, username: user.username, hand: games.a.userCards.hand[0], faceUp: games.a.userCards.tableFlipped[0] });
        assert.equal((await waitFor(a, 'action-rejected'))[0], 'You are ready already.');

        const startedA = waitFor(a, 'game-updated');
        const startedB = waitFor(b, 'game-updated');
        b.emit('player-ready', { roomId, username: guestName });
        const [[viewA], [viewB]] = await Promise.all([startedA, startedB]);
        assert.equal(viewA.phase, 'play');
        assert.equal(viewB.phase, 'play');
        games = { a: viewA, b: viewB };
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
        games = { a: afterA, b: afterB };
    });

    test('only the owner can delete the room', async () => {
        b.emit('delete-room', roomId);
        const [reason] = await waitFor(b, 'action-rejected');
        assert.equal(reason, 'Only the room owner can do that.');
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

    test('picking up the pile gives the laid cards to the active player and passes the turn', async () => {
        const { active, waiting } = players();
        const laid = active.game.laidCards ?? [];
        const expectedHand = [...active.game.userCards.hand, ...laid].map(cardKey).sort();
        const drawnActive = waitFor(active.socket, 'cards-drawn');
        const drawnWaiting = waitFor(waiting.socket, 'cards-drawn');
        active.socket.emit('draw-cards', { roomId, username: active.name });
        const [[afterActive], [afterWaiting]] = await Promise.all([drawnActive, drawnWaiting]);

        assert.deepEqual(afterActive.userCards.hand.map(cardKey).sort(), expectedHand);
        assert.equal(afterActive.laidCards, null);
        assert.equal(afterActive.active, false);
        assert.equal(afterWaiting.active, true);
        assert.equal(afterWaiting.opponents[active.name].hand, expectedHand.length);
        games = active.socket === a ? { a: afterActive, b: afterWaiting } : { a: afterWaiting, b: afterActive };
    });

    test('a game played to the end is won, recorded and leaves no room behind', { timeout: 60000 }, async () => {
        const sockets = { [user.username]: a, [guestName]: b };
        const views = { [user.username]: games.a, [guestName]: games.b };
        const won = Promise.all([waitFor(a, 'game-won', 60000), waitFor(b, 'game-won', 60000)]);
        let fail;
        const failed = new Promise((_, reject) => (fail = reject));
        let moves = 0;

        // Both players are simple bots (see `botMove`).
        const act = name => {
            const view = views[name];
            // A missed blind card is being shown: no moves until the pile is picked up.
            if (!view.active || view.blindMiss) return;
            if (++moves > 20000) return fail(new Error('game did not end within 20000 moves'));
            const move = botMove(view);
            sockets[name].emit(move.event, { ...move.payload, roomId, username: name });
        };
        let finished = false;
        for (const [name, socket] of Object.entries(sockets)) {
            for (const event of ['card-laid', 'cards-drawn', 'game-updated']) {
                socket.on(event, view => {
                    views[name] = view;
                    if (!finished) act(name);
                });
            }
            socket.on('lay-card-rejected', reason => fail(new Error(`bot move rejected: ${reason}`)));
            socket.on('action-rejected', reason => fail(new Error(`bot move rejected: ${reason}`)));
        }
        for (const name of Object.keys(sockets)) act(name);

        const [[winnerA, roomsA], [winnerB]] = await Promise.race([won, failed]);
        finished = true;
        assert.equal(winnerA, winnerB);
        assert.ok([user.username, guestName].includes(winnerA));
        assert.equal(roomsA[roomId], undefined, 'the room is removed when the game is won');

        // The played_games row is written right after the broadcast.
        let row;
        for (let i = 0; i < 50 && !row; i++) {
            row = await db.played_game.findOne({ where: { winner: winnerA, players: `${user.username},${guestName}` }, raw: true });
            if (!row) await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(row, 'played_games row written');

        const res = await request('/api/games/leaderboard');
        assert.equal(res.status, 200);
        const entry = (await res.json()).find(e => e.winner === winnerA);
        assert.ok(entry && entry.wins >= 1, 'the winner is on the leaderboard');
        assert.equal(entry.winnerAvatar, winnerA === user.username ? 'owl' : null);
    });
});

describe('stopping a game', () => {
    let a; // the registered user, room owner
    let b; // the guest
    let roomId;

    before(async () => {
        a = await connectSocket({ auth: { token: userToken } });
        b = await connectSocket({ auth: { token: guestToken } });
        const created = waitFor(a, 'rooms-listed');
        a.emit('create-room', { name: `stop_${stamp}`, owner: user.username, slots: 2, visibility: 'public' });
        const [rooms] = await created;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `stop_${stamp}`));
        const joined = waitFor(a, 'joined-room');
        b.emit('join-room', { username: guestName, roomId });
        await joined;
    });

    after(() => {
        a?.close();
        b?.close();
    });

    test('cannot be done before the game has started', async () => {
        a.emit('stop-game', roomId);
        const [reason] = await waitFor(a, 'action-rejected');
        assert.equal(reason, 'The game has not started.');
    });

    test('only the owner can stop the game', async () => {
        const started = Promise.all([waitFor(a, 'game-started'), waitFor(b, 'game-started')]);
        a.emit('start-game', roomId);
        await started;
        b.emit('stop-game', roomId);
        const [reason] = await waitFor(b, 'action-rejected');
        assert.equal(reason, 'Only the room owner can do that.');
    });

    test('the owner stops it for everyone: no winner, no room, no game left', async () => {
        const winsBefore = await db.played_game.count({ where: { players: `${user.username},${guestName}` } });
        const stopped = Promise.all([waitFor(a, 'game-stopped'), waitFor(b, 'game-stopped')]);
        a.emit('stop-game', roomId);
        const [[ownerA, roomsA], [ownerB, roomsB]] = await stopped;
        assert.equal(ownerA, user.username);
        assert.equal(ownerB, user.username);
        assert.equal(roomsA[roomId], undefined, 'the room is removed');
        assert.equal(roomsB[roomId], undefined, 'the room is removed');

        b.emit('get-game-state');
        const [state] = await waitFor(b, 'game-state');
        assert.deepEqual({ roomId: state.roomId, game: state.game }, { roomId: null, game: null });

        // Nothing for the leaderboard (a win writes the row right after its broadcast).
        await new Promise(resolve => setTimeout(resolve, 300));
        assert.equal(await db.played_game.count({ where: { players: `${user.username},${guestName}` } }), winsBefore);
    });
});

describe('turn timer, private rooms and an owner who is gone', () => {
    // A second server whose clocks run fast: the 15 s turn timer runs out after 300 ms, and a
    // game waits 400 ms (not 2 minutes) for its disconnected owner.
    let fast;
    let a; // the registered user, room owner
    let b; // the guest
    let roomId;
    const connectFast = async token => {
        const socket = io(fast.baseUrl, { transports: ['websocket'], reconnection: false, auth: { token } });
        await new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });
        return socket;
    };

    before(async () => {
        fast = await startServer({ TURN_SECOND_MS: '20', OWNER_GONE_MS: '400' });
        a = await connectFast(userToken);
        b = await connectFast(guestToken);
        const created = waitFor(a, 'rooms-listed');
        a.emit('create-room', { name: `timer_${stamp}`, owner: user.username, slots: 2, visibility: 'private', settings: { turnTimer: 15 } });
        const [rooms] = await created;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `timer_${stamp}`));
        assert.equal(rooms[roomId].settings.turnTimer, 15);
    });

    after(async () => {
        a?.close();
        b?.close();
        await fast?.stop();
    });

    test('the server refuses a guest in a private room; once public, the guest joins', async () => {
        b.emit('join-room', { username: guestName, roomId });
        assert.equal((await waitFor(b, 'action-rejected'))[0], 'Guests cannot join private rooms.');

        const opened = waitFor(b, 'rooms-listed');
        a.emit('update-room-settings', { roomId, visibility: 'public' });
        await opened;
        const joined = waitFor(a, 'joined-room');
        b.emit('join-room', { username: guestName, roomId });
        const [rooms] = await joined;
        assert.equal(rooms[roomId].players.length, 2);
    });

    test('no clock during the swap phase; it starts with the first turn', async () => {
        const started = Promise.all([waitFor(a, 'game-started'), waitFor(b, 'game-started')]);
        a.emit('start-game', roomId);
        const [[viewA]] = await started;
        assert.equal(viewA.turnTimeLeft, null);

        const ready = waitFor(a, 'game-updated');
        a.emit('player-ready', { roomId, username: user.username });
        await ready;
        const playing = waitFor(a, 'game-updated');
        b.emit('player-ready', { roomId, username: guestName });
        const [view] = await playing;
        assert.equal(view.phase, 'play');
        assert.equal(view.turnTime, 300);
        assert.ok(view.turnTimeLeft > 0 && view.turnTimeLeft <= 300);
    });

    test('when the time runs out the turn is skipped, and the next one is timed', async () => {
        const timedOut = Promise.all([waitFor(a, 'turn-timed-out', 2000), waitFor(b, 'turn-timed-out', 2000)]);
        const updated = waitFor(a, 'game-updated', 2000);
        a.emit('get-game-state');
        const [{ game: before }] = await waitFor(a, 'game-state');
        const [[skippedA], [skippedB]] = await timedOut;
        const [after] = await updated;
        const onTurn = before.active ? user.username : guestName;
        assert.equal(skippedA, onTurn);
        assert.equal(skippedB, onTurn);
        assert.equal(after.active, !before.active, 'the turn passed');
        assert.deepEqual(after.userCards, before.userCards, 'nothing was laid or picked up');
        assert.ok(after.turnTimeLeft > 200, 'the next turn has (nearly) its full time');
    });

    test('the owner may come back in time; gone for good, the game is stopped for everyone', async () => {
        a.close();
        await new Promise(resolve => setTimeout(resolve, 200));
        a = await connectFast(userToken); // back within the 400 ms
        await new Promise(resolve => setTimeout(resolve, 400));
        a.emit('get-game-state');
        const [state] = await waitFor(a, 'game-state');
        assert.ok(state.game, 'the game still runs');

        const stopped = waitFor(b, 'game-stopped', 3000);
        a.close();
        const [owner, rooms, reason] = await stopped;
        assert.equal(owner, user.username);
        assert.equal(reason, 'owner-left');
        assert.equal(rooms[roomId], undefined, 'the room is gone');
    });
});

describe('a server restart keeps the games', () => {
    const scope = `e2e-restart-${stamp}`;
    let first;
    let second;
    let a;
    let b;
    let roomId;
    const connectTo = async (target, token) => {
        const socket = io(target.baseUrl, { transports: ['websocket'], reconnection: false, auth: { token } });
        await new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });
        return socket;
    };

    after(async () => {
        a?.close();
        b?.close();
        await first?.stop();
        await second?.stop();
    });

    test('a game running when the server stops is back after the restart, with the same cards and turn', async () => {
        first = await startServer({ SNAPSHOT_SCOPE: scope });
        a = await connectTo(first, userToken);
        b = await connectTo(first, guestToken);
        const created = waitFor(a, 'rooms-listed');
        a.emit('create-room', { name: `restart_${stamp}`, owner: user.username, slots: 2, visibility: 'public' });
        const [rooms] = await created;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `restart_${stamp}`));
        const joined = waitFor(a, 'joined-room');
        b.emit('join-room', { username: guestName, roomId });
        await joined;
        const started = Promise.all([waitFor(a, 'game-started'), waitFor(b, 'game-started')]);
        a.emit('start-game', roomId);
        const [[before]] = await started;
        const sent = waitFor(a, 'message-sent');
        b.emit('send-message', { roomId, username: guestName, message: 'before the restart' });
        await sent;
        await new Promise(resolve => setTimeout(resolve, 400)); // a snapshot is written every 100 ms

        a.close();
        b.close();
        await first.stop();
        first = undefined;

        second = await startServer({ SNAPSHOT_SCOPE: scope });
        a = await connectTo(second, userToken);
        a.emit('get-game-state');
        const [state] = await waitFor(a, 'game-state');
        assert.equal(state.roomId, roomId);
        assert.ok(state.rooms[roomId].inGame);
        assert.deepEqual(state.game.userCards.hand, before.userCards.hand);
        assert.deepEqual(state.game.userCards.tableFlipped, before.userCards.tableFlipped);
        assert.equal(state.game.active, before.active);
        assert.equal(state.game.phase, 'swap');
        assert.ok(state.messages.some(message => message.message === 'before the restart'), 'the chat is back too');
    });

    test('after the restart the game goes on, and ends (its snapshot goes with it)', async () => {
        b = await connectTo(second, guestToken);
        const stopped = waitFor(b, 'game-stopped');
        a.emit('stop-game', roomId);
        await stopped;
        await new Promise(resolve => setTimeout(resolve, 400));
        assert.equal(await db.game_snapshot.count({ where: { scope, room_id: roomId } }), 0);
    });
});

/** "value-color", to compare cards regardless of other fields. */
const cardKey = card => `${card.value}-${card.color}`;

/**
 * A bot's move for its view of the game: from the hand while it has cards, then the
 * face-up cards, then the first face-down card (played blind); `draw-cards` when nothing
 * fits. Usually the lowest playable card by value (magic cards last), but 30% of the time a
 * random playable one: always playing the same way can cycle forever (e.g. a hand of only
 * "Call Next" cards keeps making the other bot pick up the pile).
 */
function botMove(view) {
    const { hand, tableFlipped, table } = view.userCards;
    const pile = view.laidCards;
    const pick = cards => {
        const playable = cards
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => canLayCard(card, pile))
            .sort((x, y) => Number(!!x.card.isMagicCard) - Number(!!y.card.isMagicCard) || x.card.value - y.card.value);
        return Math.random() < 0.3 ? playable[Math.floor(Math.random() * playable.length)] : playable[0];
    };
    if (hand.length > 0 || tableFlipped.length > 0) {
        const choice = pick(hand.length > 0 ? hand : tableFlipped);
        return choice
            ? { event: 'lay-card', payload: { card: choice.card, cardIndex: choice.index } }
            : { event: 'draw-cards', payload: {} };
    }
    return { event: 'lay-card', payload: { card: 0, cardIndex: 0 } };
}


describe('bots', () => {
    // Its own server: bots think 5-15 ms instead of about a second; a missed blind card shows briefly.
    let botServer;
    let a; // the registered user, room owner
    let b; // the guest
    const roomName = `bots_${stamp}`;
    const connectBots = async token => {
        const socket = io(botServer.baseUrl, { transports: ['websocket'], reconnection: false, auth: { token } });
        await new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });
        return socket;
    };
    const lists = ['rooms-listed', 'joined-room', 'left-room', 'room-deleted'];
    const nextList = socket =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('no room list')), 5000);
            const handlers = lists.map(event => [event, rooms => { clearTimeout(timer); handlers.forEach(([e, h]) => socket.off(e, h)); resolve(rooms); }]);
            handlers.forEach(([event, handler]) => socket.on(event, handler));
        });
    let roomId;

    before(async () => {
        botServer = await startServer({ BOT_THINK_MIN_MS: '5', BOT_THINK_MAX_MS: '15' });
        a = await connectBots(userToken);
        b = await connectBots(guestToken);
    });

    after(async () => {
        a?.close();
        b?.close();
        await botServer?.stop();
    });

    test('only the owner adds bots, to free seats, before the game', async () => {
        const created = nextList(a);
        a.emit('create-room', { name: roomName, owner: user.username, slots: 3, visibility: 'public' });
        const rooms = await created;
        roomId = Number(Object.keys(rooms).find(key => rooms[key].name === roomName));

        b.emit('add-bot', roomId);
        assert.equal((await waitFor(b, 'action-rejected'))[0], 'Only the room owner can do that.');

        let list = nextList(a);
        a.emit('add-bot', roomId);
        let players = (await list)[roomId].players;
        assert.equal(players.length, 2);
        assert.equal(players[1].bot, true);
        assert.match(players[1].username, /^🤖 /);

        list = nextList(a);
        a.emit('add-bot', roomId);
        players = (await list)[roomId].players;
        assert.equal(players.length, 3);
        assert.notEqual(players[1].username, players[2].username, 'every bot has its own name');

        a.emit('add-bot', roomId);
        assert.equal((await waitFor(a, 'action-rejected'))[0], 'This room is full.');

        list = nextList(a);
        a.emit('remove-bot', { roomId, username: players[2].username });
        assert.equal((await list)[roomId].players.length, 2);
        list = nextList(a);
        a.emit('add-bot', roomId);
        await list;
    });

    test('bots get ready and play a whole game; it is not recorded', { timeout: 90000 }, async () => {
        const { Op } = db.Sequelize;
        const before = await db.played_game.count({ where: { players: { [Op.like]: `%${user.username}%` } } });
        let view;
        let finished = false;
        let moves = 0;
        const won = waitFor(a, 'game-won', 80000);
        const act = () => {
            if (finished || !view || view.phase === 'swap' || !view.active || view.blindMiss) return;
            if (++moves > 5000) return;
            const move = botMove(view);
            a.emit(move.event, { ...move.payload, roomId, username: user.username });
        };
        for (const event of ['game-started', 'card-laid', 'cards-drawn', 'game-updated']) {
            a.on(event, next => {
                view = next;
                act();
            });
        }
        const started = waitFor(a, 'game-started');
        a.emit('start-game', roomId);
        await started;
        // The bots get ready by themselves; the game starts once the owner is ready too.
        a.emit('player-ready', { roomId, username: user.username });
        const [winner, rooms] = await won;
        finished = true;
        assert.ok(winner === user.username || winner.startsWith('🤖 '), winner);
        assert.equal(rooms[roomId], undefined, 'the room is gone');
        await new Promise(resolve => setTimeout(resolve, 300));
        assert.equal(await db.played_game.count({ where: { players: { [Op.like]: `%${user.username}%` } } }), before, 'practice: not recorded');
        assert.equal(await db.played_game.count({ where: { players: { [Op.like]: '%🤖%' } } }), 0);
    });
});

describe('push notifications', () => {
    // Its own server: notifications go to a fake push service, turns time out fast (300 ms) so
    // they pass back and forth without anyone playing, and a turn's notification waits 50 ms.
    let pushServer;
    let fakePush;
    let received = []; // the messages the fake push service got
    const goneTokens = new Set(); // the fake push service answers DeviceNotRegistered for these
    let a; // the registered user
    let b; // the guest
    const tokenA = `ExponentPushToken[e2e-a-${stamp}]`;
    const tokenB = `ExponentPushToken[e2e-b-${stamp}]`;
    const roomName = `push_${stamp}`;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const pushRequest = (path, options) =>
        fetch(pushServer.baseUrl + path, {
            method: options.method,
            headers: { 'Content-Type': 'application/json', ...(options.token && { Authorization: `Bearer ${options.token}` }) },
            body: JSON.stringify(options.body),
        });
    const connectPush = async token => {
        const socket = io(pushServer.baseUrl, { transports: ['websocket'], reconnection: false, auth: { token } });
        await new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });
        return socket;
    };
    const sentTo = to => received.filter(message => message.to === to);
    const waitForPush = async (to, ms = 3000) => {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            const message = received.find(other => other.to === to);
            if (message) return message;
            await sleep(25);
        }
        throw new Error(`No notification to ${to}`);
    };

    before(async () => {
        fakePush = http.createServer((req, res) => {
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', () => {
                const messages = JSON.parse(body);
                received.push(...messages);
                res.setHeader('Content-Type', 'application/json');
                res.end(
                    JSON.stringify({
                        data: messages.map(message =>
                            goneTokens.has(message.to) ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' },
                        ),
                    }),
                );
            });
        });
        await new Promise(resolve => fakePush.listen(0, resolve));
        pushServer = await startServer({
            PUSH_URL: `http://localhost:${fakePush.address().port}/push`,
            PUSH_DELAY_MS: '50',
            TURN_SECOND_MS: '20',
        });
    });

    after(async () => {
        a?.close();
        b?.close();
        await pushServer?.stop();
        await new Promise(resolve => (fakePush ? fakePush.close(resolve) : resolve()));
        await db.push_token.destroy({ where: { token: [tokenA, tokenB] } });
    });

    test('a phone registers its push token (only an Expo push token)', async () => {
        assert.equal((await pushRequest('/api/users/me/push-token', { method: 'PUT', token: userToken, body: { token: 'nope' } })).status, 400);
        assert.equal((await pushRequest('/api/users/me/push-token', { method: 'PUT', body: { token: tokenA } })).status, 403);
        assert.equal((await pushRequest('/api/users/me/push-token', { method: 'PUT', token: userToken, body: { token: tokenA, language: 'hu' } })).status, 204);
        assert.equal((await pushRequest('/api/users/me/push-token', { method: 'PUT', token: guestToken, body: { token: tokenB } })).status, 204);
        assert.equal((await db.push_token.findByPk(tokenA))?.language, 'hu', "a registered user's token is stored, with the phone's language");
    });

    test('whoever is away gets "your turn"; whoever has the app open does not', async () => {
        a = await connectPush(userToken);
        b = await connectPush(guestToken);
        const created = waitFor(a, 'rooms-listed');
        a.emit('create-room', { name: roomName, owner: user.username, slots: 2, visibility: 'public', settings: { turnTimer: 15 } });
        const [rooms] = await created;
        const roomId = Number(Object.keys(rooms).find(key => rooms[key].name === roomName));
        const joined = waitFor(a, 'joined-room');
        b.emit('join-room', { username: guestName, roomId });
        await joined;
        const started = waitFor(b, 'game-started');
        a.emit('start-game', roomId);
        await started;
        b.emit('app-state', 'background');
        a.emit('player-ready', { roomId, username: user.username });
        b.emit('player-ready', { roomId, username: guestName });

        const message = await waitForPush(tokenB);
        assert.equal(message.title, 'Your turn');
        assert.equal(message.body, `Lay a card in ${roomName}.`);
        assert.equal(message.channelId, 'turn');
        assert.equal(message.data.roomId, roomId);
        await sleep(700); // a few more turns
        assert.equal(sentTo(tokenA).length, 0, 'the app is open: no notification');

        b.emit('app-state', 'active');
        await sleep(100);
        const count = sentTo(tokenB).length;
        await sleep(700);
        assert.equal(sentTo(tokenB).length, count, 'back in the app: no more notifications');
    });

    test('a phone that dropped the app is forgotten; logging out stops the notifications', async () => {
        goneTokens.add(tokenA);
        a.emit('app-state', 'background');
        const hungarian = await waitForPush(tokenA);
        assert.equal(hungarian.title, 'Te jössz', "in the phone's language");
        assert.equal(hungarian.body, `Rakj le egy lapot itt: ${roomName}.`);
        await sleep(100);
        assert.equal(await db.push_token.findByPk(tokenA), null);

        b.emit('app-state', 'background');
        await waitForPush(tokenB);
        assert.equal((await pushRequest('/api/auth/logout', { method: 'POST', body: { refreshToken: 'x', pushToken: tokenB } })).status, 204);
        await sleep(100);
        received = [];
        await sleep(700);
        assert.equal(sentTo(tokenB).length, 0);
    });
});

describe('account deletion', () => {
    test("the deletion page follows the browser's language", async () => {
        const res = await fetch(`${server.baseUrl}/account/delete`, { headers: { 'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8' } });
        const html = await res.text();
        assert.match(html, /<html lang="hu">/);
        assert.match(html, /Fiókom törlése/);
        assert.match(html, /name="lang" value="hu"/);
        assert.match(await (await fetch(`${server.baseUrl}/account/delete`)).text(), /Delete my account/);
    });

    const doomed = { username: `e2e_del_${stamp}`, email: `e2e_del_${stamp}@example.test`, password: 'e2e-password-456' };
    const web = { username: `e2e_delweb_${stamp}`, email: `e2e_delweb_${stamp}@example.test`, password: 'e2e-password-789' };
    const friend = `e2e_friend_${stamp}`;
    const { Op } = db.Sequelize;
    let token = '';

    before(async () => {
        await request('/api/auth/signup', { method: 'POST', body: doomed });
        token = (await (await request('/api/auth/login', { method: 'POST', body: doomed })).json()).token;
        await db.played_game.bulkCreate([
            { winner: doomed.username, players: `${doomed.username},${friend}` },
            { winner: friend, players: `${friend},${doomed.username}` },
        ]);
    });

    after(async () => {
        await db.played_game.destroy({ where: { players: { [Op.like]: `%${friend}%` } } });
        await db.user.destroy({ where: { username: [doomed.username, web.username] } });
    });

    test('nobody can take the name deleted players get', async () => {
        const res = await request('/api/auth/signup', { method: 'POST', body: { username: '[deleted]', email: `x_${stamp}@example.test`, password: 'x' } });
        assert.equal(res.status, 400);
        assert.equal((await request('/api/auth/add-guest', { method: 'POST', body: { username: '[Deleted]' } })).status, 400);
    });

    test('guests have no account; a wrong password or being in a room refuses it', async () => {
        assert.equal((await request('/api/users/me', { method: 'DELETE', token: guestToken, body: { password: 'x' } })).status, 403);
        assert.equal((await request('/api/users/me', { method: 'DELETE', token, body: { password: 'wrong' } })).status, 401);

        const socket = await connectSocket({ auth: { token } });
        const created = waitFor(socket, 'rooms-listed');
        socket.emit('create-room', { name: `del_${stamp}`, owner: doomed.username, slots: 2, visibility: 'public' });
        const [rooms] = await created;
        const roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `del_${stamp}`));
        const refused = await request('/api/users/me', { method: 'DELETE', token, body: { password: doomed.password } });
        assert.equal(refused.status, 409);
        assert.match((await refused.json()).message, /Leave the room/);

        const deletedRoom = waitFor(socket, 'room-deleted');
        socket.emit('delete-room', roomId);
        await deletedRoom;
        const disconnected = waitFor(socket, 'disconnect');
        assert.equal((await request('/api/users/me', { method: 'DELETE', token, body: { password: doomed.password } })).status, 204);
        await disconnected;
        socket.close();
    });

    test('the account is gone; the other players keep their games, without the name', async () => {
        assert.equal((await request('/api/auth/login', { method: 'POST', body: doomed })).status, 401);
        const games = await db.played_game.findAll({ where: { players: { [Op.like]: `%${friend}%` } }, raw: true });
        assert.deepEqual(games.map(game => [game.winner, game.players]).sort(), [
            ['[deleted]', `[deleted],${friend}`],
            [friend, `${friend},[deleted]`],
        ]);
        const board = await (await request('/api/games/leaderboard')).json();
        assert.equal(board.some(entry => entry.winner === '[deleted]' || entry.favouriteFriend === '[deleted]'), false);
        assert.ok(board.some(entry => entry.winner === friend));
    });

    test('the privacy policy and the deletion web page', async () => {
        const policy = await request('/privacy');
        assert.equal(policy.status, 200);
        assert.match(await policy.text(), /Dutch Pub privacy policy/);
        assert.match(await (await request('/account/delete')).text(), /<form method="post"/);

        await request('/api/auth/signup', { method: 'POST', body: web });
        const post = password =>
            fetch(`${server.baseUrl}/account/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: web.username, password }).toString(),
            });
        const wrong = await post('wrong');
        assert.equal(wrong.status, 401);
        assert.match(await wrong.text(), /Wrong username or password/);
        const right = await post(web.password);
        assert.equal(right.status, 200);
        assert.match(await right.text(), /has been deleted/);
        assert.equal(await db.user.findOne({ where: { username: web.username } }), null);
    });
});

describe('security', () => {
    // Its own server: chat without the 1 s gap and a higher event limit, so the limits under test
    // can be reached quickly; its login limits are its own too.
    let secure;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const post = (path, body) =>
        fetch(secure.baseUrl + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const connectSecure = async token => {
        const socket = io(secure.baseUrl, { transports: ['websocket'], reconnection: false, ...(token && { auth: { token } }) });
        await new Promise((resolve, reject) => {
            socket.once('connect', resolve);
            socket.once('connect_error', reject);
        });
        return socket;
    };
    const healthy = async () => (await fetch(`${secure.baseUrl}/api/health`)).ok;

    before(async () => {
        secure = await startServer({ CHAT_GAP_MS: '0', SOCKET_EVENTS_PER_SECOND: '500' });
    });

    after(async () => {
        await secure?.stop();
    });

    test('malformed socket events are refused, the server keeps running', async () => {
        const anonymous = await connectSecure();
        for (const [event, payload, answer = 'action-rejected'] of [
            ['create-room', undefined],
            ['lay-card', null, 'lay-card-rejected'],
            ['draw-cards', 'x'],
            ['join-room', 42],
            ['send-message', null],
            ['update-room-settings', null],
        ]) {
            const refused = waitFor(anonymous, answer);
            anonymous.emit(event, payload);
            await refused;
        }
        anonymous.close();

        const name = `sec_${stamp}`;
        const { token } = await (await post('/api/auth/add-guest', { username: name })).json();
        const guest = await connectSecure(token);
        for (const roomId of ['__proto__', 'constructor', 'toString']) {
            const refused = waitFor(guest, 'action-rejected');
            guest.emit('join-room', { username: name, roomId });
            assert.equal((await refused)[0], 'This room does not exist.');
        }
        guest.close();
        assert.ok(await healthy(), 'still running');
    });

    test('names: built-in property names, commas and the like are refused', async () => {
        for (const username of ['__proto__', 'constructor', 'a,b', '[deleted]', 'x'.repeat(21)]) {
            assert.equal((await post('/api/auth/add-guest', { username })).status, 400, username);
        }
        const res = await post('/api/auth/signup', { username: `ok_${stamp}`, email: 'not-an-email', password: 'long-enough-1' });
        assert.equal(res.status, 400);
        assert.match((await res.json()).message, /email/);
        const short = await post('/api/auth/signup', { username: `ok_${stamp}`, email: `ok_${stamp}@example.test`, password: 'short' });
        assert.equal(short.status, 400);
    });

    test('chat: only text, at most 256 characters, the last 50 messages kept', async () => {
        const owner = await connectSecure(userToken);
        const created = waitFor(owner, 'rooms-listed');
        owner.emit('create-room', { name: `chat_${stamp}`, owner: user.username, slots: 2, visibility: 'public' });
        const [rooms] = await created;
        const roomId = Number(Object.keys(rooms).find(key => rooms[key].name === `chat_${stamp}`));

        for (const message of [{ evil: true }, ['a'], '   ', 'x'.repeat(257)]) {
            const refused = waitFor(owner, 'action-rejected');
            owner.emit('send-message', { roomId, username: user.username, message });
            assert.match((await refused)[0], /1 to 256 characters/);
        }
        let last;
        owner.on('message-sent', messages => (last = messages));
        for (let i = 1; i <= 55; i++) owner.emit('send-message', { roomId, username: user.username, message: `m${i}` });
        await waitFor2(() => last?.at(-1)?.message === 'm55');
        assert.equal(last.length, 50);
        assert.equal(last[0].message, 'm6');
        assert.equal(last.at(-1).id, 55, 'ids keep counting');

        const deleted = waitFor(owner, 'room-deleted');
        owner.emit('delete-room', roomId);
        await deleted;
        owner.close();
    });

    test('a flood of events from one connection is dropped, then disconnected', async () => {
        const flooder = await connectSecure();
        const slowDown = waitFor(flooder, 'action-rejected');
        const gone = waitFor(flooder, 'disconnect', 5000);
        for (let i = 0; i < 3000; i++) flooder.emit('list-rooms');
        assert.equal((await slowDown)[0], 'Slow down a little.');
        await gone;
        assert.ok(await healthy());
    });

    test('logging in: 10 tries per account per 15 minutes', async () => {
        const statuses = [];
        for (let i = 0; i < 11; i++) statuses.push((await post('/api/auth/login', { username: `Nobody_${stamp}`, password: 'x' })).status);
        assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
        assert.equal(statuses[10], 429);
        // Another spelling of the same name counts too; another account doesn't.
        assert.equal((await post('/api/auth/login', { username: ` nobody_${stamp}`, password: 'x' })).status, 429);
        assert.equal((await post('/api/auth/login', { username: `other_${stamp}`, password: 'x' })).status, 401);
    });

    test('no internal details: headers, too large and broken bodies', async () => {
        const res = await fetch(`${secure.baseUrl}/api/health`);
        assert.equal(res.headers.get('x-powered-by'), null);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
        const big = await post('/api/auth/login', { username: 'x'.repeat(20000), password: 'x' });
        assert.equal(big.status, 413);
        const broken = await fetch(`${secure.baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
        assert.equal(broken.status, 400);
        assert.deepEqual(await broken.json(), { message: 'Invalid request.' });
    });
});

/** Waits until `check()` is true (polls every 20 ms, at most `ms`). */
async function waitFor2(check, ms = 5000) {
    const end = Date.now() + ms;
    while (!check()) {
        if (Date.now() > end) throw new Error('Timed out');
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}

describe('forgot password', () => {
    // Its own server: mails go to a file (MAIL_OUTBOX), links point at PUBLIC_URL.
    const outbox = path.join(os.tmpdir(), `dutch-pub-outbox-${stamp}.jsonl`);
    const resetUser = { username: `e2e_reset_${stamp}`, email: `e2e_reset_${stamp}@example.test`, password: 'old-password-1' };
    const germanUser = { username: `e2e_resetde_${stamp}`, email: `e2e_resetde_${stamp}@example.test`, password: 'old-password-2' };
    let resetServer;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const mails = () => (fs.existsSync(outbox) ? fs.readFileSync(outbox, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : []);
    const waitForMail = async () => {
        for (let i = 0; i < 100 && mails().length === 0; i++) await sleep(20);
        return mails().at(-1);
    };
    const submit = (fields) =>
        fetch(`${resetServer.baseUrl}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(fields).toString(),
        });

    before(async () => {
        resetServer = await startServer({ MAIL_OUTBOX: outbox, PUBLIC_URL: 'https://dutchpub.example/', SMTP_HOST: '' });
        await post(`${resetServer.baseUrl}/api/auth/signup`, resetUser);
        await post(`${resetServer.baseUrl}/api/auth/signup`, germanUser);
    });

    after(async () => {
        await resetServer?.stop();
        fs.rmSync(outbox, { force: true });
        const created = await db.user.findOne({ where: { username: resetUser.username }, attributes: ['id'], raw: true });
        if (created) {
            await db.refresh_token.destroy({ where: { user_id: created.id } });
            await db.password_reset.destroy({ where: { user_id: created.id } });
        }
        await db.user.destroy({ where: { username: resetUser.username } });
        const german = await db.user.findOne({ where: { username: germanUser.username }, attributes: ['id'], raw: true });
        if (german) await db.password_reset.destroy({ where: { user_id: german.id } });
        await db.user.destroy({ where: { username: germanUser.username } });
    });

    test('not set up: the server says so', async () => {
        const plain = await startServer({ MAIL_OUTBOX: '', PUBLIC_URL: '', SMTP_HOST: '' });
        try {
            assert.equal((await post(`${plain.baseUrl}/api/auth/forgot-password`, { email: resetUser.email })).status, 503);
        } finally {
            await plain.stop();
        }
    });

    test('the same answer for unknown emails, and no mail', async () => {
        const unknown = await post(`${resetServer.baseUrl}/api/auth/forgot-password`, { email: `nobody_${stamp}@example.test` });
        const known = await post(`${resetServer.baseUrl}/api/auth/forgot-password`, { email: resetUser.email });
        assert.equal(unknown.status, 200);
        assert.equal(known.status, 200);
        assert.deepEqual(await unknown.json(), await known.json());
        const mail = await waitForMail();
        assert.equal(mails().length, 1, 'only the known email got a mail');
        assert.equal(mail.to, resetUser.email);
        assert.match(mail.text, new RegExp(`Hi ${resetUser.username}`));
        assert.equal((await post(`${resetServer.baseUrl}/api/auth/forgot-password`, { email: 'nope' })).status, 400);
    });

    test('the link sets a new password once; every phone is logged out', async () => {
        const login = await (await post(`${resetServer.baseUrl}/api/auth/login`, resetUser)).json();
        const link = mails().at(-1).text.match(/https:\/\/dutchpub\.example\/reset-password\?token=\S+/)[0];
        const token = new URL(link).searchParams.get('token');

        assert.equal((await fetch(`${resetServer.baseUrl}/reset-password?token=wrong`)).status, 400);
        const form = await fetch(`${resetServer.baseUrl}/reset-password?token=${encodeURIComponent(token)}`);
        assert.equal(form.status, 200);
        assert.match(await form.text(), /<form method="post" action="\/reset-password">/);

        assert.equal((await submit({ token, password: 'short', confirm: 'short' })).status, 400);
        assert.equal((await submit({ token, password: 'new-password-1', confirm: 'other-password-1' })).status, 400);
        const done = await submit({ token, password: 'new-password-1', confirm: 'new-password-1' });
        assert.equal(done.status, 200);
        assert.match(await done.text(), /has been changed/);

        assert.equal((await submit({ token, password: 'third-password-1', confirm: 'third-password-1' })).status, 400, 'used once');
        assert.equal((await post(`${resetServer.baseUrl}/api/auth/login`, resetUser)).status, 401, 'the old password is gone');
        assert.equal((await post(`${resetServer.baseUrl}/api/auth/login`, { ...resetUser, password: 'new-password-1' })).status, 200);
        assert.equal((await post(`${resetServer.baseUrl}/api/auth/refresh`, { refreshToken: login.refreshToken })).status, 401, 'logged out');
    });

    test("the email and the page come in the app's language", async () => {
        const before = mails().length;
        assert.equal((await post(`${resetServer.baseUrl}/api/auth/forgot-password`, { email: germanUser.email, language: 'de' })).status, 200);
        for (let i = 0; i < 100 && mails().length === before; i++) await sleep(20);
        const mail = mails().at(-1);
        assert.equal(mail.to, germanUser.email);
        assert.equal(mail.subject, 'Neues Passwort für Dutch Pub festlegen');
        assert.match(mail.text, new RegExp(`Hallo ${germanUser.username},`));
        const link = mail.text.match(/https:\/\/dutchpub\.example\/reset-password\?\S+/)[0];
        assert.equal(new URL(link).searchParams.get('lang'), 'de');

        const form = await (await fetch(`${resetServer.baseUrl}${new URL(link).pathname}${new URL(link).search}`)).text();
        assert.match(form, /Neues Passwort speichern/);
        assert.match(form, /name="lang" value="de"/);
        const token = new URL(link).searchParams.get('token');
        const refused = await submit({ token, password: 'kurz', confirm: 'kurz', lang: 'de' });
        assert.match(await refused.text(), /mindestens 8 Zeichen/);
    });

    test('at most 3 mails per email per hour', async () => {
        const statuses = [];
        for (let i = 0; i < 3; i++) statuses.push((await post(`${resetServer.baseUrl}/api/auth/forgot-password`, { email: resetUser.email.toUpperCase() })).status);
        assert.deepEqual(statuses, [200, 200, 429], 'one was sent before');
    });
});

describe('minimum app version (MIN_APP_VERSION)', () => {
    let versionServer;
    before(async () => {
        versionServer = await startServer({ MIN_APP_VERSION: '2.0.0' });
    });
    after(async () => {
        await versionServer?.stop();
    });

    const login = version =>
        fetch(`${versionServer.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(version && { 'X-App-Version': version }) },
            body: JSON.stringify({ username: 'nobody_here', password: 'x' }),
        });
    const connect = auth =>
        new Promise(resolve => {
            const socket = io(versionServer.baseUrl, { transports: ['websocket'], reconnection: false, auth });
            socket.on('connect', () => {
                socket.close();
                resolve('connected');
            });
            socket.on('connect_error', error => {
                socket.close();
                resolve(error.message);
            });
        });

    test('older or missing versions get 426 (REST) and "update required" (socket); the health check stays open', async () => {
        const old = await login('1.9.9');
        assert.equal(old.status, 426);
        assert.deepEqual(await old.json(), { message: 'Please update the app to keep playing.', code: 'UPDATE_REQUIRED', minVersion: '2.0.0' });
        assert.equal((await login(undefined)).status, 426);
        assert.equal(await connect({ appVersion: '1.0.0' }), 'update required');
        assert.equal(await connect({}), 'update required');
        assert.equal((await fetch(`${versionServer.baseUrl}/api/health`)).status, 200);
    });

    test('the minimum version and newer pass', async () => {
        assert.notEqual((await login('2.0.0')).status, 426);
        assert.notEqual((await login('2.1.0')).status, 426);
        assert.equal(await connect({ appVersion: '2.0.0' }), 'connected');
    });
});

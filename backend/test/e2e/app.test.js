// End-to-end tests: run the real server against the database configured in backend/.env.
// Creates one `e2e_*` user with a `user_profiles` row (their avatar) and, by playing a game to
// the end, one `played_games` row, and deletes them again afterwards.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { canLayCard } from '@dutch-pub/shared';
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
        assert.deepEqual(await health.json(), { status: 'ok' });
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
        assert.deepEqual(rooms[roomId].settings, { showCardPowers: false, cardBack: 'red', turnTimer: 30 }, 'settings are validated');
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
        assert.deepEqual(rooms[roomId].settings, { showCardPowers: true, cardBack: 'blue', turnTimer: 30 });
    });

    test('an unknown card back colour keeps the current one', async () => {
        const broadcast = waitFor(b, 'rooms-listed');
        a.emit('update-room-settings', { roomId, settings: { cardBack: 'green' } });
        const [rooms] = await broadcast;
        assert.deepEqual(rooms[roomId].settings, { showCardPowers: true, cardBack: 'blue', turnTimer: 30 });
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
            assert.deepEqual(rooms[roomId].settings, { showCardPowers: true, cardBack: 'blue', turnTimer: 30 }, 'settings unchanged');
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


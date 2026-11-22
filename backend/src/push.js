// "Your turn" push notifications, through Expo's push service (which passes them on to Firebase
// Cloud Messaging / Apple's push service). A player gets one when their turn starts while the
// app is away: in the background (the app says so with `app-state`) or not connected at all.

import { guestsList } from './controllers/auth.controller.js';
import { games, roomsList } from './rooms.js';
import db from './models/index.js';
import { languageOf, text } from './texts.js';

const PushToken = db.push_token;
const User = db.user;

/** Where notifications are sent (env for tests, which point it at a fake server). */
const PUSH_URL = process.env.PUSH_URL ?? 'https://exp.host/--/api/v2/push/send';
/**
 * A turn's notification waits this long, then goes out only if it is still that player's turn
 * and they are still away: no notification for a turn that a burn or a quick reconnect undid.
 */
const PUSH_DELAY_MS = Number(process.env.PUSH_DELAY_MS ?? 2000);
/** Android notification channel the app creates (`turn`). */
const CHANNEL_ID = 'turn';

/** Guests' push tokens (guest id → tokens), in memory only. */
const guestTokens = new Map();
/** The app language of guests' phones (token → language), in memory only. */
const guestTokenLanguages = new Map();
/** Push tokens kept per player (a few phones); older ones are dropped. */
const MAX_TOKENS_PER_PLAYER = 5;
/** Who was on turn when each game last started a turn (no new notification for the same player again, e.g. after a burn). */
const lastOnTurn = new WeakMap();

/** Whether `token` looks like an Expo push token (`ExponentPushToken[...]`). */
export const isExpoPushToken = token => typeof token === 'string' && token.length <= 255 && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);

/**
 * Stores push token `token` for `auth` (the decoded access token), with the app's language on
 * that phone (its notifications come in it): a phone belongs to one user at a time.
 */
export const registerPushToken = async (auth, token, language) => {
    await forgetPushToken(token);
    if (auth.guest) {
        guestTokens.set(auth.id, new Set([...(guestTokens.get(auth.id) ?? []), token].slice(-MAX_TOKENS_PER_PLAYER)));
        guestTokenLanguages.set(token, languageOf(language));
    } else {
        await PushToken.upsert({ token, user_id: auth.id, language: languageOf(language) });
        const older = await PushToken.findAll({
            where: { user_id: auth.id },
            order: [['updatedAt', 'DESC']],
            offset: MAX_TOKENS_PER_PLAYER,
            attributes: ['token'],
        });
        if (older.length) await PushToken.destroy({ where: { token: older.map(row => row.token) } });
    }
};

/** Forgets push token `token` (logging out, notifications turned off, or the phone dropped the app). */
export const forgetPushToken = async token => {
    guestTokens.forEach(tokens => tokens.delete(token));
    guestTokenLanguages.delete(token);
    await PushToken.destroy({ where: { token } });
};

/** Forgets all push tokens of registered user `userId` (account deleted). */
export const forgetUserPushTokens = userId => PushToken.destroy({ where: { user_id: userId } });

/** The push tokens of player `username` (a registered user or a guest), as `{ token, language }`. */
export const pushTokensOf = async username => {
    const guest = guestsList.find(other => other.username === username);
    if (guest) return [...(guestTokens.get(guest.id) ?? [])].map(token => ({ token, language: guestTokenLanguages.get(token) ?? 'en' }));
    const user = await User.findOne({ where: { username }, attributes: ['id'] });
    if (!user) return [];
    const rows = await PushToken.findAll({ where: { user_id: user.id }, attributes: ['token', 'language'] });
    return rows.map(row => ({ token: row.token, language: languageOf(row.language) }));
};

/** Whether `username` has no socket that is connected with the app in the foreground. */
export const isAway = (io, username) =>
    ![...io.of('/').sockets.values()].some(socket => socket.connected && socket.data.user?.username === username && !socket.data.background);

/** The notification (in `language`) for `username`, whose turn it is in `game` of room `room`. */
export const turnMessage = (room, game, username, language = 'en') => {
    const call = game.call?.target === username ? game.call : null;
    return {
        title: call ? text(language, 'pushCalledYou', { name: call.by }) : text(language, 'pushYourTurn'),
        body: text(language, call ? 'pushLayMagic' : 'pushLayCard', { room: room.name }),
    };
};

/**
 * Sends `message` (`{ title, body }`) to `tokens`. Tokens the push service says are gone
 * (the app was uninstalled, or notifications were turned off) are forgotten. Never throws.
 */
export const sendPush = async (tokens, message, data = {}) => {
    if (tokens.length === 0) return;
    try {
        const res = await fetch(PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                // Only needed when "enhanced push security" is on for the Expo project.
                ...(process.env.EXPO_ACCESS_TOKEN && { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }),
            },
            body: JSON.stringify(tokens.map(to => ({ to, ...message, data, sound: 'default', priority: 'high', channelId: CHANNEL_ID }))),
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
            console.log('PUSH FAILED', res.status, await res.text().catch(() => ''));
            return;
        }
        const tickets = (await res.json())?.data ?? [];
        await Promise.all(
            tickets.map((ticket, i) => (ticket?.details?.error === 'DeviceNotRegistered' ? forgetPushToken(tokens[i]) : null)),
        );
    } catch (error) {
        console.log('PUSH FAILED', error.message);
    }
};

const onTurn = game => Object.entries(game.players).find(([, player]) => player.active)?.[0];

/**
 * A turn starts in game `game` of room `roomId` (called by `startTurnClock`). If it is a new
 * player's turn and they are away, they get a notification a moment later
 * (`PUSH_DELAY_MS`), if it is still their turn then and they are still away.
 */
export const notifyTurn = (io, roomId, game) => {
    // Unit tests run the game with a fake socket.io server.
    if (typeof io?.of !== 'function') return;
    const username = onTurn(game);
    if (!username || game.phase === 'swap' || game.blindMiss || lastOnTurn.get(game) === username) return;
    lastOnTurn.set(game, username);
    setTimeout(async () => {
        const room = roomsList[roomId];
        if (!room || games[roomId] !== game || onTurn(game) !== username || game.blindMiss || !isAway(io, username)) return;
        try {
            // One request per language (each phone gets the notification in its app's language).
            const byLanguage = new Map();
            for (const { token, language } of await pushTokensOf(username)) byLanguage.set(language, [...(byLanguage.get(language) ?? []), token]);
            await Promise.all(
                [...byLanguage].map(([language, tokens]) => sendPush(tokens, turnMessage(room, game, username, language), { roomId: Number(roomId) })),
            );
        } catch (error) {
            console.log('PUSH FAILED', error.message);
        }
    }, PUSH_DELAY_MS).unref?.();
};

/** Sockets tell the server when the app goes to the background and comes back (`app-state`). */
export const push = io => {
    io.on('connection', socket => {
        socket.data.background = false;
        socket.on('app-state', state => {
            socket.data.background = state === 'background';
        });
    });
};

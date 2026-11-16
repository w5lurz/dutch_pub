import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

import { secret } from './config/auth.config.js';
import { guestsList, isUsernameAvailable, modifyGuestsList } from './controllers/auth.controller.js';
import db from './models/index.js';

const User = db.user;

/** Must match the cookie-session options in app.js. */
const SESSION_COOKIE = 'app-session';

// `cookies` only needs a response to clear invalid signatures; a no-op one is enough here.
const noopResponse = { getHeader: () => [], setHeader: () => {} };

/** Reads the JWT from the signed cookie-session cookie (web clients). */
const tokenFromSessionCookie = request => {
    if (!request.headers.cookie) return undefined;
    try {
        const cookies = new Cookies(request, noopResponse, { keys: [process.env.COOKIE_SECRET] });
        const value = cookies.get(SESSION_COOKIE, { signed: true });
        return value ? JSON.parse(Buffer.from(value, 'base64').toString('utf8')).token : undefined;
    } catch {
        return undefined;
    }
};

const verify = token => {
    try {
        return jwt.verify(token, secret);
    } catch {
        return null;
    }
};

/**
 * Socket.io middleware that sets `socket.data.user = { id, username, isGuest }` from:
 *  - `handshake.auth.token` (mobile; an invalid token rejects the connection with
 *    "unauthorized" so the client can drop it), or
 *  - the session cookie (web; an invalid or expired cookie just means anonymous).
 * Sockets without a valid token connect anonymously and may only read (e.g. list rooms).
 */
export const socketAuth = io => {
    io.use(async (socket, next) => {
        const explicitToken = socket.handshake.auth?.token;
        const token = explicitToken ?? tokenFromSessionCookie(socket.request);
        if (!token) return next();

        const decoded = verify(token);
        if (!decoded) {
            return explicitToken ? next(new Error('unauthorized')) : next();
        }

        try {
            if (decoded.guest) {
                if (!(await isUsernameAvailable(decoded.username, decoded.id))) {
                    return next(new Error('username taken'));
                }
                // (Re-)bind the guest to this socket, e.g. after a reconnect or server restart.
                const others = guestsList.filter(guest => guest.id !== decoded.id);
                modifyGuestsList([...others, { id: decoded.id, username: decoded.username, socketId: socket.id, isGuest: true }]);
                socket.data.user = { id: decoded.id, username: decoded.username, isGuest: true };
            } else {
                const user = await User.findByPk(decoded.id, { attributes: ['id', 'username'] });
                if (!user) {
                    return explicitToken ? next(new Error('unauthorized')) : next();
                }
                socket.data.user = { id: user.id, username: user.username, isGuest: false };
            }
            next();
        } catch (error) {
            next(error);
        }
    });
};

/**
 * Returns an error message when `socket` may not act as `username` (or at all when
 * `username` is omitted), otherwise null.
 */
export const identityError = (socket, username) => {
    const user = socket.data.user;
    if (!user) {
        return 'You need to log in or join as a guest first.';
    }
    if (username !== undefined && username !== user.username) {
        return 'You can only act as yourself.';
    }
    return null;
};

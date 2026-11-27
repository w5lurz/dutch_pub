import { guestsList, isGuestLoggedOut, isUsernameAvailable, modifyGuestsList } from './controllers/auth.controller.js';
import { getAvatarSafe } from './avatars.js';
import { verifyAccessToken } from './middleware/authJwt.js';
import db from './models/index.js';

const User = db.user;

/**
 * Socket.io middleware that sets `socket.data.user = { id, username, isGuest, avatar }` from the
 * JWT in `handshake.auth.token` (sent by the mobile app). An invalid or expired token
 * rejects the connection with "unauthorized" so the client can drop it. Sockets without a
 * token connect anonymously and may only read (e.g. list rooms).
 */
export const socketAuth = io => {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next();

        const decoded = verifyAccessToken(token);
        if (!decoded) return next(new Error('unauthorized'));

        try {
            if (decoded.guest) {
                // Logged out: the old token must not take the name back.
                if (isGuestLoggedOut(decoded.id)) return next(new Error('unauthorized'));
                if (!(await isUsernameAvailable(decoded.username, decoded.id))) {
                    return next(new Error('username taken'));
                }
                // (Re-)bind the guest to this socket, e.g. after a reconnect or a server restart.
                // The name stays reserved until the token expires (see auth.controller.js).
                const others = guestsList.filter(guest => guest.id !== decoded.id);
                modifyGuestsList([
                    ...others,
                    { id: decoded.id, username: decoded.username, socketId: socket.id, isGuest: true, expiresAt: decoded.exp * 1000 },
                ]);
                socket.data.user = { id: decoded.id, username: decoded.username, isGuest: true, avatar: null };
            } else {
                const user = await User.findByPk(decoded.id, { attributes: ['id', 'username'] });
                if (!user) return next(new Error('unauthorized'));
                // The chosen avatar goes into the room player lists (kept current by applyAvatarChange).
                socket.data.user = { id: user.id, username: user.username, isGuest: false, avatar: await getAvatarSafe(user.id) };
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

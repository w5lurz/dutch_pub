import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { secret } from '../config/auth.config.js';

/** Access tokens (REST `Authorization: Bearer`, socket handshake) live 2 hours; the app refreshes them. */
export const TOKEN_TTL_SECONDS = 7200;
/** A registered user's refresh token: 30 days, renewed with every refresh (so active users stay logged in). */
export const REFRESH_TTL_SECONDS = Number(process.env.REFRESH_TTL_SECONDS ?? 30 * 24 * 3600);
/** A guest's refresh token: 7 days (guests have no account; their name is free again when it runs out). */
export const GUEST_REFRESH_TTL_SECONDS = 7 * 24 * 3600;

export const signUserToken = user => jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: TOKEN_TTL_SECONDS });

export const signGuestToken = guest =>
    jwt.sign({ id: guest.id, username: guest.username, guest: true }, secret, { expiresIn: TOKEN_TTL_SECONDS });

/**
 * A guest's refresh token: signed, not stored (guests live only in server memory, and this
 * way it survives a server restart). Marked `typ: 'refresh'`, so it is never accepted as an
 * access token (`verifyAccessToken`).
 */
export const signGuestRefreshToken = guest =>
    jwt.sign({ id: guest.id, username: guest.username, guest: true, typ: 'refresh' }, secret, { expiresIn: GUEST_REFRESH_TTL_SECONDS });

/** A new random refresh token for a registered user (stored only as its hash, `hashToken`). */
export const newRefreshToken = () => crypto.randomBytes(32).toString('base64url');

/** The SHA-256 hex hash a refresh token is stored as. */
export const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

/** The decoded payload of a valid access token, or null (invalid, expired, or a refresh token). */
export const verifyAccessToken = token => {
    try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        return decoded.typ === 'refresh' ? null : decoded;
    } catch {
        return null;
    }
};

/** The decoded payload of a valid guest refresh token, or null. */
export const verifyGuestRefreshToken = token => {
    try {
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        return decoded.typ === 'refresh' && decoded.guest ? decoded : null;
    } catch {
        return null;
    }
};

const bearerToken = header => (typeof header === 'string' && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined);

/** Requires `Authorization: Bearer <token>`. Sets `req.userId` and `req.auth` (the decoded token). */
export const verifyToken = (req, res, next) => {
    const token = bearerToken(req.headers.authorization);

    if (!token) {
        return res.status(403).send({
            message: 'No token provided!',
        });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).send({
            message: 'Unauthorized!',
        });
    }
    req.userId = decoded.id;
    req.auth = decoded;
    next();
};

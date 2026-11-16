import jwt from 'jsonwebtoken';
import { secret } from '../config/auth.config.js';

export const TOKEN_TTL_SECONDS = 7200; // 2 hours

export const signUserToken = user => jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: TOKEN_TTL_SECONDS });

export const signGuestToken = guest =>
    jwt.sign({ id: guest.id, username: guest.username, guest: true }, secret, { expiresIn: TOKEN_TTL_SECONDS });

const bearerToken = header => (typeof header === 'string' && header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined);

/**
 * Accepts `Authorization: Bearer <token>` (mobile) or the token stored in the session
 * cookie (web). Sets `req.userId` and `req.auth` (the decoded token).
 */
export const verifyToken = (req, res, next) => {
    const token = bearerToken(req.headers.authorization) ?? req.session?.token;

    if (!token) {
        return res.status(403).send({
            message: 'No token provided!',
        });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: 'Unauthorized!',
            });
        }
        req.userId = decoded.id;
        req.auth = decoded;
        next();
    });
};

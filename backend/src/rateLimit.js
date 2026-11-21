// Small in-memory rate limits (the server runs as a single instance, so memory is enough).
//
// Behind a proxy (ngrok, a host's load balancer) every request comes from the proxy's address:
// set TRUST_PROXY (see app.js) so `req.ip` is the phone's address again. Without it the
// per-address limits count everyone together, which still stops floods but may slow everyone
// down during one; the per-account limits (login, account deletion) work either way.

/**
 * A fixed-window counter: `hit(key)` counts one attempt for `key` and returns whether it is
 * still within `max` per `windowMs`.
 */
export const limiter = ({ windowMs, max }) => {
    const hits = new Map();
    // Forget finished windows now and then, so the map doesn't grow with every address seen.
    setInterval(() => {
        const now = Date.now();
        hits.forEach((entry, key) => entry.resetAt <= now && hits.delete(key));
    }, windowMs).unref();
    return key => {
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count += 1;
        return entry.count <= max;
    };
};

export const TOO_MANY = 'Too many attempts. Please wait a few minutes and try again.';

/** Express middleware: 429 `{ message }` once `keyOf(req)` went over `max` per `windowMs`. */
export const rateLimit = ({ windowMs, max, keyOf = req => req.ip, message = TOO_MANY }) => {
    const hit = limiter({ windowMs, max });
    return (req, res, next) => (hit(String(keyOf(req))) ? next() : res.status(429).send({ message }));
};

/** The username a request is about, for per-account limits (case and spaces don't make a new key). */
export const usernameKey = req => (typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '');

const MINUTE = 60 * 1000;

/** The limits of the auth routes (per address unless noted). */
export const authLimits = {
    // Guessing one account's password: 10 tries per 15 minutes, from anywhere.
    loginPerAccount: rateLimit({ windowMs: 15 * MINUTE, max: 10, keyOf: req => `login:${usernameKey(req)}` }),
    loginPerAddress: rateLimit({ windowMs: 15 * MINUTE, max: 100 }),
    signup: rateLimit({ windowMs: 60 * MINUTE, max: 20 }),
    guest: rateLimit({ windowMs: 10 * MINUTE, max: 60 }),
    refresh: rateLimit({ windowMs: 15 * MINUTE, max: 300 }),
    // Deleting an account asks for its password: limited like logging in.
    deletePerAccount: rateLimit({ windowMs: 15 * MINUTE, max: 10, keyOf: req => `delete:${req.userId ?? usernameKey(req)}` }),
};

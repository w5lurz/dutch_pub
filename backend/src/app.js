import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import db from './models/index.js';
import { serverError } from './utils/utils.js';
import usersRouters from './routes/user.routes.js';
import authRouters from './routes/auth.routes.js';
import playedGamesRoutes from './routes/played_game.routes.js';
import { rooms } from './rooms.js';
import { game } from './game.js';
import { chat } from './chat.js';
import { socketAuth } from './socketAuth.js';
import { startPersistence } from './persistence.js';
import { push } from './push.js';
import { pages } from './pages.js';
import { passwordReset } from './passwordReset.js';
import { guardHandlers, limitEvents } from './socketSafety.js';

const { json } = bodyParser;

const app = express();
app.disable('x-powered-by');
// Behind a proxy (ngrok, a host's load balancer) set TRUST_PROXY (e.g. 1 = one proxy in front), so
// the rate limits see the phone's address instead of the proxy's. Don't set it without a proxy:
// then anyone could pretend to be another address with an X-Forwarded-For header.
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

const port = process.env.PORT || 3030;
const server = http.Server(app);

// Creates missing tables (refresh_tokens, game_snapshots, ...); awaited below before listening.
const synced = db.sequelize.sync();

// The only client is the mobile app. Native apps send no Origin header, so CORS doesn't
// apply to them; CORS_ORIGIN (comma-separated) is only needed to run the Expo app in a
// browser (`npm run web`, e.g. http://localhost:8081).
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : false;

app.use(cors({ origin: corsOrigin }));

// The app's requests are small; bigger bodies are refused before they are parsed.
app.use(json({ limit: '16kb' }));

// The two HTML pages (privacy policy, account deletion) load nothing from elsewhere and may not be
// framed; the JSON API isn't a page at all.
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    });
    next();
});

app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok' });
});

app.use('/api/auth', authRouters);

app.use('/api/users', usersRouters);

app.use('/api/games', playedGamesRoutes);

// The privacy policy and the account deletion page (linked from the app and the store listings).
app.use(pages());
// "Forgot password?": the app's request and the page the email links to.
app.use(passwordReset());

// Errors nobody caught: no details to the client (they may name tables or columns).
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).send({ message: 'Request too large.' });
    if (err.type === 'entity.parse.failed') return res.status(400).send({ message: 'Invalid request.' });
    serverError(res, err, `${req.method} ${req.path}`);
});

const io = new Server(server, {
    cors: { origin: corsOrigin },
    // The app's events are small (a chat message is at most 256 characters).
    maxHttpBufferSize: 16 * 1024,
    connectionStateRecovery: {
        // The backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // Whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    },
});

// Must run before the connection handlers: sets socket.data.user from the handshake token.
socketAuth(io);
// First: errors in any handler below only answer that client, floods are dropped.
guardHandlers(io);
limitEvents(io);
rooms(io);
game(io);
chat(io);
push(io);
// Account deletion disconnects the deleted user's sockets.
app.set('io', io);

// Rooms and games from before a restart are back in memory before anyone can connect.
await synced;
await startPersistence(io);
server.listen(port, () => {
    console.log(`Backend started - Listening on port ${port}`);
});

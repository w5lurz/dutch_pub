import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import db from './models/index.js';
import usersRouters from './routes/user.routes.js';
import authRouters from './routes/auth.routes.js';
import playedGamesRoutes from './routes/played_game.routes.js';
import { rooms } from './rooms.js';
import { game } from './game.js';
import { chat } from './chat.js';
import { socketAuth } from './socketAuth.js';
import { startPersistence } from './persistence.js';

console.log('SAS3', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
// dotenv.config({ path: '.env' });
console.log('SAS4', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

// to refresh and purify db data {force: true}

const { json } = bodyParser;

const app = express();

const port = process.env.PORT || 3030;
const server = http.Server(app);

// Creates missing tables (refresh_tokens, game_snapshots, ...); awaited below before listening.
const synced = db.sequelize.sync();

// The only client is the mobile app. Native apps send no Origin header, so CORS doesn't
// apply to them; CORS_ORIGIN (comma-separated) is only needed to run the Expo app in a
// browser (`npm run web`, e.g. http://localhost:8081).
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : false;

app.use(cors({ origin: corsOrigin }));

app.use(json());

app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok' });
});

app.use('/api/auth', authRouters);

app.use('/api/users', usersRouters);

app.use('/api/games', playedGamesRoutes);

// Error-handling middleware below
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});


console.log('SAS', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

const io = new Server(server, {
    cors: { origin: corsOrigin },
    connectionStateRecovery: {
        // The backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // Whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    },
});

// Must run before the connection handlers: sets socket.data.user from the handshake token.
socketAuth(io);
rooms(io);
game(io);
chat(io);

// Rooms and games from before a restart are back in memory before anyone can connect.
await synced;
await startPersistence(io);
server.listen(port, () => {
    console.log(`Backend started - Listening on port ${port}`);
});

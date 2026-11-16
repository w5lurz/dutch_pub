import express from 'express';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
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
import { guests } from './guests.js';

console.log('SAS3', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
// dotenv.config({ path: '.env' });
console.log('SAS4', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

// to refresh and purify db data {force: true}

const { json } = bodyParser;

const app = express();

const port = process.env.PORT || 3030;
const server = http.Server(app);

db.sequelize.sync();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(json());

if (!process.env.COOKIE_SECRET) {
    throw new Error('COOKIE_SECRET environment variable is not set');
}

const cookieSessionMiddleWare = cookieSession({
    name: 'app-session',
    secret: process.env.COOKIE_SECRET,
    httpOnly: true,
});

app.use(cookieSessionMiddleWare);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use('/api/auth', authRouters);

app.use('/api/users', usersRouters);

app.use('/api/games', playedGamesRoutes);

// Error-handling middleware below
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

server.listen(port, () => {
    console.log(`Backend started - Listening on port ${port}`);
});

console.log('SAS', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

const io = new Server(server, {
    cors: {
        origin: process.env.BASE_URL,
        credentials: true,
    },
    connectionStateRecovery: {
        // The backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // Whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    },
});

// TODO IS this needed?
// convert a connect middleware to a Socket.IO middleware
// const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

// io.use(wrap(cookieSessionMiddleWare));

/* io.on('connection', socket => {
    console.log('a user connected', socket.id);
    socket.on('test', () => console.log('TETETESTTS'));
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
}); */

rooms(io);
game(io);
chat(io);
guests(io);

// if (process.env.NODE_ENV === 'production') {
// const root = require('path').join(__dirname, 'client', 'build');

const root = process.env.FRONTEND_ROOT;
app.use(express.static(root));
// Express 5 (path-to-regexp v8): '{*splat}' matches every path including '/'
app.get('/{*splat}', (req, res) => {
    res.sendFile('index.html', { root });
});

// }

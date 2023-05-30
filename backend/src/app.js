import express from 'express';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import db from './models';
import usersRouters from './routes/user.routes';
import authRouters from './routes/auth.routes';
import playedGamesRoutes from './routes/played_game.routes';
import { rooms } from './rooms';
import { game } from './game';
import { chat } from './chat';
import { guests } from './guests';

// to refresh and purify db data {force: true}

const { json } = bodyParser;

const app = express();

const port = 3030;
const server = http.Server(app);

db.sequelize.sync();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(json());

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
    console.log('Backend started - Listening on port 3030');
});

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

rooms(io);
game(io);
chat(io);
guests(io);

const root = process.env.FRONTEND_ROOT;
app.use(express.static(root));
app.get('*', (req, res) => {
    res.sendFile('index.html', { root });
});

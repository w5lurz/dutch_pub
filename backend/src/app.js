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

const { json } = bodyParser;

const app = express();

const port = 3030;
const server = http.Server(app);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(json());

const cookieSessionMiddleWare = cookieSession({
    name: 'app-session',
    secret: 'COOKIE_SECRET', // should use as secret environment variable
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
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

db.sequelize.sync(); // {force: true}

server.listen(port, () => {
    console.log('Backend started - Listening on port 3030');
});

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
});

// TODO IS this needed?
// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(cookieSessionMiddleWare));

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

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

console.log('SAS3', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
// dotenv.config({ path: '.env' });
console.log('SAS4', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

const { json } = bodyParser;

const app = express();

const port = 3030;
const server = http.Server(app);

db.sequelize.sync(); // {force: true}

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

// const path = require('path');
// const __dirname = dirname(__filename);

// Error-handling middleware below
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
console.log('SAS', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

server.listen(port, () => {
    console.log('Backend started - Listening on port 3030');
});

const io = new Server(server, {
    cors: {
        origin: process.env.BASE_URL,
        credentials: true,
    },
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
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

/* app.get('/*', (req, res) => {
    res.sendFile('/frontend/public/index.html', { root: 'c:/_Work/SULI2020/szakdolgozat/dutch_pub/' });
}); */

// if (process.env.NODE_ENV === 'production') {
// const root = require('path').join(__dirname, 'client', 'build');
const root = process.env.FRONTEND_ROOT;
app.use(express.static(root));
app.get('*', (req, res) => {
    res.sendFile('index.html', { root });
});
// }

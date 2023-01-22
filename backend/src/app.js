import express from 'express';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import cors from 'cors';

import db from './models';
import usersRouters from './routes/user.routes';
import authRouters from './routes/auth.routes';

const { json } = bodyParser;

const app = express();

app.use(cors());

app.use(json());

app.use(
    cookieSession({
        name: 'app-session',
        secret: 'COOKIE_SECRET', // should use as secret environment variable
        httpOnly: true,
    }),
);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
    next();
});

app.use('/api/auth', authRouters);

app.use('/api/users', usersRouters);

// Error-handling middleware below
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

db.sequelize.sync();

app.listen(3030, () => {
    console.log('Backend started - Listening on port 3030');
});

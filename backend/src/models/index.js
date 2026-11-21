import Sequelize from 'sequelize';

import dbConfig from '../config/db.config.js';
import User from './user.model.js';
import PlayedGame from './played_game.model.js';
import UserProfile from './user_profile.model.js';
import RefreshToken from './refresh_token.model.js';
import GameSnapshot from './game_snapshot.model.js';
import PushToken from './push_token.model.js';
import PasswordReset from './password_reset.model.js';
import { isDevEnv } from '../utils/utils.js';

const { DB, PORT, USER, PASSWORD, HOST, dialect: _dialect, pool: _pool, reconnect } = dbConfig;

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: isDevEnv ? HOST : '/cloudsql/dutch-card:europe-west6:dutch-pub',
    dialect: _dialect,
    port: PORT,
    reconnect,
    // SQL logging would put emails, password hashes and tokens into the logs: only on request.
    logging: process.env.DB_LOG === '1' ? console.log : false,
    ...(!isDevEnv && {
        dialectOptions: {
            socketPath: '/cloudsql/dutch-card:europe-west6:dutch-pub',
        },
    }),
    pool: {
        max: _pool.max,
        min: _pool.min,
        acquire: _pool.acquire,
        idle: _pool.idle,
    },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User(sequelize, Sequelize);
db.played_game = PlayedGame(sequelize, Sequelize);
db.user_profile = UserProfile(sequelize, Sequelize);
db.refresh_token = RefreshToken(sequelize, Sequelize);
db.game_snapshot = GameSnapshot(sequelize, Sequelize);
db.push_token = PushToken(sequelize, Sequelize);
db.password_reset = PasswordReset(sequelize, Sequelize);

export default db;

import Sequelize from 'sequelize';

import dbConfig from '../config/db.config.js';
import User from './user.model';
import PlayedGame from './played_game.model';
import { isDevEnv } from '../utils/utils.js';

const { DB, PORT, USER, PASSWORD, HOST, dialect: _dialect, pool: _pool, reconnect } = dbConfig;

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: isDevEnv ? HOST : '/cloudsql/dutch-card:europe-west6:dutch-pub',
    dialect: _dialect,
    operatorsAliases: false,
    port: PORT,
    reconnect,
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

export default db;

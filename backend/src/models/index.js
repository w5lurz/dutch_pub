import Sequelize from 'sequelize';

import dbConfig from '../config/db.config.js';
import User from './user.model';
import PlayedGame from './played_game.model';

const { DB, PORT, USER, PASSWORD, HOST, dialect: _dialect, pool: _pool, reconnect } = dbConfig;
console.log('SAS2', process.env.DB_HOST, process.env.DB_PORT);
const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: '/cloudsql/dutch-card:europe-west6:dutch-pub',
    dialect: _dialect,
    operatorsAliases: false,
    port: PORT,
    reconnect,
    dialectOptions: {
        socketPath: '/cloudsql/dutch-card:europe-west6:dutch-pub',
    },
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

/* db.role.belongsToMany(db.user, {
    through: 'user_roles',
    foreignKey: 'roleId',
    otherKey: 'userId',
});
db.user.belongsToMany(db.role, {
    through: 'user_roles',
    foreignKey: 'userId',
    otherKey: 'roleId',
});

db.ROLES = ['user', 'admin', 'moderator']; */

export default db;

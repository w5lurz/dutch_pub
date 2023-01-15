import Sequelize from 'sequelize';

import dbConfig from '../config/db.config.js';
import User from './user.model';

const { DB, USER, PASSWORD, HOST, dialect: _dialect, pool: _pool } = dbConfig;

const sequelize = new Sequelize(DB, USER, PASSWORD, {
    host: HOST,
    dialect: _dialect,
    operatorsAliases: false,

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

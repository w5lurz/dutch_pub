// See https://sequelize.org/master/manual/model-basics.html
// for more of what you can do here.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize, Sequelize) {
    const User = sequelize.define('users', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            // New databases only: sync() doesn't change an existing table (see the security notes).
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    return User;
}

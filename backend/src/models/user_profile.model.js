// Per-user settings that are not part of the original `users` table (e.g. the avatar).
// A separate table so `sequelize.sync()` creates it on existing databases: sync() never
// adds columns to a table that already exists.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize, Sequelize) {
    const UserProfile = sequelize.define(
        'user_profiles',
        {
            user_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
            },
            // A preset id from AVATAR_IDS (packages/shared); null = generated from the name.
            avatar: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },
        },
        { timestamps: true },
    );

    return UserProfile;
}

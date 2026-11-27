// "Forgot password" links: one row per link sent, only the SHA-256 hash of its token is stored
// (a leaked table can't be used to reset anyone's password). A link works once, for a limited
// time; asking for a new one replaces the old.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize) {
    const PasswordReset = sequelize.define(
        'password_resets',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            // Hex SHA-256 of the token in the link.
            token_hash: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        { timestamps: true, indexes: [{ fields: ['user_id'] }] },
    );

    return PasswordReset;
}

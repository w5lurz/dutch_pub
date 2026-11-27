// Refresh tokens of registered users (guests get a signed one instead, see authJwt.js). Only a
// SHA-256 hash of each token is stored, so a leaked table can't be used to log in. A token is
// used once: refreshing replaces it with a new one (rotation); logging out deletes it.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize) {
    const RefreshToken = sequelize.define(
        'refresh_tokens',
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
            // Hex SHA-256 of the token.
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

    return RefreshToken;
}

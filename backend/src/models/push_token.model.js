// Expo push tokens of registered users' phones ("your turn" notifications). One row per phone:
// logging in as someone else on the same phone moves the token to them. Guests' tokens are kept
// in memory only (push.js): guest ids start again from 1 after a server restart.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize) {
    const PushToken = sequelize.define(
        'push_tokens',
        {
            token: {
                type: DataTypes.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            // The app's language on that phone ("hu", ...): its notifications come in it.
            // Added after the table: older databases get it from models/upgrade.js.
            language: {
                type: DataTypes.STRING(8),
                allowNull: true,
            },
        },
        { timestamps: true, indexes: [{ fields: ['user_id'] }] },
    );

    return PushToken;
}

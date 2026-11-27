// Snapshots of the rooms (with their running game and chat) kept in server memory, so a server
// restart can pick them up again (see persistence.js). One row per room; rows go away with the
// room (game won, stopped, room deleted). `scope` keeps servers that share a database apart
// (e.g. test servers next to the real one).
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize) {
    const GameSnapshot = sequelize.define(
        'game_snapshots',
        {
            scope: {
                type: DataTypes.STRING(64),
                primaryKey: true,
                allowNull: false,
            },
            room_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
            },
            // JSON: { room, game, messages }.
            state: {
                type: DataTypes.TEXT('long'),
                allowNull: false,
            },
        },
        { timestamps: true },
    );

    return GameSnapshot;
}

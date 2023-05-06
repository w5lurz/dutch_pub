// See https://sequelize.org/master/manual/model-basics.html
// for more of what you can do here.
import { DataTypes as _DataTypes } from 'sequelize';
const DataTypes = _DataTypes;

export default function (sequelize, Sequelize) {
    const PlayedGame = sequelize.define(
        'played_games',
        {
            winner: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            players: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            game_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        { timestamps: false },
    );

    return PlayedGame;
}

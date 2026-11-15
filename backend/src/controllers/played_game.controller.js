import db from '../models/index.js';
const PlayedGame = db.played_game;

export const all = async (req, res) => {
    const playedGames = await PlayedGame.findAll();

    if (!playedGames || playedGames?.length === 0) {
        return res.status(404).send({ message: 'No Played games yet.' });
    }
    return res.status(200).send(playedGames);
};

export const leaderBoard = async (req, res) => {
    const playedGamesRaw = await PlayedGame.findAll({ raw: true });

    if (!playedGamesRaw) {
        return res.status(404).send({ message: 'No Played games yet.' });
    }

    // Calc all players
    let allPlayers = [];
    const playedGames = playedGamesRaw;
    const newPlayedGames = playedGames.map(game => ({ ...game, players: game.players.split(',') }));
    newPlayedGames.forEach(game => {
        if (!allPlayers.includes(game.winner)) {
            allPlayers = [...allPlayers, game.winner];
        }
    });

    let leaderBoard = [];
    allPlayers.forEach(player => {
        let wonGames = 0;
        let friends = {};
        let maxWinDate = '';

        newPlayedGames.forEach(game => {
            if (player === game.winner) {
                wonGames = wonGames + 1;
                maxWinDate = game.game_date;
            }
            game.players.forEach(friend => {
                if (friends[friend]) {
                    friends[friend] = friends[friend] + 1;
                } else {
                    friends[friend] = 1;
                }
            });
        });

        const sortedFriends = Object.fromEntries(Object.entries(friends).sort(([aKey, aValue], [bKey, bValue]) => bValue - aValue));
        leaderBoard = [
            ...leaderBoard,
            {
                winner: player,
                wins: wonGames,
                favouriteFriend: Object.keys(sortedFriends)[0] === player ? Object.keys(sortedFriends)[1] : Object.keys(sortedFriends)[0],
                latestWin: maxWinDate,
            },
        ];
    });
    const sortedLeaderBoard = leaderBoard.sort((a, b) => b.wins - a.wins);
    leaderBoard = sortedLeaderBoard.map((game, i) => ({ ...game, rank: i + 1 }));

    return res.status(200).send(leaderBoard);
};

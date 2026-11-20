import { DELETED_PLAYER } from '../account.js';
import { getAvatarsByUsername } from '../avatars.js';
import db from '../models/index.js';
const PlayedGame = db.played_game;

export const all = async (req, res) => {
    const playedGames = await PlayedGame.findAll();

    if (!playedGames || playedGames?.length === 0) {
        return res.status(404).send({ message: 'No Played games yet.' });
    }
    return res.status(200).send(playedGames);
};

/**
 * The leaderboard from the played games (`players`: comma-separated usernames): every winner
 * with their wins, latest win, and favourite friend (whoever they played the most games
 * with, counting only games they played in; ties go to whoever comes first), ranked by wins.
 */
export const buildLeaderBoard = playedGames => {
    const games = playedGames.map(game => ({ ...game, players: String(game.players ?? '').split(',').filter(Boolean) }));
    // Deleted accounts (their name is DELETED_PLAYER) are neither on the board nor anyone's favourite friend.
    const winners = [...new Set(games.map(game => game.winner))].filter(winner => winner !== DELETED_PLAYER);
    return winners
        .map(player => {
            let wins = 0;
            let latestWin = '';
            const friends = {};
            for (const game of games) {
                if (game.winner === player) {
                    wins += 1;
                    if (!latestWin || new Date(game.game_date) > new Date(latestWin)) latestWin = game.game_date;
                }
                if (!game.players.includes(player)) continue;
                for (const friend of game.players) {
                    if (friend !== player && friend !== DELETED_PLAYER) friends[friend] = (friends[friend] ?? 0) + 1;
                }
            }
            const favouriteFriend = Object.entries(friends).sort(([, a], [, b]) => b - a)[0]?.[0];
            return { winner: player, wins, favouriteFriend, latestWin };
        })
        .sort((a, b) => b.wins - a.wins)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
};

export const leaderBoard = async (req, res) => {
    const playedGamesRaw = await PlayedGame.findAll({ raw: true });

    if (!playedGamesRaw) {
        return res.status(404).send({ message: 'No Played games yet.' });
    }

    let leaderBoard = buildLeaderBoard(playedGamesRaw);

    // Chosen avatars (null: the clients show the one generated from the name).
    let avatars = {};
    try {
        avatars = await getAvatarsByUsername(leaderBoard.flatMap(entry => [entry.winner, entry.favouriteFriend]).filter(Boolean));
    } catch (error) {
        console.log('LEADERBOARD AVATARS FAILED', error.message);
    }
    leaderBoard = leaderBoard.map(entry => ({
        ...entry,
        winnerAvatar: avatars[entry.winner] ?? null,
        favouriteFriendAvatar: (entry.favouriteFriend && avatars[entry.favouriteFriend]) ?? null,
    }));

    return res.status(200).send(leaderBoard);
};

// Deleting a registered account (in the app, or on the web page the Play Store asks for).

import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

import { roomsList } from './rooms.js';
import { forgetUserPushTokens } from './push.js';
import db from './models/index.js';

const User = db.user;

/**
 * What a deleted user's name becomes in the played games, so the other players keep their wins
 * and games. Not a name anyone can take (see `isReservedUsername`); left out of the leaderboard.
 */
export const DELETED_PLAYER = '[deleted]';

/** bcrypt cost of stored passwords (older accounts are re-hashed with it at their next login). */
export const PASSWORD_ROUNDS = 10;

/** Names nobody can register or join as a guest with. */
export const isReservedUsername = username => typeof username === 'string' && username.trim().toLowerCase() === DELETED_PLAYER;

/** `players` (comma-separated usernames of a played game) with `username` replaced by `DELETED_PLAYER`. */
export const withoutPlayer = (players, username) =>
    String(players ?? '')
        .split(',')
        .map(name => (name === username ? DELETED_PLAYER : name))
        .join(',');

/**
 * Deletes user `user` (a `users` row) after checking `password`: their profile, sign-in and
 * push tokens; their name in the played games becomes `DELETED_PLAYER`. Refused while they are
 * in a room (a running game can't be left; a lobby room first). Their connected sockets are
 * disconnected (`io`), so they go on anonymously.
 * Returns `{ status, message? }`: 204, 401 wrong password, 409 in a room.
 */
export const deleteAccount = async (user, password, io) => {
    if (typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
        return { status: 401, message: 'Wrong password.' };
    }
    const room = Object.values(roomsList).find(other => other.players.some(player => player.username === user.username));
    if (room) {
        return {
            status: 409,
            message: room.inGame
                ? 'You are in a running game. You can delete your account once it is over.'
                : `Leave the room "${room.name}" first, then delete your account.`,
        };
    }

    await db.sequelize.transaction(async transaction => {
        const games = await db.played_game.findAll({
            where: { [Op.or]: [{ winner: user.username }, { players: { [Op.like]: `%${user.username}%` } }] },
            transaction,
        });
        for (const game of games) {
            const players = withoutPlayer(game.players, user.username);
            const winner = game.winner === user.username ? DELETED_PLAYER : game.winner;
            if (players !== game.players || winner !== game.winner) await game.update({ players, winner }, { transaction });
        }
        await db.refresh_token.destroy({ where: { user_id: user.id }, transaction });
        await db.user_profile.destroy({ where: { user_id: user.id }, transaction });
        await User.destroy({ where: { id: user.id }, transaction });
    });
    await forgetUserPushTokens(user.id);

    io?.of('/').sockets.forEach(socket => {
        if (socket.data.user && !socket.data.user.isGuest && socket.data.user.id === user.id) socket.disconnect(true);
    });
    return { status: 204 };
};

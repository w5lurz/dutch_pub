// Saved avatars of registered users (table `user_profiles`). Guests and users who have not
// chosen one get the avatar generated from their name, on the clients (`avatarFor` in
// packages/shared); the server only stores and forwards the chosen id (or null).
import { isAvatarId } from '@dutch-pub/shared';

import db from './models/index.js';

const User = db.user;
const UserProfile = db.user_profile;

/**
 * Checks the body of `PUT /api/auth/me/avatar`: `{ avatar: <preset id> | null }` (null = back
 * to the generated one). Returns `{ avatar }` or `{ error }`.
 */
export const parseAvatarUpdate = body => {
    if (!body || typeof body !== 'object' || !('avatar' in body)) {
        return { error: 'Please choose an avatar.' };
    }
    const { avatar } = body;
    if (avatar === null || isAvatarId(avatar)) return { avatar };
    return { error: 'Unknown avatar.' };
};

/** The chosen avatar of user `userId`, or null (also for unknown or no longer valid ids). */
export const getAvatar = async userId => {
    const profile = await UserProfile.findByPk(userId, { attributes: ['avatar'], raw: true });
    return isAvatarId(profile?.avatar) ? profile.avatar : null;
};

/** Like `getAvatar`, but never throws (a missing avatar must not block login or joining). */
export const getAvatarSafe = async userId => {
    try {
        return await getAvatar(userId);
    } catch (error) {
        console.log('AVATAR LOOKUP FAILED', error.message);
        return null;
    }
};

export const saveAvatar = async (userId, avatar) => {
    await UserProfile.upsert({ user_id: userId, avatar });
};

/** `{ [username]: avatarId }` for the registered users among `usernames` who chose one. */
export const getAvatarsByUsername = async usernames => {
    const names = [...new Set(usernames.filter(name => typeof name === 'string' && name))];
    if (names.length === 0) return {};
    const users = await User.findAll({ where: { username: names }, attributes: ['id', 'username'], raw: true });
    if (users.length === 0) return {};
    const profiles = await UserProfile.findAll({ where: { user_id: users.map(user => user.id) }, attributes: ['user_id', 'avatar'], raw: true });
    const byId = Object.fromEntries(profiles.filter(profile => isAvatarId(profile.avatar)).map(profile => [profile.user_id, profile.avatar]));
    return Object.fromEntries(users.filter(user => byId[user.id]).map(user => [user.username, byId[user.id]]));
};

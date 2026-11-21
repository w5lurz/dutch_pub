import { parseAvatarUpdate, saveAvatar } from '../avatars.js';
import db from '../models/index.js';
import { applyAvatarChange } from '../rooms.js';
import { serverError } from '../utils/utils.js';

const User = db.user;

/**
 * `PUT /api/auth/me/avatar` (also PATCH): saves the logged-in user's avatar. Guests cannot
 * choose one (they keep the generated avatar). Players in a room see the change at once
 * (`rooms-listed` broadcast).
 */
export const setMyAvatar = async (req, res) => {
    if (req.auth?.guest) {
        return res.status(403).send({ message: 'Guests cannot choose an avatar. Log in to choose one.' });
    }
    const { avatar, error } = parseAvatarUpdate(req.body);
    if (error) {
        return res.status(400).send({ message: error });
    }
    try {
        const user = await User.findByPk(req.userId, { attributes: ['id', 'username'] });
        if (!user) {
            return res.status(404).send({ message: 'No user with this username found.' });
        }
        await saveAvatar(user.id, avatar);
        applyAvatarChange(user.id, user.username, avatar);
        return res.status(200).send({ avatar });
    } catch (err) {
        return serverError(res, err);
    }
};

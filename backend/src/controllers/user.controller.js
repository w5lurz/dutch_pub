import { deleteAccount } from '../account.js';
import { getAvatarSafe } from '../avatars.js';
import { forgetPushToken, isExpoPushToken, registerPushToken } from '../push.js';
import db from '../models/index.js';
import { serverError } from '../utils/utils.js';
const User = db.user;

// Public fields only: never expose password hashes or emails.
export const allAccess = async (req, res) => {
    const users = await User.findAll({ attributes: ['id', 'username'] });

    res.status(200).send(users);
};

/** The current user, from the verified bearer token. */
export const userBoard = async (req, res) => {
    if (req.auth?.guest) {
        return res.status(200).send({ id: req.auth.id, username: req.auth.username, isGuest: true });
    }

    const user = await User.findByPk(req.userId);

    if (!user) {
        return res.status(404).send({ message: 'No user with this username found.' });
    }

    return res.status(200).send({ id: user.id, username: user.username, email: user.email, avatar: await getAvatarSafe(user.id) });
};

/**
 * `DELETE /api/users/me` with `{ password }`: deletes the logged-in user's account (`deleteAccount`).
 * 204; 401 wrong password; 403 guest; 409 in a room.
 */
export const deleteMe = async (req, res) => {
    if (req.auth?.guest) {
        return res.status(403).send({ message: 'Guests have no account to delete.' });
    }
    try {
        const user = await User.findByPk(req.userId);
        if (!user) return res.status(204).end();
        const { status, message } = await deleteAccount(user, req.body?.password, req.app.get('io'));
        return status === 204 ? res.status(204).end() : res.status(status).send({ message });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * `PUT /api/users/me/push-token` with `{ token, language? }` (an Expo push token and the app's
 * language): "your turn" notifications go to this phone, in that language. 204; 400 not a push token.
 */
export const setPushToken = async (req, res) => {
    const token = req.body?.token;
    if (!isExpoPushToken(token)) {
        return res.status(400).send({ message: 'Not a push token.' });
    }
    try {
        await registerPushToken(req.auth, token, req.body?.language);
        return res.status(204).end();
    } catch (error) {
        return serverError(res, error);
    }
};

/** `DELETE /api/users/me/push-token` with `{ token }`: no more notifications to this phone. Always 204 (no access token needed). */
export const deletePushToken = async (req, res) => {
    try {
        if (isExpoPushToken(req.body?.token)) await forgetPushToken(req.body.token);
        return res.status(204).end();
    } catch (error) {
        return serverError(res, error);
    }
};

import bcrypt from 'bcryptjs';

import { Op } from 'sequelize';

import {
    hashToken,
    newRefreshToken,
    REFRESH_TTL_SECONDS,
    signGuestRefreshToken,
    signGuestToken,
    signUserToken,
    TOKEN_TTL_SECONDS,
    verifyGuestRefreshToken,
} from '../middleware/authJwt.js';

import { getAvatarSafe } from '../avatars.js';
import db from '../models/index.js';
const User = db.user;
const RefreshToken = db.refresh_token;

/** Stores a new refresh token for registered user `userId` (its hash) and returns it. */
const issueRefreshToken = async userId => {
    const refreshToken = newRefreshToken();
    await RefreshToken.create({
        user_id: userId,
        token_hash: hashToken(refreshToken),
        expires_at: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    });
    return refreshToken;
};

export let guestsList = [];

export const modifyGuestsList = newGuests => {
    guestsList = newGuests;
};

export const signUp = async (req, res) => {
    // Save User to Database
    console.log('SIGNUP');
    try {
        await User.create({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
        });
        console.log('SIGNUP2');

        res.status(201).send({ message: `User ${req.body.username} registered successfully!` });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const loginUser = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { username: req.body.username } });

        if (!user) {
            return res.status(404).send({ message: 'No user with this username found.' });
        }

        const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                message: 'Invalid Password!',
            });
        }

        // The app sends it back as `Authorization: Bearer <token>` and in the socket handshake;
        // before it expires, the app trades `refreshToken` for new ones (`refreshSession`).
        const token = signUserToken(user);
        // Expired refresh tokens of anyone are dropped now and then (here: on each login).
        await RefreshToken.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
        const refreshToken = await issueRefreshToken(user.id);

        return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: await getAvatarSafe(user.id),
            token,
            refreshToken,
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

// Monotonic, so an old guest token can never match a newer guest that reused an id.
let nextGuestId = 1;

// Guests keep their name for as long as their token is valid, even while disconnected
// (e.g. the app is in the background), so nobody else can take it meanwhile. Entries:
// `{ id, username, isGuest: true, expiresAt, socketId? }` (socketId = last connected socket).
const dropExpiredGuests = () => {
    const now = Date.now();
    if (guestsList.some(guest => guest.expiresAt <= now)) {
        guestsList = guestsList.filter(guest => guest.expiresAt > now);
    }
};

/** Whether `username` is free: no registered user has it and no other guest (`guestId`) holds it. */
export const isUsernameAvailable = async (username, guestId) => {
    dropExpiredGuests();
    if (guestsList.some(guest => guest.username === username && guest.id !== guestId)) {
        return false;
    }
    return !(await User.findOne({ where: { username }, attributes: ['id'] }));
};

/**
 * Adds a guest and returns it with a guest token. The guest is bound to a socket when
 * that socket connects with the token (see socketAuth.js).
 */
export const addGuest = async (req, res, next) => {
    try {
        const guestUsername = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        if (!guestUsername) {
            return res.status(400).send({ message: 'Please choose a username!' });
        }

        if (!(await isUsernameAvailable(guestUsername))) {
            return res.status(403).send({ message: 'This username is already taken!' });
        }

        const newGuest = { id: nextGuestId++, username: guestUsername, isGuest: true };
        const token = signGuestToken(newGuest);
        guestsList = [...guestsList, { ...newGuest, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 }];
        return res.status(200).send({ ...newGuest, token, refreshToken: signGuestRefreshToken(newGuest) });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

/**
 * `POST /refresh` with `{ refreshToken }`: trades a refresh token for a new access token and a
 * new refresh token (the old one stops working: rotation), so a session lasts as long as the
 * app is used now and then. 200 + `AuthResponse`; 401 when the refresh token is unknown, used,
 * expired or revoked (log in again); 403 when a guest's name was taken meanwhile.
 */
export const refreshSession = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (typeof refreshToken !== 'string' || !refreshToken) {
        return res.status(400).send({ message: 'No refresh token provided!' });
    }
    try {
        const guest = verifyGuestRefreshToken(refreshToken);
        if (guest) {
            // The name is reserved only while the guest's access token is valid; it may be taken by now.
            if (!(await isUsernameAvailable(guest.username, guest.id))) {
                return res.status(403).send({ message: 'This username is already taken!' });
            }
            const renewed = { id: guest.id, username: guest.username, isGuest: true };
            dropExpiredGuests();
            guestsList = [
                ...guestsList.filter(other => other.id !== guest.id),
                { ...guestsList.find(other => other.id === guest.id), ...renewed, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 },
            ];
            return res.status(200).send({ ...renewed, token: signGuestToken(renewed), refreshToken: signGuestRefreshToken(renewed) });
        }

        const stored = await RefreshToken.findOne({ where: { token_hash: hashToken(refreshToken) } });
        // Deleted first: of two refreshes with the same token, only one gets new tokens.
        const deleted = stored ? await RefreshToken.destroy({ where: { id: stored.id } }) : 0;
        if (!stored || !deleted || stored.expires_at <= new Date()) {
            return res.status(401).send({ message: 'Your session has expired. Please log in again.' });
        }
        const user = await User.findByPk(stored.user_id);
        if (!user) {
            return res.status(401).send({ message: 'Your session has expired. Please log in again.' });
        }
        return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: await getAvatarSafe(user.id),
            token: signUserToken(user),
            refreshToken: await issueRefreshToken(user.id),
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

/**
 * `POST /logout` with `{ refreshToken }`: revokes it (a registered user's), so it can't be used
 * again. Always 204: logging out works even if the token is already gone. (A guest's refresh
 * token can't be revoked; it simply runs out.)
 */
export const logOut = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    try {
        if (typeof refreshToken === 'string' && refreshToken) {
            await RefreshToken.destroy({ where: { token_hash: hashToken(refreshToken) } });
        }
        return res.status(204).end();
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

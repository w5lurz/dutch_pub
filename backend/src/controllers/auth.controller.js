import bcrypt from 'bcryptjs';

import { signGuestToken, signUserToken, TOKEN_TTL_SECONDS } from '../middleware/authJwt.js';

import db from '../models/index.js';
const User = db.user;

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

        // The app sends it back as `Authorization: Bearer <token>` and in the socket handshake.
        const token = signUserToken(user);

        return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            token,
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
        return res.status(200).send({ ...newGuest, token });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

import bcrypt from 'bcryptjs';

import { signGuestToken, signUserToken } from '../middleware/authJwt.js';

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

        const token = signUserToken(user);

        // Web: token in the httpOnly session cookie. Mobile: token from the response body,
        // sent back as `Authorization: Bearer <token>` and in the socket handshake.
        req.session.token = token;
        req.session.username = user.username;

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

/** Whether `username` is free: no registered user has it and no other guest (`guestId`) uses it. */
export const isUsernameAvailable = async (username, guestId) => {
    if (guestsList.some(guest => guest.username === username && guest.id !== guestId)) {
        return false;
    }
    return !(await User.findOne({ where: { username }, attributes: ['id'] }));
};

/**
 * Adds a guest and returns it with a guest token. The guest is bound to a socket when
 * that socket connects with the token (see socketAuth.js); `socketId` is optional.
 */
export const addGuest = async (req, res, next) => {
    try {
        const guestUsername = typeof req.body.username === 'string' ? req.body.username.trim() : '';
        const socketId = req.body.socketId;
        if (!guestUsername) {
            return res.status(400).send({ message: 'Please choose a username!' });
        }

        if (!(await isUsernameAvailable(guestUsername))) {
            return res.status(403).send({ message: 'This username is already taken!' });
        }

        const newGuest = { id: nextGuestId++, username: guestUsername, socketId, isGuest: true };
        guestsList = [...guestsList, newGuest];
        const token = signGuestToken(newGuest);
        req.session.token = token;
        req.session.username = newGuest.username;
        return res.status(200).send({ ...newGuest, token });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

export const logoutUser = (req, res) => {
    try {
        req.session = null;
        return res.status(200).send({
            message: "You've been signed out!",
        });
    } catch (err) {
        this.next(err);
    }
};

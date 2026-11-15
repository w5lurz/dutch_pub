import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { secret } from '../config/auth.config.js';
import { getMaxId } from '../utils/utils.js';

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

        const token = jwt.sign({ id: user.id }, secret, {
            expiresIn: 7200, // 2 hours
        });

        req.session.token = token;
        req.session.username = user.username;

        return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

export const addGuest = async (req, res, next) => {
    try {
        console.log('GUESTL', req.body);
        const guestUsername = req.body.username;
        const socketId = req.body.socketId;
        console.log('GUESTL', guestUsername, socketId, req.body, req);

        const users = await User.findAll();
        const id = getMaxId(guestsList);
        if (!guestsList.find(guest => guest.username === guestUsername) && !users.find(user => user.username === guestUsername)) {
            const newGuest = { id, username: guestUsername, socketId, isGuest: true };
            guestsList = [...guestsList, newGuest];
            console.log('GUESTL', guestsList, newGuest, users);
            return res.status(200).send(newGuest);
        } else {
            return res.status(403).send({ message: 'This username is already taken!' });
        }
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

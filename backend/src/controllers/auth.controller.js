import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import db from '../models';
import { secret } from '../config/auth.config';
const User = db.user;

export const signUp = async (req, res) => {
    // Save User to Database
    try {
        await User.create({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
        });

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
            expiresIn: 86400, // 24 hours
        });
        console.log('SES', req.session);
        req.session.token = token;

        return res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            accessToken: token,
        });
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

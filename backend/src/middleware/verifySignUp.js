import { emailError, passwordError, usernameError } from '@dutch-pub/shared';

import { isReservedUsername } from '../account.js';
import db from '../models/index.js';
import { serverError } from '../utils/utils.js';
const User = db.user;

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    const invalid = usernameError(req.body?.username) ?? emailError(req.body?.email) ?? passwordError(req.body?.password);
    if (invalid) {
        return res.status(400).send({ message: `Registration Failed! ${invalid}` });
    }
    // Stored as checked: no spaces around the name or the email.
    req.body.username = req.body.username.trim();
    req.body.email = req.body.email.trim();
    if (isReservedUsername(req.body.username)) {
        return res.status(400).send({ message: 'Registration Failed! Username is already in use!' });
    }
    try {
        // Check username
        let user = await User.findOne({
            where: {
                username: req.body.username,
            },
        });

        if (user) {
            return res.status(400).send({
                message: 'Registration Failed! Username is already in use!',
            });
        }

        // Check email
        user = await User.findOne({
            where: {
                email: req.body.email,
            },
        });

        if (user) {
            return res.status(400).send({
                message: 'Registration Failed! Email is already in use!',
            });
        }

        next();
    } catch (error) {
        return serverError(res, error, 'SIGNUP CHECK');
    }
};

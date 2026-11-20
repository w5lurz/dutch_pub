import { isReservedUsername } from '../account.js';
import db from '../models/index.js';
const User = db.user;

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
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
        return res.status(500).send({
            message: 'Unable to validate Username!',
            err: error,
        });
    }
};

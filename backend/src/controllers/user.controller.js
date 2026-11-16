import db from '../models/index.js';
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

    return res.status(200).send({ id: user.id, username: user.username, email: user.email });
};

import db from '../models/index.js';
const User = db.user;

export const allAccess = async (req, res) => {
    const users = await User.findAll();

    res.status(200).send(users);
};

export const userBoard = async (req, res) => {
    const user = await User.findOne({ where: { username: req?.session?.username } });

    if (!user) {
        return res.status(404).send({ message: 'No user with this username found.' });
    }

    return res.status(200).send({ id: user.id, username: user.username, email: user.email });
};

import db from '../models';
const User = db.user;

export const allAccess = (req, res) => {
    res.status(200).send('Public Content.');
};

export const userBoard = async (req, res) => {
    const user = await User.findOne({ where: { username: req?.session?.username } });

    if (!user) {
        return res.status(404).send({ message: 'No user with this username found.' });
    }

    return res.status(200).send({ id: user.id, username: user.username, email: user.email });
};

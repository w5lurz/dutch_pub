export const getMaxId = arr => {
    let max = 0;
    arr.forEach(item => {
        if (item.id >= max) {
            max = item.id;
        }
    });
    return max + 1;
};

export const isDevEnv = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

/** A 500 without internal details (database errors and the like go to the server log only). */
export const serverError = (res, error, where = 'REQUEST') => {
    console.log(`${where} FAILED`, error?.message ?? error);
    return res.status(500).send({ message: 'Something went wrong. Please try again later.' });
};

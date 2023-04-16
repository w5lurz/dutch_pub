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

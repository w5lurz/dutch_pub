export default {
    HOST: 'localhost',
    USER: 'user',
    PASSWORD: 'root',
    DB: 'dutch_pub',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};

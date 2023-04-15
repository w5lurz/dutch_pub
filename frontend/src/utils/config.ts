export const isDevEnv = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export const baseUrl = isDevEnv ? 'http://localhost:3030' : process.env.REACT_APP_BASE_URL;

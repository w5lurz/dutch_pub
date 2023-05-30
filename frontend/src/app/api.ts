import { baseUrl } from '../utils/config';

export const registration = async (username: string, email: string, password: string) => {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({
            username,
            email,
            password,
        }), // body data type must match "Content-Type" header
    });
    return response;
};

export const loginUser = async (username: string, password: string) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({ username, password }), // body data type must match "Content-Type" header
    });
    return response;
};

export const logoutUser = async () => {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    return response;
};

export const getUser = async () => {
    const response = await fetch(`${baseUrl}/api/users/user`, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response;
};

export const addGuest = async (username: string, socketId: string) => {
    const response = await fetch(`${baseUrl}/api/auth/add-guest`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({ username, socketId }), // body data type must match "Content-Type" header
    });
    return response;
};

export const getLeaderBoard = async () => {
    const response = await fetch(`${baseUrl}/api/games/leaderboard`, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response;
};

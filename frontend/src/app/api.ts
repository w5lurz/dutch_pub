export const loginUser = async (username: string, password: string) => {
    const response = await fetch('http://localhost:3030/api/auth/login', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'include', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({ username, password }), // body data type must match "Content-Type" header
    });
    return response;
};

export const logoutUser = async () => {
    const response = await fetch('http://localhost:3030/api/auth/logout', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        credentials: 'include', // include, *same-origin, omit
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    return response;
};

export const getUser = async () => {
    const response = await fetch('http://localhost:3030/api/users/user', {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            // Authorization: 'Bearer app-secret-key',

            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

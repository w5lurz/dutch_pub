// REST client for the backend. Platform-agnostic: only relies on the global `fetch`.

const jsonHeaders = { 'Content-Type': 'application/json' };

export function createApi(baseUrl: string) {
    const registration = (username: string, email: string, password: string) =>
        fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: jsonHeaders,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, email, password }),
        });

    const loginUser = (username: string, password: string) =>
        fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: jsonHeaders,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, password }),
        });

    const logoutUser = () =>
        fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        });

    const getUser = () =>
        fetch(`${baseUrl}/api/users/user`, {
            method: 'GET',
            credentials: 'include',
            headers: jsonHeaders,
        });

    const addGuest = (username: string, socketId: string) =>
        fetch(`${baseUrl}/api/auth/add-guest`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: jsonHeaders,
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, socketId }),
        });

    const getLeaderBoard = () =>
        fetch(`${baseUrl}/api/games/leaderboard`, {
            method: 'GET',
            credentials: 'include',
            headers: jsonHeaders,
        });

    return { registration, loginUser, logoutUser, getUser, addGuest, getLeaderBoard };
}

export type Api = ReturnType<typeof createApi>;

// REST client for the backend. Platform-agnostic: only relies on the global `fetch`.

import type { AvatarId } from './avatars';

/** Body of a successful `loginUser` / `addGuest` response. */
export type AuthResponse = {
    id: number;
    username: string;
    email?: string;
    isGuest?: boolean;
    /** The chosen avatar (registered users); null = generated from the name. Missing for guests. */
    avatar?: AvatarId | null;
    /** JWT (2 h); send back as `Authorization: Bearer <token>` and in the socket handshake (`auth.token`). */
    token: string;
    /** Trade it for new tokens before `token` expires (`refreshSession`). Missing from older servers. */
    refreshToken?: string;
};

export type ApiOptions = {
    /** Returns the stored auth token, if any; requests then carry `Authorization: Bearer <token>`. */
    getToken?: () => string | null | undefined | Promise<string | null | undefined>;
};

export function createApi(baseUrl: string, { getToken }: ApiOptions = {}) {
    const headers = async (): Promise<Record<string, string>> => {
        const token = getToken ? await getToken() : null;
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    };

    const get = async (path: string) => fetch(`${baseUrl}${path}`, { method: 'GET', headers: await headers() });
    const send = async (method: 'POST' | 'PUT' | 'DELETE', path: string, body: unknown) =>
        fetch(`${baseUrl}${path}`, { method, headers: await headers(), body: JSON.stringify(body) });
    const post = (path: string, body: unknown) => send('POST', path, body);

    /** 201 on success; 400 + `{ message }` for a duplicate username / email. */
    const registration = (username: string, email: string, password: string) => post('/api/auth/signup', { username, email, password });

    /** 200 + `AuthResponse`; 404 unknown user, 401 wrong password. */
    const loginUser = (username: string, password: string) => post('/api/auth/login', { username, password });

    /** The user the stored token belongs to (registered or guest). */
    const getUser = () => get('/api/users/user');

    /** 200 + `AuthResponse` (guest token); 403 name taken, 400 empty name. */
    const addGuest = (username: string) => post('/api/auth/add-guest', { username });

    // Sent without the access token: it may be expired, and getting one may be what calls these.
    const sendAnonymous = (method: 'POST' | 'DELETE', path: string, body: unknown) =>
        fetch(`${baseUrl}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const postAnonymous = (path: string, body: unknown) => sendAnonymous('POST', path, body);

    /**
     * Trades a refresh token for new tokens (the old refresh token stops working). 200 + `AuthResponse`;
     * 401 expired / used / revoked (log in again); 403 a guest's name was taken meanwhile.
     */
    const refreshSession = (refreshToken: string) => postAnonymous('/api/auth/refresh', { refreshToken });

    /** Revokes a refresh token (logging out). Always 204. */
    const logOut = (refreshToken: string) => postAnonymous('/api/auth/logout', { refreshToken });

    /**
     * "Forgot password?": emails a link to set a new password, if an account uses `email`. 200 +
     * `{ message }` either way; 400 not an email; 429 too many; 503 not set up on the server.
     */
    const requestPasswordReset = (email: string) => postAnonymous('/api/auth/forgot-password', { email });

    /** Deletes the logged-in user's account. 204; 401 wrong password; 403 guest; 409 in a room (`{ message }`). */
    const deleteAccount = (password: string) => send('DELETE', '/api/users/me', { password });

    /** "Your turn" notifications go to this phone (an Expo push token). 204; 400 not a push token. */
    const setPushToken = (token: string) => send('PUT', '/api/users/me/push-token', { token });

    /** No more notifications to this phone. Always 204. */
    const deletePushToken = (token: string) => sendAnonymous('DELETE', '/api/users/me/push-token', { token });

    const getLeaderBoard = () => get('/api/games/leaderboard');

    /**
     * Saves the logged-in user's avatar (`null` = back to the generated one).
     * 200 + `{ avatar }`; 400 unknown id, 403 guest / no token, 401 invalid token.
     */
    const setAvatar = (avatar: AvatarId | null) => send('PUT', '/api/auth/me/avatar', { avatar });

    return {
        registration,
        loginUser,
        getUser,
        addGuest,
        refreshSession,
        logOut,
        requestPasswordReset,
        deleteAccount,
        setPushToken,
        deletePushToken,
        getLeaderBoard,
        setAvatar,
    };
}

export type Api = ReturnType<typeof createApi>;

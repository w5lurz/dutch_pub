// REST client for the backend. Platform-agnostic: only relies on the global `fetch`.

/** Body of a successful `loginUser` / `addGuest` response. */
export type AuthResponse = {
    id: number;
    username: string;
    email?: string;
    isGuest?: boolean;
    /** JWT; send back as `Authorization: Bearer <token>` and in the socket handshake (`auth.token`). */
    token: string;
};

export type ApiOptions = {
    /**
     * Returns the stored auth token, if any (mobile). When it returns a token, requests carry
     * `Authorization: Bearer <token>`. The web relies on the session cookie instead.
     */
    getToken?: () => string | null | undefined | Promise<string | null | undefined>;
};

export function createApi(baseUrl: string, { getToken }: ApiOptions = {}) {
    const headers = async (json = true): Promise<Record<string, string>> => {
        const token = getToken ? await getToken() : null;
        return {
            ...(json && { 'Content-Type': 'application/json' }),
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    };

    const registration = async (username: string, email: string, password: string) =>
        fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: await headers(),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, email, password }),
        });

    const loginUser = async (username: string, password: string) =>
        fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: await headers(),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, password }),
        });

    const logoutUser = async () =>
        fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: await headers(false),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        });

    const getUser = async () =>
        fetch(`${baseUrl}/api/users/user`, {
            method: 'GET',
            credentials: 'include',
            headers: await headers(),
        });

    /** `socketId` is optional: the guest is bound to the socket that connects with its token. */
    const addGuest = async (username: string, socketId?: string) =>
        fetch(`${baseUrl}/api/auth/add-guest`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: await headers(),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({ username, socketId }),
        });

    const getLeaderBoard = async () =>
        fetch(`${baseUrl}/api/games/leaderboard`, {
            method: 'GET',
            credentials: 'include',
            headers: await headers(),
        });

    return { registration, loginUser, logoutUser, getUser, addGuest, getLeaderBoard };
}

export type Api = ReturnType<typeof createApi>;

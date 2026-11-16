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
    const post = async (path: string, body: unknown) =>
        fetch(`${baseUrl}${path}`, { method: 'POST', headers: await headers(), body: JSON.stringify(body) });

    /** 201 on success; 400 + `{ message }` for a duplicate username / email. */
    const registration = (username: string, email: string, password: string) => post('/api/auth/signup', { username, email, password });

    /** 200 + `AuthResponse`; 404 unknown user, 401 wrong password. */
    const loginUser = (username: string, password: string) => post('/api/auth/login', { username, password });

    /** The user the stored token belongs to (registered or guest). */
    const getUser = () => get('/api/users/user');

    /** 200 + `AuthResponse` (guest token); 403 name taken, 400 empty name. */
    const addGuest = (username: string) => post('/api/auth/add-guest', { username });

    const getLeaderBoard = () => get('/api/games/leaderboard');

    return { registration, loginUser, getUser, addGuest, getLeaderBoard };
}

export type Api = ReturnType<typeof createApi>;

import { getRefreshToken, getToken, setToken } from '../authToken';
import { endSession, getValidToken, refreshSession, tokenExpiry } from '../session';

jest.mock('expo-secure-store', () => {
    const store = new Map<string, string>();
    return {
        getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
        setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
        deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    };
});

/** An unsigned JWT-shaped token expiring at `exp` (seconds); only the payload is read by the app. */
const jwtExpiring = (exp: number) => `x.${btoa(JSON.stringify({ id: 1, exp })).replace(/=+$/, '')}.sig`;
const nowSeconds = () => Math.floor(Date.now() / 1000);

const respond = (status: number, body?: unknown) =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

describe('session', () => {
    const fetchMock = jest.fn();
    beforeEach(async () => {
        fetchMock.mockReset();
        globalThis.fetch = fetchMock;
        await setToken('none', null);
    });

    it('reads the expiry of an access token', () => {
        expect(tokenExpiry(jwtExpiring(1234))).toBe(1234000);
        expect(tokenExpiry('not-a-jwt')).toBeNull();
    });

    it('sends a token that is still good as it is', async () => {
        const token = jwtExpiring(nowSeconds() + 3600);
        await setToken(token, 'refresh-1');
        expect(await getValidToken()).toBe(token);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refreshes a token that is about to expire, and stores the new pair', async () => {
        await setToken(jwtExpiring(nowSeconds() + 60), 'refresh-1');
        const fresh = jwtExpiring(nowSeconds() + 7200);
        fetchMock.mockReturnValueOnce(respond(200, { id: 1, username: 'a', token: fresh, refreshToken: 'refresh-2' }));
        expect(await getValidToken()).toBe(fresh);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: 'refresh-1' });
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
        expect(await getToken()).toBe(fresh);
        expect(await getRefreshToken()).toBe('refresh-2');
    });

    it('shares one refresh between callers (a refresh token works only once)', async () => {
        await setToken(jwtExpiring(nowSeconds() - 10), 'refresh-1');
        const fresh = jwtExpiring(nowSeconds() + 7200);
        fetchMock.mockReturnValueOnce(respond(200, { id: 1, username: 'a', token: fresh, refreshToken: 'refresh-2' }));
        const [first, second] = await Promise.all([getValidToken(), getValidToken()]);
        expect(first).toBe(fresh);
        expect(second).toBe(fresh);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('tells an ended session from a missing connection', async () => {
        await setToken(jwtExpiring(nowSeconds() - 10), 'refresh-1');
        fetchMock.mockReturnValueOnce(respond(401, { message: 'expired' }));
        expect((await refreshSession()).status).toBe('expired');
        fetchMock.mockReturnValueOnce(Promise.reject(new Error('offline')));
        expect((await refreshSession()).status).toBe('offline');
        expect(await getRefreshToken()).toBe('refresh-1');
    });

    it('without a refresh token (older server) the stored token is sent as it is', async () => {
        const old = jwtExpiring(nowSeconds() - 10);
        await setToken(old, null);
        expect(await getValidToken()).toBe(old);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('logging out forgets both tokens and revokes the refresh token', async () => {
        await setToken(jwtExpiring(nowSeconds() + 3600), 'refresh-1');
        fetchMock.mockReturnValueOnce(respond(204));
        await endSession();
        expect(await getToken()).toBeNull();
        expect(await getRefreshToken()).toBeNull();
        expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/logout$/);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: 'refresh-1' });
    });
});

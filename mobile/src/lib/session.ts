import { createApi, type AuthResponse } from '@dutch-pub/shared';

import { versionOptions } from './appVersion';
import { clearToken, getRefreshToken, getToken, setToken } from './authToken';
import { API_URL } from './config';

/** Refresh this long before the access token expires (slow networks, clock differences). */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

// Only for the refresh call itself (it sends no access token, so no loop through getValidToken).
const authApi = createApi(API_URL, versionOptions);

/** When access token `token` expires (ms since 1970), or null if it can't be read. */
export function tokenExpiry(token: string): number | null {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
        const exp = (JSON.parse(json) as { exp?: unknown }).exp;
        return typeof exp === 'number' ? exp * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * - 'ok': new tokens are stored (`user`: who they belong to, as the server sent it);
 * - 'expired': the session is over (refresh token unknown, used, expired; or a guest's name was taken): log in again;
 * - 'offline': the server couldn't be reached; the tokens are kept, try again later.
 */
export type RefreshResult = { status: 'ok'; user: AuthResponse } | { status: 'expired' } | { status: 'offline' };

let inFlight: Promise<RefreshResult> | null = null;

/**
 * Trades the stored refresh token for new tokens. Concurrent callers share one request: a
 * refresh token works only once, so a second request with it would end the session.
 */
export function refreshSession(): Promise<RefreshResult> {
    inFlight ??= (async (): Promise<RefreshResult> => {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return { status: 'expired' };
        try {
            const res = await authApi.refreshSession(refreshToken);
            if (res.ok) {
                const user = (await res.json()) as AuthResponse;
                await setToken(user.token, user.refreshToken);
                return { status: 'ok', user };
            }
            return res.status === 401 || res.status === 403 || res.status === 400 ? { status: 'expired' } : { status: 'offline' };
        } catch {
            return { status: 'offline' };
        }
    })().finally(() => {
        inFlight = null;
    });
    return inFlight;
}

/**
 * The access token to send (REST, socket handshake): the stored one, refreshed first when it
 * has expired or is about to. Without a refresh token (older server) the stored one as it is.
 */
export async function getValidToken(): Promise<string | null> {
    const token = await getToken();
    if (!token) return null;
    const expiry = tokenExpiry(token);
    if (expiry === null || expiry - Date.now() > REFRESH_MARGIN_MS || !(await getRefreshToken())) return token;
    const result = await refreshSession();
    return result.status === 'ok' ? result.user.token : token;
}

/** Logging out: revokes the refresh token on the server (best effort) and forgets both tokens. */
export async function endSession(): Promise<void> {
    const refreshToken = await getRefreshToken();
    await clearToken();
    if (refreshToken) authApi.logOut(refreshToken).catch(() => {});
}

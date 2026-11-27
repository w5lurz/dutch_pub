import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The tokens from login / join-as-guest: the access token (a JWT, 2 h) and the refresh token
// that buys new ones (see session.ts). Kept in the device keychain/keystore (SecureStore);
// SecureStore has no web implementation, so `npm run web` falls back to localStorage.
const KEY = 'dutch-pub.auth-token';
const REFRESH_KEY = 'dutch-pub.refresh-token';

// In-memory copies, so the API client and socket handshake don't hit the keychain every time.
const cached: Record<string, string | null | undefined> = {};

const webStorage = {
    get: (key: string) => {
        try {
            return globalThis.localStorage?.getItem(key) ?? null;
        } catch {
            return null;
        }
    },
    set: (key: string, value: string | null) => {
        try {
            if (value === null) globalThis.localStorage?.removeItem(key);
            else globalThis.localStorage?.setItem(key, value);
        } catch {
            // Storage unavailable (private mode, ...): the token just won't survive a reload.
        }
    },
};

async function read(key: string): Promise<string | null> {
    if (cached[key] !== undefined) return cached[key];
    const value = Platform.OS === 'web' ? webStorage.get(key) : await SecureStore.getItemAsync(key);
    cached[key] = value;
    return value;
}

async function write(key: string, value: string | null): Promise<void> {
    cached[key] = value;
    if (Platform.OS === 'web') webStorage.set(key, value);
    else if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
}

/** The stored access token as it is (it may be expired: `getValidToken` in session.ts refreshes it). */
export const getToken = () => read(KEY);

export const getRefreshToken = () => read(REFRESH_KEY);

/** Stores a new access token, and the refresh token that came with it (older servers send none). */
export async function setToken(token: string, refreshToken?: string | null): Promise<void> {
    await write(KEY, token);
    await write(REFRESH_KEY, refreshToken ?? null);
}

/** Forgets both tokens (logged out). */
export async function clearToken(): Promise<void> {
    await write(KEY, null);
    await write(REFRESH_KEY, null);
}

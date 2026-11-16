import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The JWT from login / join-as-guest. Kept in the device keychain/keystore (SecureStore);
// SecureStore has no web implementation, so `npm run web` falls back to localStorage.
const KEY = 'dutch-pub.auth-token';

// In-memory copy, so the API client and socket handshake don't hit the keychain every time.
let cached: string | null | undefined;

const webStorage = {
    get: () => {
        try {
            return globalThis.localStorage?.getItem(KEY) ?? null;
        } catch {
            return null;
        }
    },
    set: (value: string | null) => {
        try {
            if (value === null) globalThis.localStorage?.removeItem(KEY);
            else globalThis.localStorage?.setItem(KEY, value);
        } catch {
            // Storage unavailable (private mode, ...): the token just won't survive a reload.
        }
    },
};

export async function getToken(): Promise<string | null> {
    if (cached !== undefined) return cached;
    cached = Platform.OS === 'web' ? webStorage.get() : await SecureStore.getItemAsync(KEY);
    return cached;
}

export async function setToken(token: string): Promise<void> {
    cached = token;
    if (Platform.OS === 'web') webStorage.set(token);
    else await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
    cached = null;
    if (Platform.OS === 'web') webStorage.set(null);
    else await SecureStore.deleteItemAsync(KEY);
}

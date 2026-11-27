import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Small, non-secret settings kept on this device (e.g. the game's lamp switch). Uses
// SecureStore, which the app already has for the auth token (see authToken.ts); web falls back
// to localStorage. Failures are swallowed: a setting that isn't saved just isn't remembered.
const PREFIX = 'dutch-pub.setting.';

export async function getDeviceSetting(name: string): Promise<string | null> {
    const key = PREFIX + name;
    try {
        if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
        return (await SecureStore.getItemAsync(key)) ?? null;
    } catch {
        return null;
    }
}

export async function setDeviceSetting(name: string, value: string): Promise<void> {
    const key = PREFIX + name;
    try {
        if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
        else await SecureStore.setItemAsync(key, value);
    } catch {
        // Storage unavailable: the setting is kept for this session only.
    }
}

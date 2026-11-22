import { useSyncExternalStore } from 'react';
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * This app's version (app.json `version`), sent with every request and socket connection. The
 * server refuses versions older than its MIN_APP_VERSION (backend/src/appVersion.js); the app then
 * shows <UpdateRequired>. Raise `version` in app.json for every store release.
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const ANDROID_PACKAGE = Constants.expoConfig?.android?.package ?? 'hu.dutchpub.app';

/**
 * Where to send an outdated app, first choice first: Android the Play Store app, then its web page;
 * iOS the App Store page once it exists (EXPO_PUBLIC_IOS_STORE_URL). Empty: none known.
 */
export function storeLinks(os: string, androidPackage: string, iosStoreUrl?: string): string[] {
    if (os === 'ios') return iosStoreUrl ? [iosStoreUrl] : [];
    return [`market://details?id=${androidPackage}`, `https://play.google.com/store/apps/details?id=${androidPackage}`];
}

const STORE_LINKS = storeLinks(Platform.OS, ANDROID_PACKAGE, process.env.EXPO_PUBLIC_IOS_STORE_URL);
export const HAS_STORE = STORE_LINKS.length > 0;

/** Opens the store page (the next link when one fails, e.g. no Play Store app on an emulator). */
export async function openStore(): Promise<void> {
    for (const link of STORE_LINKS) {
        try {
            await Linking.openURL(link);
            return;
        } catch {
            // Try the next one.
        }
    }
}

// Once the server says "too old" it stays so until the app is updated (a new process).
let updateRequired = false;
const listeners = new Set<() => void>();

/** The server refused this version (REST 426 or the socket's "update required"). */
export function setUpdateRequired(): void {
    if (updateRequired) return;
    updateRequired = true;
    listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** Whether this version must be updated before anything works. */
export function useUpdateRequired(): boolean {
    return useSyncExternalStore(subscribe, () => updateRequired);
}

/** For `createApi`: send the version, report a 426. */
export const versionOptions = { appVersion: APP_VERSION, onUpdateRequired: setUpdateRequired };

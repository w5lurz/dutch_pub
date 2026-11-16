import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

const { OrientationLock } = ScreenOrientation;

/**
 * Locks the screen orientation, ignoring failures: on web the browser usually refuses
 * (needs fullscreen), an iPad in split view cannot lock, and iOS 27+ resizable windows may
 * treat it as a preference. Layouts must cope with either orientation anyway.
 */
export function lockOrientation(lock: ScreenOrientation.OrientationLock): void {
    if (Platform.OS === 'web') return;
    try {
        ScreenOrientation.lockAsync(lock).catch(() => {});
    } catch {
        // Synchronous native errors: same as a rejected promise.
    }
}

/**
 * The app's resting orientation: portrait, upright. (`PORTRAIT` would also allow upside
 * down, and is rejected on devices that don't support that, e.g. most iPhones.)
 */
export function lockPortrait(): void {
    lockOrientation(OrientationLock.PORTRAIT_UP);
}

/** Landscape (either side) while the calling screen is focused; back to portrait on blur / unmount. */
export function useLandscapeWhileFocused(): void {
    useFocusEffect(
        useCallback(() => {
            lockOrientation(OrientationLock.LANDSCAPE);
            return lockPortrait;
        }, []),
    );
}

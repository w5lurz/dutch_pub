import { useCallback } from 'react';
import { Dimensions, Platform } from 'react-native';
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
 * A tablet: the screen's shorter side is at least 600 dp (Android's "large screen"). Tablets
 * turn freely on every screen: they are held either way, iPad apps are expected to support every
 * orientation, and Android 16 ignores orientation locks on large screens anyway.
 */
export const isTablet = () => {
    const { width, height } = Dimensions.get('screen');
    return Math.min(width, height) >= 600;
};

/**
 * The app's resting orientation: portrait, upright on phones (`PORTRAIT` would also allow
 * upside down, and is rejected on devices that don't support that, e.g. most iPhones); any
 * orientation on tablets (`isTablet`).
 */
export function lockPortrait(): void {
    if (isTablet()) unlockOrientation();
    else lockOrientation(OrientationLock.PORTRAIT_UP);
}

/** Lets the screen follow the device (any orientation), ignoring failures like `lockOrientation`. */
export function unlockOrientation(): void {
    if (Platform.OS === 'web') return;
    try {
        ScreenOrientation.unlockAsync().catch(() => {});
    } catch {
        // Synchronous native errors: same as a rejected promise.
    }
}

/**
 * Any orientation while the calling screen is focused (the game table: turning the phone
 * switches between the portrait and the wide layout); back to portrait on blur / unmount.
 */
export function useAnyOrientationWhileFocused(): void {
    useFocusEffect(
        useCallback(() => {
            unlockOrientation();
            return lockPortrait;
        }, []),
    );
}

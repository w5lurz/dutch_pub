import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import { api } from './api';
import { getDeviceSetting, setDeviceSetting } from './deviceSettings';

// "Your turn" push notifications. The server sends one when a player's turn starts while their
// app is in the background or closed (the app tells it with `app-state`). This module asks for
// the permission, gets this phone's Expo push token and gives it to the server; a
// "Notifications" switch on the Account tab turns them off on this phone.

/** Android notification channel the server sends to (backend/src/push.js). */
const CHANNEL_ID = 'turn';
const SETTING = 'notifications';

let on = true;
/** This phone's push token, once the server has it (to forget it when logging out). */
let registeredToken: string | null = null;
const listeners = new Set<() => void>();

// In the app the game shows the turn itself: no banner, no sound.
Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
});

/** On app start: the Android channel, and whether this phone has notifications turned off. */
export async function initNotifications(): Promise<void> {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Your turn',
            description: 'When it is your turn and Dutch Pub is in the background',
            importance: AndroidImportance.HIGH,
        }).catch(() => {});
    }
    on = (await getDeviceSetting(SETTING)) !== 'off';
    listeners.forEach(listener => listener());
}

/**
 * Gives this phone's push token to the server for the logged-in user. Asks for the permission
 * only with `ask` (when a game starts, so the question makes sense); otherwise only if it was
 * already given. Never throws: without notifications the game works as before.
 */
export async function registerForPush({ ask = false } = {}): Promise<void> {
    if (!on || Platform.OS === 'web') return;
    try {
        let { status, canAskAgain } = await Notifications.getPermissionsAsync();
        if (status !== 'granted' && ask && canAskAgain) ({ status } = await Notifications.requestPermissionsAsync());
        if (status !== 'granted') return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        const res = await api.setPushToken(token);
        if (res.ok) registeredToken = token;
    } catch {
        // No push service (e.g. no Firebase setup in this build, an emulator without Google Play): no notifications.
    }
}

/** This phone gets no more notifications (logging out, the session ended, the switch turned off). Best effort. */
export async function forgetPush(): Promise<void> {
    const token = registeredToken;
    registeredToken = null;
    if (token) await api.deletePushToken(token).catch(() => {});
}

/** The app is open again: its "your turn" notifications are old news. */
export function clearNotifications(): void {
    if (Platform.OS === 'web') return;
    Notifications.dismissAllNotificationsAsync().catch(() => {});
}

/** Turns the notifications on or off on this phone (remembered). */
export function setNotificationsOn(value: boolean): void {
    on = value;
    setDeviceSetting(SETTING, value ? 'on' : 'off');
    listeners.forEach(listener => listener());
    if (value) registerForPush({ ask: true });
    else forgetPush();
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** Whether notifications are on (re-renders when the switch changes). */
export function useNotificationsOn(): boolean {
    return useSyncExternalStore(subscribe, () => on);
}

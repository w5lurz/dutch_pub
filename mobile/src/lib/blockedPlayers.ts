import { useSyncExternalStore } from 'react';

import { getDeviceSetting, setDeviceSetting } from './deviceSettings';

// Players blocked on this phone: their chat messages and emotions aren't shown. Kept on the
// device (deviceSettings), not on the server: blocking is about what you see, nobody is told.
const SETTING = 'blocked-players';

let blocked: readonly string[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach(listener => listener());

/** Reads the saved list once (the app start, or the first screen that needs it). */
export async function loadBlockedPlayers(): Promise<void> {
    if (loaded) return;
    loaded = true;
    try {
        const saved = JSON.parse((await getDeviceSetting(SETTING)) ?? '[]');
        if (Array.isArray(saved)) {
            // Blocked meanwhile (before the list was read) stays blocked too.
            blocked = [...new Set([...saved.filter((name): name is string => typeof name === 'string'), ...blocked])];
            changed();
        }
    } catch {
        // A damaged setting: start with nobody blocked.
    }
}

const save = (next: readonly string[]) => {
    blocked = next;
    changed();
    void setDeviceSetting(SETTING, JSON.stringify(next));
};

export const isBlocked = (username: string) => blocked.includes(username);

export function blockPlayer(username: string) {
    if (!isBlocked(username)) save([...blocked, username]);
}

export function unblockPlayer(username: string) {
    if (isBlocked(username)) save(blocked.filter(name => name !== username));
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    void loadBlockedPlayers();
    return () => {
        listeners.delete(listener);
    };
};

/** The players blocked on this phone (updates when someone is blocked or unblocked). */
export function useBlockedPlayers(): readonly string[] {
    return useSyncExternalStore(subscribe, () => blocked);
}

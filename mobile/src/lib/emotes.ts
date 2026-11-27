import { useSyncExternalStore } from 'react';
import type { Emote, EmoteSent } from '@dutch-pub/shared';

/** How long an emotion's bubble stays above a player's name. */
export const EMOTE_MS = 3000;

/** The emotion shown above a player's name; `key` changes with every new one (restarts the bubble). */
export type ShownEmote = { emote: Emote; key: number };

let shown: Record<string, ShownEmote> = {};
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
let counter = 0;

const changed = () => listeners.forEach(listener => listener());

/** Shows `emote` above `username`'s name for `EMOTE_MS` (a newer one from them replaces it). From `emote-sent`. */
export function showEmote({ username, emote }: EmoteSent) {
    counter += 1;
    shown = { ...shown, [username]: { emote, key: counter } };
    clearTimeout(timers.get(username));
    timers.set(
        username,
        setTimeout(() => {
            timers.delete(username);
            const { [username]: _gone, ...rest } = shown;
            shown = rest;
            changed();
        }, EMOTE_MS),
    );
    changed();
}

/** Clears every bubble (a new game, leaving the table). */
export function clearEmotes() {
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    shown = {};
    changed();
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** The emotions shown right now, by username. */
export function useEmotes(): Record<string, ShownEmote> {
    return useSyncExternalStore(subscribe, () => shown);
}

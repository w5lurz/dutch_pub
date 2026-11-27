import { useSyncExternalStore } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { getDeviceSetting, setDeviceSetting } from './deviceSettings';

// The game's sound effects (synthesised by scripts/make-sounds.mjs). Short clips, mixed with
// whatever else plays on the phone (music keeps playing) and silent when the phone is on
// silent / vibrate. A "Sounds" switch on the Account tab turns them off on this device.

const SOURCES = {
    lay: require('../../assets/sounds/lay.wav'),
    invalid: require('../../assets/sounds/invalid.wav'),
    pickup: require('../../assets/sounds/pickup.wav'),
    burn: require('../../assets/sounds/burn.wav'),
    win: require('../../assets/sounds/win.wav'),
    call: require('../../assets/sounds/call.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const SETTING = 'sounds';
let on = true;
const listeners = new Set<() => void>();
const players: Partial<Record<SoundName, AudioPlayer>> = {};

/** On app start: the audio mode, and whether this device has sounds turned off. */
export async function initSounds(): Promise<void> {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    on = (await getDeviceSetting(SETTING)) !== 'off';
    listeners.forEach(listener => listener());
}

/** Plays sound `name` from the start (unless sounds are off). Never throws: a sound is only a nicety. */
export function playSound(name: SoundName): void {
    if (!on) return;
    try {
        const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
        player.seekTo(0).catch(() => {});
        player.play();
    } catch {
        // No audio (e.g. a web browser that blocks it before a tap): stay quiet.
    }
}

/** Turns the sounds on or off on this device (remembered). */
export function setSoundsOn(value: boolean): void {
    on = value;
    setDeviceSetting(SETTING, value ? 'on' : 'off');
    listeners.forEach(listener => listener());
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** Whether sounds are on (re-renders when the switch changes). */
export function useSoundsOn(): boolean {
    return useSyncExternalStore(subscribe, () => on);
}

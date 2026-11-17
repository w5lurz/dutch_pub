// Per-room options chosen by the room owner. Rooms live in server memory, so adding a
// setting means: add it to `RoomSettings`, `DEFAULT_ROOM_SETTINGS` and `SETTING_VALIDATORS`.

import type { CardBackColor, RoomSettings } from './types';

export const CARD_BACK_COLORS: readonly CardBackColor[] = ['red', 'blue'];

export const DEFAULT_ROOM_SETTINGS: Readonly<RoomSettings> = Object.freeze({
    showCardPowers: true,
    cardBack: 'red',
});

/** Whether a value is valid for each known setting. */
const SETTING_VALIDATORS: { [K in keyof RoomSettings]: (value: unknown) => value is RoomSettings[K] } = {
    showCardPowers: (value): value is boolean => typeof value === 'boolean',
    cardBack: (value): value is CardBackColor => CARD_BACK_COLORS.includes(value as CardBackColor),
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Turns untrusted input (e.g. from a socket event) into valid `RoomSettings`: unknown keys
 * are dropped, missing keys or invalid values fall back to `base` (the defaults unless
 * given, e.g. a room's current settings for a partial update).
 */
export function normalizeRoomSettings(input: unknown, base: RoomSettings = DEFAULT_ROOM_SETTINGS): RoomSettings {
    const source = isObject(input) ? input : {};
    const settings = { ...DEFAULT_ROOM_SETTINGS } as Record<keyof RoomSettings, unknown>;
    (Object.keys(SETTING_VALIDATORS) as Array<keyof RoomSettings>).forEach(key => {
        const valid = SETTING_VALIDATORS[key];
        const value = valid(source[key]) ? source[key] : base?.[key];
        settings[key] = valid(value) ? value : DEFAULT_ROOM_SETTINGS[key];
    });
    return settings as RoomSettings;
}

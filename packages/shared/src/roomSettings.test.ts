import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_SETTINGS, normalizeRoomSettings } from './roomSettings';

describe('normalizeRoomSettings', () => {
    it('shows card powers, red backs and a 30 s turn timer by default', () => {
        expect(DEFAULT_ROOM_SETTINGS).toEqual({ showCardPowers: true, cardBack: 'red', turnTimer: 30 });
    });

    it.each([undefined, null, 42, 'on', [true], () => true])('returns the defaults for %p', input => {
        expect(normalizeRoomSettings(input)).toEqual(DEFAULT_ROOM_SETTINGS);
    });

    it('keeps valid values', () => {
        expect(normalizeRoomSettings({ showCardPowers: false, cardBack: 'blue', turnTimer: 0 })).toEqual({ showCardPowers: false, cardBack: 'blue', turnTimer: 0 });
        expect(normalizeRoomSettings({ turnTimer: 15 }).turnTimer).toBe(15);
        expect(normalizeRoomSettings({ turnTimer: 60 }).turnTimer).toBe(60);
    });

    it('drops unknown keys', () => {
        expect(normalizeRoomSettings({ showCardPowers: false, mirror: true, __proto__x: 1 })).toEqual({
            showCardPowers: false,
            cardBack: 'red',
            turnTimer: 30,
        });
    });

    it('falls back to the default for an invalid value', () => {
        expect(normalizeRoomSettings({ showCardPowers: 'false' })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ showCardPowers: 0 })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ cardBack: 'green' })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ cardBack: 1 })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ turnTimer: 45 })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ turnTimer: '30' })).toEqual(DEFAULT_ROOM_SETTINGS);
    });

    it('fills missing and invalid keys from a given base', () => {
        const base = { showCardPowers: false, cardBack: 'blue', turnTimer: 60 } as const;
        expect(normalizeRoomSettings({}, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: null, cardBack: 'pink' }, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: true }, base)).toEqual({ showCardPowers: true, cardBack: 'blue', turnTimer: 60 });
    });

    it('fills keys missing from an older base (rooms created before a setting existed)', () => {
        expect(normalizeRoomSettings({}, { showCardPowers: false } as never)).toEqual({ showCardPowers: false, cardBack: 'red', turnTimer: 30 });
    });

    it('does not return or mutate the defaults object', () => {
        const settings = normalizeRoomSettings(undefined);
        expect(settings).not.toBe(DEFAULT_ROOM_SETTINGS);
        settings.showCardPowers = false;
        expect(DEFAULT_ROOM_SETTINGS.showCardPowers).toBe(true);
    });
});

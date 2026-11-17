import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_SETTINGS, normalizeRoomSettings } from './roomSettings';

describe('normalizeRoomSettings', () => {
    it('shows card powers and red backs by default', () => {
        expect(DEFAULT_ROOM_SETTINGS).toEqual({ showCardPowers: true, cardBack: 'red' });
    });

    it.each([undefined, null, 42, 'on', [true], () => true])('returns the defaults for %p', input => {
        expect(normalizeRoomSettings(input)).toEqual(DEFAULT_ROOM_SETTINGS);
    });

    it('keeps valid values', () => {
        expect(normalizeRoomSettings({ showCardPowers: false, cardBack: 'blue' })).toEqual({ showCardPowers: false, cardBack: 'blue' });
    });

    it('drops unknown keys', () => {
        expect(normalizeRoomSettings({ showCardPowers: false, turnTimer: 30, __proto__x: 1 })).toEqual({
            showCardPowers: false,
            cardBack: 'red',
        });
    });

    it('falls back to the default for an invalid value', () => {
        expect(normalizeRoomSettings({ showCardPowers: 'false' })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ showCardPowers: 0 })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ cardBack: 'green' })).toEqual(DEFAULT_ROOM_SETTINGS);
        expect(normalizeRoomSettings({ cardBack: 1 })).toEqual(DEFAULT_ROOM_SETTINGS);
    });

    it('fills missing and invalid keys from a given base', () => {
        const base = { showCardPowers: false, cardBack: 'blue' } as const;
        expect(normalizeRoomSettings({}, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: null, cardBack: 'pink' }, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: true }, base)).toEqual({ showCardPowers: true, cardBack: 'blue' });
    });

    it('fills keys missing from an older base (rooms created before a setting existed)', () => {
        expect(normalizeRoomSettings({}, { showCardPowers: false } as never)).toEqual({ showCardPowers: false, cardBack: 'red' });
    });

    it('does not return or mutate the defaults object', () => {
        const settings = normalizeRoomSettings(undefined);
        expect(settings).not.toBe(DEFAULT_ROOM_SETTINGS);
        settings.showCardPowers = false;
        expect(DEFAULT_ROOM_SETTINGS.showCardPowers).toBe(true);
    });
});

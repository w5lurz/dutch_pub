import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_SETTINGS, normalizeRoomSettings } from './roomSettings';
import type { RoomSettings } from './types';

const settings = (changes: Partial<RoomSettings> = {}): RoomSettings => ({ ...DEFAULT_ROOM_SETTINGS, ...changes });

describe('normalizeRoomSettings', () => {
    it('defaults: card powers shown, red backs, 30 s turns, the base rules, auto decks', () => {
        expect(DEFAULT_ROOM_SETTINGS).toEqual({
            showCardPowers: true,
            cardBack: 'red',
            turnTimer: 30,
            nineOnMagic: true,
            sixReverses: false,
            decks: 0,
        });
    });

    it.each([undefined, null, 42, 'on', [true], () => true])('returns the defaults for %p', input => {
        expect(normalizeRoomSettings(input)).toEqual(DEFAULT_ROOM_SETTINGS);
    });

    it('keeps valid values', () => {
        const all = { showCardPowers: false, cardBack: 'blue', turnTimer: 0, nineOnMagic: false, sixReverses: true, decks: 2 } as const;
        expect(normalizeRoomSettings(all)).toEqual(all);
        expect(normalizeRoomSettings({ turnTimer: 15 }).turnTimer).toBe(15);
        expect(normalizeRoomSettings({ turnTimer: 60 }).turnTimer).toBe(60);
        expect(normalizeRoomSettings({ decks: 1 }).decks).toBe(1);
    });

    it('drops unknown keys', () => {
        expect(normalizeRoomSettings({ showCardPowers: false, mirror: true, __proto__x: 1 })).toEqual(settings({ showCardPowers: false }));
    });

    it('falls back to the default for an invalid value', () => {
        for (const invalid of [
            { showCardPowers: 'false' },
            { showCardPowers: 0 },
            { cardBack: 'green' },
            { cardBack: 1 },
            { turnTimer: 45 },
            { turnTimer: '30' },
            { nineOnMagic: 'no' },
            { sixReverses: 1 },
            { decks: 3 },
            { decks: '2' },
        ]) {
            expect(normalizeRoomSettings(invalid)).toEqual(DEFAULT_ROOM_SETTINGS);
        }
    });

    it('fills missing and invalid keys from a given base', () => {
        const base = settings({ showCardPowers: false, cardBack: 'blue', turnTimer: 60, sixReverses: true });
        expect(normalizeRoomSettings({}, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: null, cardBack: 'pink' }, base)).toEqual(base);
        expect(normalizeRoomSettings({ showCardPowers: true }, base)).toEqual({ ...base, showCardPowers: true });
    });

    it('fills keys missing from an older base (rooms created before a setting existed)', () => {
        expect(normalizeRoomSettings({}, { showCardPowers: false } as never)).toEqual(settings({ showCardPowers: false }));
    });

    it('does not return or mutate the defaults object', () => {
        const normalized = normalizeRoomSettings(undefined);
        expect(normalized).not.toBe(DEFAULT_ROOM_SETTINGS);
        normalized.showCardPowers = false;
        expect(DEFAULT_ROOM_SETTINGS.showCardPowers).toBe(true);
    });
});

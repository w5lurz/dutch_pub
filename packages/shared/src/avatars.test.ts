import { describe, expect, it } from 'vitest';
import { AVATAR_BACKGROUNDS, AVATAR_IDS, avatarFor, generatedAvatarId, hashName, isAvatarId } from './avatars';

describe('avatars', () => {
    it('has 16-24 unique presets', () => {
        expect(AVATAR_IDS.length).toBeGreaterThanOrEqual(16);
        expect(AVATAR_IDS.length).toBeLessThanOrEqual(24);
        expect(new Set(AVATAR_IDS).size).toBe(AVATAR_IDS.length);
    });

    it('validates ids', () => {
        expect(isAvatarId('cat')).toBe(true);
        expect(isAvatarId('unicorn')).toBe(false);
        expect(isAvatarId(null)).toBe(false);
        expect(isAvatarId(3)).toBe(false);
        expect(isAvatarId('toString')).toBe(false);
    });

    it('hashes deterministically (pinned values, so every device agrees)', () => {
        expect(hashName('')).toBe(0x811c9dc5);
        expect(hashName('a')).toBe(0xe40c292c);
        expect(hashName('foobar')).toBe(0xbf9cf968);
    });

    it('generates a valid, stable avatar from any name', () => {
        for (const name of ['Tamás', 'Julcsi', 'a', '', 'guest_123', '🙂 emoji', 'x'.repeat(200)]) {
            const look = avatarFor(name);
            expect(isAvatarId(look.id)).toBe(true);
            expect(AVATAR_BACKGROUNDS).toContain(look.background);
            expect(look.generated).toBe(true);
            expect(avatarFor(name)).toEqual(look);
            expect(generatedAvatarId(name)).toBe(look.id);
        }
    });

    it('spreads names over many avatars', () => {
        const ids = new Set(Array.from({ length: 200 }, (_, i) => generatedAvatarId(`player${i}`)));
        expect(ids.size).toBeGreaterThan(AVATAR_IDS.length * 0.75);
    });

    it('prefers a valid chosen avatar and keeps the name-based background', () => {
        expect(avatarFor('anna', 'owl')).toEqual({ id: 'owl', background: avatarFor('anna').background, generated: false });
        expect(avatarFor('anna', 'nope')).toEqual(avatarFor('anna'));
        expect(avatarFor('anna', null)).toEqual(avatarFor('anna'));
    });
});

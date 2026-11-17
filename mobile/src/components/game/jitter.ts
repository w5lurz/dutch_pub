/** A card's small, random-looking but fixed misplacement on a pile: tilt and offset. */
export type Jitter = { rotation: number; dx: number; dy: number };

/**
 * FNV-1a plus murmur3's final mix: a small, fast, deterministic string hash (32-bit). The
 * final mix spreads a change in the last character (e.g. "card-1" vs "card-2") over all bits.
 */
function hash(text: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
}

/** A value in [-1, 1] from the hash, one per `salt`. */
const unit = (key: string, salt: string) => (hash(`${salt}:${key}`) / 0xffffffff) * 2 - 1;

/**
 * How a card lies on a pile: tilted by up to `maxDegrees` and shifted by up to `maxOffset`
 * dp each way. Derived from `key` (e.g. the card plus its place in the pile), so a card keeps
 * the same look on every render and every device instead of jumping around.
 */
export function cardJitter(key: string, maxDegrees: number, maxOffset = 0): Jitter {
    return {
        rotation: Math.round(unit(key, 'r') * maxDegrees * 10) / 10,
        dx: Math.round(unit(key, 'x') * maxOffset),
        dy: Math.round(unit(key, 'y') * maxOffset),
    };
}

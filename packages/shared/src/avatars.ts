// Player avatars. Players may choose one of the presets (saved on the server for registered
// users); everyone else (and every guest) gets one generated from their username. The
// generator is pure and deterministic, so the server and every client agree on it.
// The art lives in the mobile app (mobile/src/components/ui/avatars).

/** The preset avatars, by id. Only append to this list: generated avatars depend on its order. */
export const AVATAR_IDS = [
    'cat',
    'dog',
    'fox',
    'bear',
    'panda',
    'rabbit',
    'mouse',
    'pig',
    'frog',
    'owl',
    'koala',
    'lion',
    'tiger',
    'monkey',
    'penguin',
    'chick',
    'cow',
    'raccoon',
    'hedgehog',
    'sheep',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

/** Background colours behind the avatar (light pastels; fixed, like card faces). Append only. */
export const AVATAR_BACKGROUNDS = [
    '#fde2e4',
    '#fff1c1',
    '#d8f3dc',
    '#cde7f7',
    '#e4dcf7',
    '#ffe0c2',
    '#d3f0ee',
    '#f1e3d3',
] as const;

/** What to draw for a player: the avatar, its background and whether it was generated. */
export type AvatarLook = {
    id: AvatarId;
    background: string;
    /** True when the player has not chosen one (or is a guest). */
    generated: boolean;
};

export const isAvatarId = (value: unknown): value is AvatarId =>
    typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value);

/** 32-bit FNV-1a hash over the string's UTF-16 code units (same result on every JS engine). */
export function hashName(name: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < name.length; i++) {
        hash ^= name.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
}

/** The background for `username` (also behind a chosen avatar, so a player keeps their colour). */
export const avatarBackground = (username: string): string =>
    AVATAR_BACKGROUNDS[(hashName(username) >>> 16) % AVATAR_BACKGROUNDS.length];

/** The avatar generated from `username`: same name, same avatar, on every device. */
export const generatedAvatarId = (username: string): AvatarId => AVATAR_IDS[hashName(username) % AVATAR_IDS.length];

/**
 * The display rule everywhere: the chosen avatar if it is a known id, otherwise the one
 * generated from the username.
 */
export function avatarFor(username: string, chosen?: string | null): AvatarLook {
    const background = avatarBackground(username);
    if (isAvatarId(chosen)) return { id: chosen, background, generated: false };
    return { id: generatedAvatarId(username), background, generated: true };
}

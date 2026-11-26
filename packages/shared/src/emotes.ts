/** The emotions a player can show at the table (tap your own avatar or name). */
export const EMOTES = ['hello', 'angry', 'relieved', 'thumbsUp'] as const;

export type Emote = (typeof EMOTES)[number];

/** A player showed an emotion (broadcast to the room's players, not stored). */
export type EmoteSent = { username: string; emote: Emote };

export const isEmote = (value: unknown): value is Emote => typeof value === 'string' && (EMOTES as readonly string[]).includes(value);

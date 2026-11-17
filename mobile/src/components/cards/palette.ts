import type { CourtColor } from './art/courts.generated';

/** Card art colours. Fixed (no dark mode): card faces stay light, like real cards. */
export const CARD_COLORS = {
    face: '#ffffff',
    edge: '#b8bcc4',
    red: '#d4122b',
    black: '#141414',
    /** Court figure colours (the Goodall & Son palette of the RevK deck, red / black as above). */
    blue: '#3d4fd1',
    gold: '#f8c43c',
    white: '#ffffff',
} as const;

export const courtColor = (color: CourtColor) => CARD_COLORS[color];

/** Card backs. */
export const BACK_COLORS = {
    red: { field: '#a3162a', line: '#f3c7cd' },
    blue: { field: '#1f3f8f', line: '#c9d6f5' },
} as const;

export type CardBackColor = keyof typeof BACK_COLORS;

/** Ink of the special-card stamp. */
export const STAMP_INK = '#1d3a9e';

/** The art's viewBox: a 240 x 336 card centred on 0,0 (aspect 1.4, as `CARD_ASPECT`). */
export const CARD_VIEWBOX = '-120 -168 240 336';

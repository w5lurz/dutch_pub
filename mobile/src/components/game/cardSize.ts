import { useWindowDimensions } from 'react-native';

export type CardSize = 'sm' | 'md' | 'lg';

/** Size relative to 'md'. */
const SCALE: Record<CardSize, number> = { sm: 0.6, md: 1, lg: 1.15 };

/** Height / width of a playing card (the web uses w-20 h-28). */
export const CARD_ASPECT = 1.4;

/** Horizontal gap between cards in a row (matches `gap-1.5`). */
export const CARD_GAP = 6;

/** Share of the window height an 'md' card takes (the game screen is landscape). */
const MD_HEIGHT_OF_WINDOW = 0.24;
/** Cap from the window width, so a (briefly) portrait window still gets sane cards. */
const MD_HEIGHT_OF_WIDTH = 0.18;
const MD_MIN_HEIGHT = 56;
const MD_MAX_HEIGHT = 132;

/**
 * Height of an 'md' card for a window: ~24% of the window height (86dp on a 780x360dp
 * landscape phone), but at most 18% of the width (so 65dp while a 360x780dp phone is still
 * portrait mid-rotation), clamped to 56-132dp (tablets stop at 132dp).
 */
export function baseCardHeight(window: { width: number; height: number }): number {
    const fit = Math.min(window.height * MD_HEIGHT_OF_WINDOW, window.width * MD_HEIGHT_OF_WIDTH);
    return Math.max(MD_MIN_HEIGHT, Math.min(MD_MAX_HEIGHT, Math.floor(fit)));
}

export function cardDimensions(window: { width: number; height: number }, size: CardSize) {
    const height = Math.round(baseCardHeight(window) * SCALE[size]);
    return { width: Math.round(height / CARD_ASPECT), height };
}

/** Card width / height for `size`, scaled from the window (mainly its height). */
export function useCardSize(size: CardSize = 'md') {
    const { width, height } = useWindowDimensions();
    return cardDimensions({ width, height }, size);
}

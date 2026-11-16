import { useWindowDimensions } from 'react-native';

export type CardSize = 'sm' | 'md' | 'lg';

/** Width relative to 'md'. */
const SCALE: Record<CardSize, number> = { sm: 0.62, md: 1, lg: 1.15 };

/** Height / width of a playing card (the web uses w-20 h-28). */
export const CARD_ASPECT = 1.4;

/** Horizontal gap between cards in a row (matches `gap-1.5`). */
export const CARD_GAP = 6;

/**
 * Width of an 'md' card for a screen width: about 5 cards (plus gaps and a 16dp gutter on
 * each side) fit across, so ~60dp on a 360dp phone. Capped at the web's 80dp-ish size on
 * wide screens, and never smaller than 44dp.
 */
export function baseCardWidth(screenWidth: number): number {
    return Math.max(44, Math.min(84, Math.floor((screenWidth - 32 - 4 * CARD_GAP) / 5)));
}

export function cardDimensions(screenWidth: number, size: CardSize) {
    const width = Math.round(baseCardWidth(screenWidth) * SCALE[size]);
    return { width, height: Math.round(width * CARD_ASPECT) };
}

/** Card width / height for `size`, scaled from the window width. */
export function useCardSize(size: CardSize = 'md') {
    const { width } = useWindowDimensions();
    return cardDimensions(width, size);
}

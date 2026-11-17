import { useWindowDimensions } from 'react-native';

export type CardSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

/**
 * Size relative to 'md'. At 360dp portrait (md 63dp wide): your hand md, the centre piles
 * lg (~69dp), your table stacks sm (~50dp), opponents' stacks xs (~35dp), the side seats'
 * stacks and opponents' hand fans xxs (~25dp).
 */
const SCALE: Record<CardSize, number> = { xxs: 0.4, xs: 0.56, sm: 0.8, md: 1, lg: 1.1 };

/** Height / width of a playing card (the web uses w-20 h-28). */
export const CARD_ASPECT = 1.4;

/** Horizontal gap between cards in a row (matches `gap-1.5`). */
export const CARD_GAP = 6;

/** The two game table layouts: a tall window (phones upright) or a wide one (tablets, desktop, phones turned). */
export type TableLayout = 'portrait' | 'wide';

type WindowSize = { width: number; height: number };

/** Wide when the window is more than 1.2 times as wide as it is tall (by aspect ratio, not platform). */
export function tableLayout(window: WindowSize): TableLayout {
    return window.width > window.height * 1.2 ? 'wide' : 'portrait';
}

/** Portrait: an 'md' card is 17.5% of the window width (63dp wide on a 360dp phone)... */
const MD_WIDTH_OF_WIDTH = 0.175;
/** ...but at most 14% of the height tall (keeps tablets and short windows in check). */
const MD_HEIGHT_OF_HEIGHT_PORTRAIT = 0.14;
/** Wide: an 'md' card is 23% of the window height tall (90dp on a 390dp tall phone turned sideways; your hand uses 'lg'). */
const MD_HEIGHT_OF_HEIGHT_WIDE = 0.23;
const MD_MIN_HEIGHT = 56;
const MD_MAX_HEIGHT = 132;

/**
 * Height of an 'md' card for a window, clamped to 56-132dp (tablets and the desktop stop
 * at 132dp). Portrait: from the width (88dp on a 360dp phone), capped by the height.
 * Wide: from the height.
 */
export function baseCardHeight(window: WindowSize): number {
    const fit =
        tableLayout(window) === 'wide'
            ? window.height * MD_HEIGHT_OF_HEIGHT_WIDE
            : Math.min(window.width * MD_WIDTH_OF_WIDTH * CARD_ASPECT, window.height * MD_HEIGHT_OF_HEIGHT_PORTRAIT);
    return Math.max(MD_MIN_HEIGHT, Math.min(MD_MAX_HEIGHT, Math.floor(fit)));
}

export function cardDimensions(window: WindowSize, size: CardSize) {
    const height = Math.round(baseCardHeight(window) * SCALE[size]);
    return { width: Math.round(height / CARD_ASPECT), height };
}

/** Card width / height for `size`, scaled from the window (see `baseCardHeight`). */
export function useCardSize(size: CardSize = 'md') {
    const { width, height } = useWindowDimensions();
    return cardDimensions({ width, height }, size);
}

/** The table layout for the current window. */
export function useTableLayout(): TableLayout {
    const { width, height } = useWindowDimensions();
    return tableLayout({ width, height });
}

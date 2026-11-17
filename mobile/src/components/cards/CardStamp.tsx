import { StyleSheet, Text, View } from 'react-native';
import { isSpecialCard, type TCard } from '@dutch-pub/shared';

import { STAMP_INK } from './palette';

/** Short forms for small cards, by the full (upper-case) stamp text. */
const SHORT_STAMPS: Record<string, string> = {
    'CLEAR ALL': 'CLEAR',
    MIRROR: 'MIRROR',
    'YOU LOSE': 'LOSE',
    'START OVER': 'RESET',
    'CALL NEXT': 'CALL',
};

/** Card width (dp) from which the full text is stamped; below it the short form. */
const FULL_FROM_WIDTH = 56;
/** Below this width there is no stamp at all (the index has to stay readable). */
const SHORT_FROM_WIDTH = 36;

/** The stamp text for a special card ("CLEAR ALL"), `null` for ordinary cards. */
export function stampText(card: Pick<TCard, 'name' | 'isMagicCard' | 'isTeaseCard'>): string | null {
    return isSpecialCard(card) ? card.name.toUpperCase() : null;
}

export function shortStampText(text: string): string {
    return SHORT_STAMPS[text] ?? text.split(' ')[0];
}

export type CardStampProps = {
    /** Full stamp text, e.g. "CLEAR ALL" (see `stampText`). */
    text: string;
    cardWidth: number;
    cardHeight: number;
    /** Hides the stamp (the room setting "Show card powers" will drive this). */
    hidden?: boolean;
    /** `auto` (default): full text on wide cards, short form on small ones, nothing on the smallest. */
    form?: 'auto' | 'full' | 'short';
};

/**
 * An ink-stamp label across the lower half of a card: upper-case text in a rounded frame,
 * slightly rotated and translucent, like a rubber stamp on the printed face. Purely decorative:
 * hidden from screen readers (the card's own label names it).
 */
export function CardStamp({ text, cardWidth, cardHeight, hidden = false, form = 'auto' }: CardStampProps) {
    if (hidden) return null;
    const useShort = form === 'short' || (form === 'auto' && cardWidth < FULL_FROM_WIDTH);
    if (form === 'auto' && cardWidth < SHORT_FROM_WIDTH) return null;
    const label = useShort ? shortStampText(text) : text;
    // Longest word decides the font size, so "START OVER" wraps into two lines that still fit.
    const longest = Math.max(...label.split(' ').map(word => word.length));
    const fontSize = Math.max(6, Math.min(cardWidth * 0.17, (cardWidth * 0.78) / (longest * 0.72)));
    const border = Math.max(1, Math.round(cardWidth * 0.022));

    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="card-stamp"
            style={[styles.area, { top: cardHeight * 0.5, height: cardHeight * 0.42 }]}
        >
            <View
                style={[
                    styles.frame,
                    {
                        borderWidth: border,
                        borderRadius: border * 2.5,
                        paddingHorizontal: fontSize * 0.3,
                        paddingVertical: fontSize * 0.1,
                    },
                ]}
            >
                <Text
                    style={[styles.text, { fontSize, lineHeight: fontSize * 1.05, letterSpacing: fontSize * 0.06 }]}
                    numberOfLines={2}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    area: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    frame: {
        borderColor: STAMP_INK,
        backgroundColor: 'rgba(255,255,255,0.35)',
        opacity: 0.82,
        transform: [{ rotate: '-14deg' }],
        maxWidth: '96%',
    },
    text: {
        color: STAMP_INK,
        fontWeight: '900',
        textAlign: 'center',
    },
});

export default CardStamp;

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { TCard } from '@dutch-pub/shared';

import { CardBackArt, CardFaceArt } from '@/components/cards';

import { useCardSize, type CardSize } from './cardSize';
import { useCardSettings } from './cardSettings';
import { useTableTheme } from './tableTheme';

export type PlayingCardProps = {
    /** The card to show face up. Omit (or pass `faceDown`) for the back side. */
    card?: TCard | null;
    /** Show the back side even if `card` is set. */
    faceDown?: boolean;
    size?: CardSize;
    /** Makes the card pressable. Without it the card is a plain, non-interactive image. */
    onPress?: () => void;
    /** Pressable but not pressable right now (no feedback, `disabled` for screen readers). */
    disabled?: boolean;
    /** Strongly faded, e.g. a card that cannot be laid on the current pile. */
    dimmed?: boolean;
    /** Lightly faded, e.g. table cards that cannot be played yet. */
    faded?: boolean;
    /** Blue outline (e.g. the top card of a pile). */
    selected?: boolean;
    /** "+N" overlay for a stack of face-down cards (shown when > 0). */
    plusCount?: number;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    /** Only decoration (cards under a pile's top card, the deck's edges): hidden from screen readers. */
    decorative?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** A soft shadow under every card, so cards lie on the table (and on each other) instead of floating flat. */
const CARD_SHADOW = '0px 1px 3px rgba(0, 0, 0, 0.3)';

/** "7 of hearts", "Mirror (0) of clubs". */
export function cardLabel(card: TCard): string {
    const name = card.name === String(card.value) ? card.name : `${card.name} (${card.value})`;
    return `${name} of ${card.color}`;
}

/** The French-suited face (RevK deck): full face on big cards, a compact index on small ones. */
function CardFace({ card, width, height }: { card: TCard; width: number; height: number }) {
    const { showCardPowers } = useCardSettings();
    return <CardFaceArt card={card} width={width} height={height} showStamp={showCardPowers} />;
}

/** The back in the room's colour, with an optional "+N" overlay. */
function CardBack({ width, height, plusCount }: { width: number; height: number; plusCount: number }) {
    const { cardBack } = useCardSettings();
    return (
        <View className="flex-1 overflow-hidden rounded-md">
            <CardBackArt width={width} height={height} color={cardBack} />
            {plusCount > 0 ? (
                <View className="absolute inset-0 items-center justify-center">
                    <View className="rounded-full bg-gray-900/75 px-2 py-0.5">
                        <Text style={{ fontSize: Math.max(11, Math.round(width * 0.22)) }} className="font-bold text-white">
                            +{plusCount}
                        </Text>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

/**
 * A playing card: a French-suited face (`CardFaceArt`, with a stamp on special cards when
 * the room shows card powers) or the back in the room's colour (`CardBackArt`, with an
 * optional "+N" overlay); see `CardSettingsProvider`. Its size is scaled from the
 * window (see `useCardSize`). Pressable cards lift and get a blue outline while pressed.
 */
export function PlayingCard({
    card,
    faceDown = false,
    size = 'md',
    onPress,
    disabled = false,
    dimmed = false,
    faded = false,
    selected = false,
    plusCount = 0,
    accessibilityLabel,
    accessibilityHint,
    decorative = false,
    style,
    testID,
}: PlayingCardProps) {
    const { width, height } = useCardSize(size);
    const { fadeColor } = useTableTheme();
    const [pressed, setPressed] = useState(false);
    const showFace = !!card && !faceDown;
    const label =
        accessibilityLabel ??
        (showFace ? cardLabel(card) : plusCount > 0 ? `Face-down card, ${plusCount} more below` : 'Face-down card');

    const face = showFace ? (
        // Both inside the 2dp outline on each side.
        <CardFace card={card} width={width - 4} height={height - 4} />
    ) : (
        <CardBack width={width - 4} height={height - 4} plusCount={plusCount} />
    );
    // Fading is an overlay in the table theme's fade colour, not `opacity`: a see-through card would show the card
    // below it (table stacks, overlapping hand), and Android applies a parent's opacity to
    // each child separately.
    const fadeAlpha = dimmed ? 0.6 : faded ? 0.3 : 0;
    const content = (
        // The shadow sits on the card itself (inside the selection outline).
        <View style={{ flex: 1, borderRadius: 7, boxShadow: CARD_SHADOW }}>
            {face}
            {fadeAlpha > 0 ? (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { borderRadius: 6, backgroundColor: fadeColor, opacity: fadeAlpha }]}
                />
            ) : null}
        </View>
    );
    const baseStyle: ViewStyle = {
        width,
        height,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: selected ? '#2563eb' : 'transparent', // blue-600
    };

    if (decorative) {
        return (
            <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[baseStyle, style]}
                testID={testID}
            >
                {content}
            </View>
        );
    }

    if (!onPress) {
        return (
            <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={label}
                style={[baseStyle, style]}
                testID={testID}
            >
                {content}
            </View>
        );
    }

    // Pressed state is tracked manually: NativeWind wraps Pressable and drops a *function*
    // `style` (`({ pressed }) => ...`), which lost the card's width/height and collapsed it.
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            hitSlop={4}
            testID={testID}
            style={[
                baseStyle,
                pressed && !disabled && { transform: [{ translateY: -6 }], borderColor: '#3b82f6' }, // blue-500
                style,
            ]}
        >
            {content}
        </Pressable>
    );
}

/** A dashed outline where a card would go (empty deck / pile). */
export function EmptyCardSlot({ size = 'md', label }: { size?: CardSize; label: string }) {
    const { width, height } = useCardSize(size);
    return (
        <View
            accessible
            accessibilityLabel={label}
            style={{ width, height }}
            className="items-center justify-center rounded-md border-2 border-dashed border-gray-300"
        >
            <Text className="text-xs text-gray-400">Empty</Text>
        </View>
    );
}

export default PlayingCard;

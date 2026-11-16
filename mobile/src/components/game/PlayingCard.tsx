import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { TCard } from '@dutch-pub/shared';

import { CardBackSide, CardIcon } from '@/components/icons';
import { useTheme } from '@/lib/theme';

import { useCardSize, type CardSize } from './cardSize';

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
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

/** "7 of hearts", "Mirror (0) of clubs". */
export function cardLabel(card: TCard): string {
    const name = card.name === String(card.value) ? card.name : `${card.name} (${card.value})`;
    return `${name} of ${card.color}`;
}

function CardFace({ card, width, size }: { card: TCard; width: number; size: CardSize }) {
    const red = RED_SUITS.has(card.color);
    // Fixed card-* colours: card faces stay light in dark mode, like real cards.
    const textColor = red ? 'text-card-red' : 'text-card-black';
    // Number cards' name is just the value; show the name for J / Q / K and the special cards.
    const compact = size === 'sm' || size === 'xs';
    const showName = !compact && card.name !== String(card.value);

    return (
        <View
            className={`flex-1 items-center rounded-md border border-card-border bg-card-face shadow-sm ${
                compact ? 'justify-center gap-0.5 p-0.5' : 'justify-between p-1'
            }`}
        >
            <Text style={{ fontSize: Math.max(10, Math.round(width * 0.24)) }} className={`font-bold ${textColor}`}>
                {card.value}
            </Text>
            <CardIcon suit={card.color} size={Math.round(width * (compact ? 0.42 : 0.34))} />
            {showName ? (
                <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{ fontSize: Math.max(8, Math.round(width * 0.15)) }}
                    className={`text-center font-medium ${textColor}`}
                >
                    {card.name}
                </Text>
            ) : compact ? null : (
                // Keeps value + icon at the same height as on named cards.
                <View style={{ height: Math.max(8, Math.round(width * 0.15)) }} />
            )}
        </View>
    );
}

function CardBack({ width, height, plusCount }: { width: number; height: number; plusCount: number }) {
    return (
        <View className="flex-1 overflow-hidden rounded-md">
            <CardBackSide width={width} height={height} />
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
 * A playing card, face up (value, suit icon, name; red suits red, as the web `Card`) or
 * face down (`CardBackSide`, with an optional "+N" overlay). Its size is scaled from the
 * window (mainly its height, see `useCardSize`). Pressable cards lift and get a blue outline while pressed.
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
    style,
    testID,
}: PlayingCardProps) {
    const { width, height } = useCardSize(size);
    const { background } = useTheme();
    const [pressed, setPressed] = useState(false);
    const showFace = !!card && !faceDown;
    const label =
        accessibilityLabel ??
        (showFace ? cardLabel(card) : plusCount > 0 ? `Face-down card, ${plusCount} more below` : 'Face-down card');

    const face = showFace ? (
        <CardFace card={card} width={width} size={size} />
    ) : (
        // Inside the 2dp outline on each side.
        <CardBack width={width - 4} height={height - 4} plusCount={plusCount} />
    );
    // Fading is an overlay in the screen's background colour, not `opacity`: a see-through card would show the card
    // below it (table stacks, overlapping hand), and Android applies a parent's opacity to
    // each child separately.
    const fadeAlpha = dimmed ? 0.6 : faded ? 0.3 : 0;
    const content =
        fadeAlpha > 0 ? (
            <>
                {face}
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { borderRadius: 6, backgroundColor: background, opacity: fadeAlpha }]}
                />
            </>
        ) : (
            face
        );
    const baseStyle: ViewStyle = {
        width,
        height,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: selected ? '#2563eb' : 'transparent', // blue-600
    };

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

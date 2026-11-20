import { useEffect, useId } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTableTheme } from './tableTheme';

/** How long the lamp takes to come on / go off. */
const LAMP_FADE_MS = 400;
/** Where the lamp shines: above the piles, a little above the middle of the screen. */
const POOL_CENTRE_Y = '45%';

type Stops = readonly { offset: number; color: string; opacity: number }[];

/**
 * The night (UI-PLAN U5): the table photo darkened toward the edges, the grass almost black,
 * with a warm pool of lamp light over the middle.
 */
const NIGHT_TABLE: Stops = [
    { offset: 0, color: '#0a0f1e', opacity: 0.22 },
    { offset: 0.45, color: '#0a0f1e', opacity: 0.4 },
    { offset: 0.8, color: '#05080f', opacity: 0.72 },
    { offset: 1, color: '#020308', opacity: 0.92 },
];
const WARM_POOL: Stops = [
    { offset: 0, color: '#ffc477', opacity: 0.16 },
    { offset: 0.55, color: '#ffb35c', opacity: 0.05 },
    { offset: 1, color: '#ffb35c', opacity: 0 },
];
/**
 * Over the cards: none under the lamp, darker toward the edges (at most 25% where your hand
 * is, so it stays readable), and a faint warm tint on everything in the light.
 */
const CARD_SHADE: Stops = [
    { offset: 0, color: '#05080f', opacity: 0 },
    { offset: 0.4, color: '#05080f', opacity: 0.04 },
    { offset: 0.75, color: '#05080f', opacity: 0.18 },
    { offset: 1, color: '#05080f', opacity: 0.28 },
];
const CARD_WARMTH: Stops = [
    { offset: 0, color: '#ffcf8a', opacity: 0.07 },
    { offset: 0.6, color: '#ffcf8a', opacity: 0.03 },
    { offset: 1, color: '#ffcf8a', opacity: 0 },
];

/**
 * A rectangle per gradient, each an ellipse around the lamp's centre (bounding-box units stretch
 * the circle to the table). Drawn on a 100 × 100 canvas stretched over the table: the view is
 * sized by the layout (no width / height props, no measuring), so when the phone turns Android
 * redraws it at the new size in the same frame as the table photo, and the gradients, being
 * relative to the box, look the same at any size. (Numeric sizes from `onLayout` lagged a frame
 * or more behind, which left part of the table lit for a moment; "100%" props kept the first size.)
 */
// In a browser an <svg> does not stretch to its box by itself (native views do).
const WEB_SIZE = Platform.OS === 'web' ? { width: '100%', height: '100%' } : {};

function Glow({ layers }: { layers: readonly Stops[] }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" {...WEB_SIZE}>
            <Defs>
                {layers.map((stops, i) => (
                    <RadialGradient key={i} id={`${id}-${i}`} cx="50%" cy={POOL_CENTRE_Y} r="72%" fx="50%" fy={POOL_CENTRE_Y}>
                        {stops.map(stop => (
                            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                        ))}
                    </RadialGradient>
                ))}
            </Defs>
            {layers.map((_, i) => (
                <Rect key={i} x={0} y={0} width={100} height={100} fill={`url(#${id}-${i})`} />
            ))}
        </Svg>
    );
}

/** 0 by day, 1 at night, eased over `LAMP_FADE_MS` when the lamp is switched. */
function useNightAmount() {
    const night = useTableTheme().mode === 'night';
    const amount = useSharedValue(night ? 1 : 0);
    useEffect(() => {
        amount.set(withTiming(night ? 1 : 0, { duration: LAMP_FADE_MS }));
    }, [night, amount]);
    return useAnimatedStyle(() => ({ opacity: amount.get() }));
}

/**
 * The lamp at night. `layer="table"` darkens the table photo (put it right after
 * `TableBackground`); `layer="cards"` lies over everything on the table, the dragged card
 * included (put it last), so all cards are lit the same way. Invisible by day; it never takes
 * touches.
 */
export function TableLighting({ layer }: { layer: 'table' | 'cards' }) {
    const style = useNightAmount();
    return (
        <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, style]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID={`table-lighting-${layer}`}
        >
            <Glow layers={layer === 'table' ? [NIGHT_TABLE, WARM_POOL] : [CARD_SHADE, CARD_WARMTH]} />
        </Animated.View>
    );
}

export default TableLighting;

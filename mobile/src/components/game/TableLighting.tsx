import { useEffect, useId, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
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

/** A full-size rectangle per gradient, each an ellipse around the lamp's centre (bounding-box units stretch the circle to the screen). */
function Glow({ layers, width, height }: { layers: readonly Stops[]; width: number; height: number }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
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
                <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#${id}-${i})`} />
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
    // Its own measured size in numbers, not "100%" or the window size: on Android a percentage-sized
    // Svg kept its first size after turning the phone, and the window size leaves out the hidden
    // system bars, which left light strips at the bottom / right edge.
    const window = useWindowDimensions();
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
    const { width, height } = size ?? window;
    return (
        <Animated.View
            onLayout={event => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, style]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID={`table-lighting-${layer}`}
        >
            {/* Keyed by size: redrawn from scratch when the phone turns. */}
            <Glow
                key={`${width}x${height}`}
                layers={layer === 'table' ? [NIGHT_TABLE, WARM_POOL] : [CARD_SHADE, CARD_WARMTH]}
                width={width}
                height={height}
            />
        </Animated.View>
    );
}

export default TableLighting;

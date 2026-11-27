import { useId } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { TableLayout } from './cardSize';

/** The most cans on the table, however long the evening. */
export const MAX_CANS = 8;

/** A green or a blue beer can, or a red cola can. */
export type CanKind = 'green' | 'cola' | 'blue';

/** The order the cans arrive in. */
const KINDS: CanKind[] = ['green', 'cola', 'blue'];

/**
 * The empty cans for `streak` games in a row at this table (`game.streak`): none for the first
 * game, then one can per game (2 games: a green beer and a cola; 3: a blue beer too, and so on
 * round), at most `MAX_CANS`.
 */
export function cansFor(streak: number | undefined): CanKind[] {
    const count = (streak ?? 1) >= 2 ? Math.min(MAX_CANS, streak ?? 0) : 0;
    return Array.from({ length: count }, (_, i) => KINDS[i % KINDS.length]);
}

type Spot = { left?: DimensionValue; right?: DimensionValue; top?: DimensionValue; bottom?: DimensionValue };

/**
 * Where the cans stand, in the order they arrive: the table's free corners and edges, away from the
 * piles in the middle and the ashtray (bottom-left). Cards may lie over them: they are drawn first.
 */
const SPOTS: Record<TableLayout, Spot[]> = {
    portrait: [
        { right: '6%', top: '58%' },
        { right: '18%', top: '63%' },
        { left: '25%', top: '29%' },
        { right: '20%', top: '17%' },
        { left: '20%', top: '18%' },
        { right: '24%', top: '55%' },
        { left: '26%', top: '58%' },
        { right: '25%', top: '31%' },
    ],
    wide: [
        { right: '13%', bottom: '12%' },
        { right: '20%', bottom: '18%' },
        { left: '25%', bottom: '11%' },
        { right: '23%', top: '11%' },
        { left: '23%', top: '13%' },
        { right: '30%', top: '53%' },
        { left: '28%', top: '48%' },
        { left: '10%', top: '25%' },
    ],
};

/** Each kind's body colours (lit middle, shaded sides) and its stripe (a wave on the cola). */
const LOOKS: Record<CanKind, { light: string; dark: string; stripe: string; wave?: boolean }> = {
    green: { light: '#2f9a4e', dark: '#145a2b', stripe: '#e9c84a' },
    blue: { light: '#2f6fd0', dark: '#173d82', stripe: '#f4f6fa' },
    cola: { light: '#e0242f', dark: '#8f0f18', stripe: '#ffffff', wave: true },
};

/**
 * An empty can standing on the table, seen from above like the ashtray and the shot glass, tipped a
 * little towards you (100 x 100 box): the silver lid with its opening and the tab, and below it a
 * band of the body in its colours.
 */
function Can({ kind }: { kind: CanKind }) {
    const id = useId().replace(/:/g, '');
    const look = LOOKS[kind];
    // The lid is an ellipse centred at (50, 38); the body's bottom edge the same ellipse 22 lower.
    return (
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
                <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset={0} stopColor={look.dark} />
                    <Stop offset={0.3} stopColor={look.light} />
                    <Stop offset={0.65} stopColor={look.light} />
                    <Stop offset={1} stopColor={look.dark} />
                </LinearGradient>
                <LinearGradient id={`${id}-lid`} x1="0.2" y1="0" x2="0.8" y2="1">
                    <Stop offset={0} stopColor="#f1f3f6" />
                    <Stop offset={1} stopColor="#aeb4bc" />
                </LinearGradient>
            </Defs>
            {/* Shadow on the table. */}
            <Ellipse cx={56} cy={66} rx={38} ry={30} fill="#000" opacity={0.25} />
            {/* The body below the lid, its stripe and a shine. */}
            <Path d="M14 38 L14 60 A36 28 0 0 0 86 60 L86 38 Z" fill={`url(#${id}-body)`} />
            {look.wave ? (
                <Path d="M14 50 C30 66 42 58 52 64 C62 70 74 62 86 52 L86 58 C74 70 62 78 52 72 C42 66 30 74 14 57 Z" fill={look.stripe} />
            ) : (
                <Path d="M14 52 A36 28 0 0 0 86 52 L86 58 A36 28 0 0 1 14 58 Z" fill={look.stripe} />
            )}
            <Path d="M24 60 A36 28 0 0 0 34 72 L34 66 A36 28 0 0 1 24 56 Z" fill="#ffffff" opacity={0.3} />
            {/* The lid: the rim, the sunken panel, the opening and the tab on its rivet. */}
            <Ellipse cx={50} cy={38} rx={36} ry={28} fill="#9ba1a9" />
            <Ellipse cx={50} cy={39} rx={31} ry={23.5} fill={`url(#${id}-lid)`} stroke="#878d96" strokeWidth={1.2} />
            <Path d="M41 50 Q50 46 59 50 Q60 57 50 59 Q40 57 41 50 Z" fill="#1d2127" />
            <Rect x={42} y={19} width={16} height={26} rx={7} fill="#c3c8cf" stroke="#8a9099" strokeWidth={1} />
            <Ellipse cx={50} cy={27} rx={4.2} ry={4} fill="#8f959e" />
            <Circle cx={50} cy={40} r={2.6} fill="#9ba1a9" />
        </Svg>
    );
}

type TableCansProps = {
    /** Games in a row at this table (`game.streak`). */
    streak?: number;
    layout: TableLayout;
    /** A can's width and height on the screen (its shadow included). */
    size: number;
    /** Varies the way each can is turned, per game. */
    seed?: number;
};

/**
 * Empty cans on the table when the players have played several games in a row (`cansFor`):
 * scattered on the free parts of the table, each turned its own way, fading in. Decoration only:
 * no touches, hidden from screen readers.
 */
export function TableCans({ streak, layout, size, seed = 0 }: TableCansProps) {
    const cans = cansFor(streak);
    if (cans.length === 0) return null;
    return (
        <View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
            {cans.map((kind, i) => (
                <Animated.View
                    key={i}
                    testID={`can-${kind}`}
                    entering={FadeIn.duration(400)}
                    style={[
                        { position: 'absolute', width: size, height: size, transform: [{ rotate: `${(((seed + i * 5) % 7) - 3) * 12}deg` }] },
                        SPOTS[layout][i],
                    ]}
                >
                    <Can kind={kind} />
                </Animated.View>
            ))}
        </View>
    );
}

export default TableCans;

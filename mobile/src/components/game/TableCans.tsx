import { useId } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

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

/** Each kind's body colours (lit, middle and shaded) and its stripe (a wave on the cola). */
const LOOKS: Record<CanKind, { light: string; mid: string; dark: string; stripe: string; wave?: boolean }> = {
    // A pilsner's dark bottle green with a golden ring.
    green: { light: '#1f6b3a', mid: '#14502a', dark: '#082a15', stripe: '#d6aa3e' },
    // A Bavarian light sky blue with a white ring.
    blue: { light: '#6cb4f0', mid: '#3f8fd8', dark: '#1d5a9c', stripe: '#ffffff' },
    cola: { light: '#e8323c', mid: '#c41823', dark: '#6e0a12', stripe: '#ffffff', wave: true },
};

/** The cola's stripe: a white ring round the shoulder, waving in and out four times. */
const WAVE =
    Array.from({ length: 96 }, (_, i) => {
        const angle = (i / 96) * 2 * Math.PI;
        const r = 35.5 + 1.8 * Math.sin(angle * 4);
        return `${i === 0 ? 'M' : 'L'}${(50 + r * Math.cos(angle)).toFixed(2)} ${(46 + r * Math.sin(angle)).toFixed(2)}`;
    }).join(' ') + ' Z';

/**
 * An empty can standing on the table, seen from above like the ashtray and the shot glass (100 x 100
 * box): the coloured shoulder around the silver lid (the body is wider than the lid), a sliver of
 * the side below it (tipped a little towards you), and on the lid the opening and the tab lying
 * back on its rivet.
 */
function Can({ kind }: { kind: CanKind }) {
    const id = useId().replace(/:/g, '');
    const look = LOOKS[kind];
    // Everything round is centred at (50, 46); the side shows 7 below the shoulder.
    return (
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
                <RadialGradient id={`${id}-shadow`} cx="50%" cy="50%" r="50%">
                    <Stop offset={0.6} stopColor="#000" stopOpacity={0.32} />
                    <Stop offset={1} stopColor="#000" stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset={0} stopColor={look.dark} />
                    <Stop offset={0.25} stopColor={look.mid} />
                    <Stop offset={0.42} stopColor={look.light} />
                    <Stop offset={0.55} stopColor={look.mid} />
                    <Stop offset={1} stopColor={look.dark} />
                </LinearGradient>
                <RadialGradient id={`${id}-shoulder`} cx="50%" cy="46%" r="50%">
                    <Stop offset={0.66} stopColor={look.light} />
                    <Stop offset={0.86} stopColor={look.mid} />
                    <Stop offset={1} stopColor={look.dark} />
                </RadialGradient>
                <RadialGradient id={`${id}-lid`} cx="40%" cy="35%" r="70%">
                    <Stop offset={0} stopColor="#eef0f3" />
                    <Stop offset={0.7} stopColor="#c4c9d0" />
                    <Stop offset={1} stopColor="#9aa1aa" />
                </RadialGradient>
                <LinearGradient id={`${id}-tab`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset={0} stopColor="#f4f5f7" />
                    <Stop offset={1} stopColor="#b3b9c1" />
                </LinearGradient>
            </Defs>
            <Ellipse cx={54} cy={55} rx={45} ry={45} fill={`url(#${id}-shadow)`} />
            {/* The side, then the shoulder with its stripe (the cola's wave). */}
            <Path d="M10 46 L10 53 A40 40 0 0 0 90 53 L90 46 Z" fill={`url(#${id}-side)`} />
            <Circle cx={50} cy={46} r={40} fill={`url(#${id}-shoulder)`} />
            {look.wave ? (
                <Path d={WAVE} fill="none" stroke={look.stripe} strokeWidth={2.4} opacity={0.95} />
            ) : (
                <Circle cx={50} cy={46} r={35.5} fill="none" stroke={look.stripe} strokeWidth={2.4} opacity={0.95} />
            )}
            {/* The unpainted neck, the lid's rim and its sunken panel. */}
            <Circle cx={50} cy={46} r={31} fill="#b9bec5" />
            <Circle cx={50} cy={46} r={29} fill="#dfe3e8" stroke="#8d949d" strokeWidth={0.8} />
            <Circle cx={50} cy={46} r={26} fill={`url(#${id}-lid)`} stroke="#7f8690" strokeWidth={1} />
            {/* The opening, pushed in near the front edge. */}
            <Path d="M41 56 Q50 52.5 59 56 Q60.5 63 50 64.5 Q39.5 63 41 56 Z" fill="#2a2f36" />
            <Path d="M41 56 Q50 52.5 59 56" fill="none" stroke="#5c636c" strokeWidth={0.8} />
            {/* The tab, lying back flat on its rivet, with its finger hole. */}
            <Path d="M44.5 28 Q50 25.5 55.5 28 L56.5 46 Q50 50.5 43.5 46 Z" fill={`url(#${id}-tab)`} stroke="#8a919a" strokeWidth={0.7} />
            <Ellipse cx={50} cy={33} rx={3.4} ry={3} fill="#a3aab3" stroke="#858c95" strokeWidth={0.5} />
            <Circle cx={50} cy={44} r={2} fill="#d5d9de" stroke="#8a919a" strokeWidth={0.6} />
            {/* The lamp's reflection on the rim. */}
            <Path d="M27 36 A26 26 0 0 1 40 22" fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
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
                        { position: 'absolute', width: size, height: size, transform: [{ rotate: `${(((seed + i * 5) % 7) - 3) * 8}deg` }] },
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

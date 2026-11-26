import { View, type DimensionValue } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { TableLayout } from './cardSize';

/** The most cans on the table, however long the evening. */
export const MAX_CANS = 8;

export type CanKind = 'beer' | 'cola';

/**
 * The empty cans for `streak` games in a row at this table (`game.streak`): none for the first
 * game, then one can per game, beer and cola taking turns (2 games: a beer and a cola; 3: two
 * beers and a cola), at most `MAX_CANS`.
 */
export function cansFor(streak: number | undefined): CanKind[] {
    const count = (streak ?? 1) >= 2 ? Math.min(MAX_CANS, streak ?? 0) : 0;
    return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 'beer' : 'cola'));
}

type Spot = { left?: DimensionValue; right?: DimensionValue; top?: DimensionValue; bottom?: DimensionValue };

/**
 * Where the cans stand, in the order they arrive: the table's free corners and edges, away from the
 * piles in the middle and the ashtray (bottom-left). Cards may lie over them: they are drawn first.
 */
const SPOTS: Record<TableLayout, Spot[]> = {
    portrait: [
        { right: '8%', top: '60%' },
        { right: '17%', top: '64%' },
        { left: '20%', top: '67%' },
        { right: '22%', top: '19%' },
        { left: '22%', top: '20%' },
        { right: '24%', top: '58%' },
        { left: '27%', top: '62%' },
        { right: '12%', top: '46%' },
    ],
    wide: [
        { right: '14%', bottom: '14%' },
        { right: '20%', bottom: '19%' },
        { left: '26%', bottom: '13%' },
        { right: '24%', top: '13%' },
        { left: '24%', top: '15%' },
        { right: '30%', top: '55%' },
        { left: '28%', top: '50%' },
        { right: '12%', bottom: '30%' },
    ],
};

/** An open can, seen a little from above (40 x 70 box): the body in its colours, the lid with the opening and the tab. */
function Can({ kind }: { kind: CanKind }) {
    const beer = kind === 'beer';
    return (
        <Svg width="100%" height="100%" viewBox="0 0 40 70">
            <Ellipse cx={21} cy={64} rx={17} ry={4.5} fill="rgba(0, 0, 0, 0.22)" />
            <Path d="M4 12 L4 61 A16 4.2 0 0 0 36 61 L36 12 Z" fill={beer ? '#e8b923' : '#c8102e'} />
            {beer ? (
                <G>
                    <Rect x={4} y={27} width={32} height={18} fill="#1f6f3f" />
                    <Circle cx={20} cy={36} r={5.5} fill="#f8e7a1" />
                    <Circle cx={20} cy={36} r={3} fill="#1f6f3f" />
                </G>
            ) : (
                <Path d="M4 40 C14 30 24 46 36 34 L36 40 C24 52 14 36 4 46 Z" fill="#ffffff" />
            )}
            {/* A shine down the body. */}
            <Rect x={9} y={13} width={4} height={47} rx={2} fill="#ffffff" opacity={0.3} />
            {/* The lid: rim, the opening and the tab. */}
            <Ellipse cx={20} cy={12} rx={16} ry={4.2} fill="#b8bcc4" />
            <Ellipse cx={20} cy={12} rx={13} ry={3.1} fill="#e2e5ea" />
            <Ellipse cx={24.5} cy={12} rx={3.6} ry={1.5} fill="#2f3542" />
            <Rect x={12} y={10.6} width={7} height={2.8} rx={1.4} fill="#9aa0a8" />
        </Svg>
    );
}

type TableCansProps = {
    /** Games in a row at this table (`game.streak`). */
    streak?: number;
    layout: TableLayout;
    /** A card's width: the cans are a bit less than half of it wide. */
    cardWidth: number;
    /** Varies each can's tilt per game. */
    seed?: number;
};

/**
 * Empty cans on the table when the players have played several games in a row (`cansFor`):
 * scattered on the free parts of the table, each tilted a little, fading in. Decoration only:
 * no touches, hidden from screen readers.
 */
export function TableCans({ streak, layout, cardWidth, seed = 0 }: TableCansProps) {
    const cans = cansFor(streak);
    if (cans.length === 0) return null;
    const width = Math.round(cardWidth * 0.42);
    const height = Math.round(width * 1.75);
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
                        { position: 'absolute', width, height, transform: [{ rotate: `${(((seed + i * 7) % 5) - 2) * 4}deg` }] },
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

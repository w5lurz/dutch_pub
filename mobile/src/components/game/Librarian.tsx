import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { Trans } from 'react-i18next';
import i18n from '@/i18n';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

/** The scene's drawing box. */
const W = 220;
const H = 230;
/** How long the whole visit takes: rising, shelving the book, sinking back. */
export const LIBRARIAN_MS = 4200;

/** Her right shoulder (viewer's right), the arm's length, and its angle (degrees from straight up) at rest and on the shelf. */
const SHOULDER = { x: 112, y: 172 };
const ARM = 62;
const REST = 150;
const REACH = 28;
/** The hand on the shelf, and the book in it (held at its lower part). */
const HAND = {
    x: SHOULDER.x + ARM * Math.sin((REACH * Math.PI) / 180),
    y: SHOULDER.y - ARM * Math.cos((REACH * Math.PI) / 180),
};
const BOOK = { width: 14, height: 34, above: 14, color: '#2f6f9f' };
/** The shelf the book goes on: its top edge is where the book's bottom lands. */
const SHELF_Y = HAND.y - BOOK.above + BOOK.height / 2;
const TOP_SHELF_Y = SHELF_Y - 58;

const WOOD = '#8b5a2b';
const CARDIGAN = '#7b5e8c';
const SKIN = '#f1c9a5';

/** Books standing on a shelf (left edge, width, height, colour), leaving a gap for hers on the lower one. */
const TOP_BOOKS: [number, number, number, string][] = [
    [100, 12, 30, '#a33b3b'],
    [112, 10, 34, '#d9a441'],
    [122, 14, 28, '#4f7a4a'],
    [137, 9, 36, '#6b4c8a'],
    [146, 16, 31, '#2f5f7f'],
    [163, 11, 26, '#b8643c'],
    [175, 13, 33, '#3c3c3c'],
    [189, 10, 29, '#9a7b3f'],
    [199, 10, 35, '#7a2f4f'],
];
const GAP_LEFT = HAND.x - BOOK.width / 2 - 1;
const GAP_RIGHT = HAND.x + BOOK.width / 2 + 1;
const LOWER_BOOKS: [number, number, number, string][] = [
    [100, 13, 32, '#5a7d4f'],
    [114, 10, 36, '#c0503c'],
    [GAP_LEFT - 11, 11, 30, '#d3b25b'],
    [GAP_RIGHT, 12, 35, '#45607a'],
    [GAP_RIGHT + 13, 14, 29, '#8a4a6b'],
    [GAP_RIGHT + 28, 10, 33, '#3f6b5a'],
    [GAP_RIGHT + 39, 16, 31, '#a8743c'],
];

function Book({ x, bottom, width, height, color }: { x: number; bottom: number; width: number; height: number; color: string }) {
    return (
        <G>
            <Rect x={x} y={bottom - height} width={width} height={height} rx={1.5} fill={color} />
            <Rect x={x} y={bottom - height + 5} width={width} height={2} fill="#000" opacity={0.18} />
            <Rect x={x} y={bottom - 8} width={width} height={2} fill="#000" opacity={0.18} />
            <Rect x={x + 1} y={bottom - height} width={2} height={height} fill="#fff" opacity={0.15} />
        </G>
    );
}

/** The wall, the bookcase and its books (hers not yet on it). */
function Shelves() {
    return (
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute' }}>
            <Rect x={1} y={1} width={W - 2} height={H - 2} rx={18} fill="#f3e9d2" stroke={WOOD} strokeWidth={2} />
            <Rect x={94} y={8} width={120} height={H - 9} fill="#c89b6d" />
            <Rect x={90} y={8} width={6} height={H - 9} fill={WOOD} />
            <Rect x={212} y={8} width={6} height={H - 9} fill={WOOD} />
            {TOP_BOOKS.map(([x, width, height, color]) => (
                <Book key={x} x={x} bottom={TOP_SHELF_Y} width={width} height={height} color={color} />
            ))}
            {LOWER_BOOKS.map(([x, width, height, color]) => (
                <Book key={x} x={x} bottom={SHELF_Y} width={width} height={height} color={color} />
            ))}
            <Rect x={90} y={TOP_SHELF_Y} width={128} height={7} fill={WOOD} />
            <Rect x={90} y={SHELF_Y} width={128} height={7} fill={WOOD} />
            <Rect x={90} y={SHELF_Y + 58} width={128} height={7} fill={WOOD} />
        </Svg>
    );
}

/** The librarian: grey bun, round glasses on a chain, a cardigan over a white blouse. */
function Lady() {
    return (
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute' }}>
            {/* Body and the other arm, resting. */}
            <Path d="M72 172 Q94 164 116 172 L138 230 L48 230 Z" fill={CARDIGAN} />
            <Path d="M86 168 L94 190 L102 168 Z" fill="#fbfaf6" />
            <Path d="M94 190 L94 230" stroke="#5f4870" strokeWidth={1.5} />
            <Circle cx={97} cy={200} r={1.6} fill="#e8d9b0" />
            <Circle cx={97} cy={214} r={1.6} fill="#e8d9b0" />
            <Path d="M74 174 Q62 196 66 226" stroke={CARDIGAN} strokeWidth={14} strokeLinecap="round" fill="none" />
            <Path d="M74 174 Q62 196 66 226" stroke="#000" strokeOpacity={0.12} strokeWidth={2} fill="none" />
            {/* Neck and head. */}
            <Rect x={88} y={156} width={12} height={14} fill={SKIN} />
            <Circle cx={94} cy={140} r={24} fill={SKIN} />
            {/* Grey hair over the top of the head, and the bun. */}
            <Path d="M70 142 Q68 112 94 114 Q120 112 118 142 Q114 126 94 126 Q74 126 70 142 Z" fill="#c9c9cf" />
            <Circle cx={94} cy={108} r={11} fill="#bfbfc6" />
            <Path d="M86 106 Q94 100 102 106" stroke="#a8a8b0" strokeWidth={1.5} fill="none" />
            {/* Eyes, cheeks, a small smile. */}
            <Circle cx={86} cy={142} r={1.8} fill="#3a2a1a" />
            <Circle cx={102} cy={142} r={1.8} fill="#3a2a1a" />
            <Circle cx={80} cy={151} r={4} fill="#e88b8b" opacity={0.35} />
            <Circle cx={108} cy={151} r={4} fill="#e88b8b" opacity={0.35} />
            <Path d="M88 154 Q94 158 100 154" stroke="#9a5a4a" strokeWidth={1.6} strokeLinecap="round" fill="none" />
            {/* Glasses and their chain. */}
            <Circle cx={86} cy={142} r={7} stroke="#3a2a1a" strokeWidth={2} fill="#ffffff" fillOpacity={0.15} />
            <Circle cx={102} cy={142} r={7} stroke="#3a2a1a" strokeWidth={2} fill="#ffffff" fillOpacity={0.15} />
            <Line x1={93} y1={141} x2={95} y2={141} stroke="#3a2a1a" strokeWidth={2} />
            <Path d="M79 142 Q72 166 84 172" stroke="#d4af37" strokeWidth={1} strokeDasharray="1.5 1.5" fill="none" />
            <Path d="M109 142 Q116 166 104 172" stroke="#d4af37" strokeWidth={1} strokeDasharray="1.5 1.5" fill="none" />
        </Svg>
    );
}

/** A glint across her glasses, once the book is in. */
function Glint({ progress }: { progress: SharedValue<number> }) {
    const style = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0.55, 0.6, 0.68], [0, 1, 0], 'clamp') }));
    return (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, style]}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <Line x1={82} y1={145} x2={88} y2={138} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                <Line x1={98} y1={145} x2={104} y2={138} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
            </Svg>
        </Animated.View>
    );
}

/** Arm angle over the visit: lifts the book to the shelf, holds it there, and comes back down empty. */
const armAngle = (p: number) => {
    'worklet';
    return interpolate(p, [0, 0.18, 0.44, 0.52, 0.72, 1], [REST, REST, REACH, REACH, REST, REST], 'clamp');
};

/** Her arm, turning at the shoulder, with the book upright in her hand until it is on the shelf. */
function Arm({ progress }: { progress: SharedValue<number> }) {
    // A square centred on the shoulder (views turn about their centre); the arm fills its upper half.
    const turning = useAnimatedStyle(() => ({ transform: [{ rotate: `${armAngle(progress.get())}deg` }] }));
    const upright = useAnimatedStyle(() => ({
        transform: [{ rotate: `${-armAngle(progress.get())}deg` }],
        opacity: progress.get() < 0.5 ? 1 : 0,
    }));
    return (
        <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: SHOULDER.x - ARM, top: SHOULDER.y - ARM, width: ARM * 2, height: ARM * 2 }, turning]}
        >
            <View style={{ position: 'absolute', left: ARM - 7, top: 4, width: 14, height: ARM - 4, borderRadius: 7, backgroundColor: CARDIGAN }} />
            {/* The book, centred on the hand and kept upright. */}
            <Animated.View style={[{ position: 'absolute', left: ARM - 20, top: -30, width: 40, height: 60 }, upright]}>
                <Svg width={40} height={60} viewBox="0 0 40 60">
                    <Book x={20 - BOOK.width / 2} bottom={30 - BOOK.above + BOOK.height / 2} width={BOOK.width} height={BOOK.height} color={BOOK.color} />
                </Svg>
            </Animated.View>
            <View style={{ position: 'absolute', left: ARM - 6, top: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: SKIN }} />
        </Animated.View>
    );
}

/** Her book, once it stands on the shelf (it settles a little). */
function ShelvedBook({ progress }: { progress: SharedValue<number> }) {
    const style = useAnimatedStyle(() => ({
        opacity: progress.get() < 0.5 ? 0 : 1,
        transform: [{ translateY: interpolate(progress.get(), [0.5, 0.56], [-2, 0], 'clamp') }],
    }));
    return (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, style]}>
            <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <Book x={HAND.x - BOOK.width / 2} bottom={SHELF_Y} width={BOOK.width} height={BOOK.height} color={BOOK.color} />
            </Svg>
        </Animated.View>
    );
}

type LibrarianProps = {
    /** Who picked up the pile. */
    name: string;
    /** How many cards they picked up. */
    count: number;
    /** Called when she is gone again. */
    onDone: () => void;
};

/**
 * Shown to everyone when a player picks up a big pile (more than six cards): an old librarian
 * with glasses comes up from the bottom edge, puts a book on the shelf and goes again, with
 * the player's name above her. No touches; with "reduce motion" she just appears and fades.
 */
export function Librarian({ name, count, onDone }: LibrarianProps) {
    const window = useWindowDimensions();
    const still = useReducedMotion();
    const progress = useSharedValue(0);
    const scale = Math.min(260, window.width * 0.62, window.height * 0.42) / W;

    useEffect(() => {
        progress.set(withTiming(1, { duration: LIBRARIAN_MS, easing: Easing.linear }));
        const timer = setTimeout(onDone, LIBRARIAN_MS + 50);
        return () => clearTimeout(timer);
    }, [progress, onDone]);

    const rise = H * scale + 80 + window.height * 0.1;
    const coming = useAnimatedStyle(() => {
        const p = progress.get();
        if (still) return { opacity: interpolate(p, [0, 0.08, 0.9, 1], [0, 1, 1, 0], 'clamp') };
        return {
            transform: [
                {
                    translateY: interpolate(p, [0, 0.14, 0.86, 1], [rise, 0, 0, rise], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                    }),
                },
            ],
        };
    });
    // A little nod when the book is in.
    const nod = useAnimatedStyle(() => ({
        transform: [{ translateY: still ? 0 : interpolate(progress.get(), [0.5, 0.56, 0.62], [0, 2.5, 0], 'clamp') }],
    }));
    // With "reduce motion": the end of the visit, the book already on the shelf.
    const done = useSharedValue(1);

    return (
        <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            accessibilityLabel={i18n.t('game.librarian.label', { name, count })}
            style={[{ position: 'absolute', left: 0, right: 0, bottom: window.height * 0.1, alignItems: 'center' }, coming]}
        >
            <View className="mb-1 items-center rounded-2xl px-3 py-1" style={{ backgroundColor: 'rgba(17, 24, 39, 0.85)' }}>
                <Text numberOfLines={1} style={{ color: '#ffffff', fontSize: 15, fontWeight: '600', maxWidth: window.width * 0.85 }}>
                    <Trans i18nKey="game.librarian.title" values={{ name }} components={{ n: <Text style={{ color: '#fde68a', fontWeight: '800', fontSize: 16 }} /> }} />
                </Text>
                <Text style={{ color: '#d1d5db', fontSize: 11, fontWeight: '600' }}>{i18n.t('game.librarian.pickedUp', { count })}</Text>
            </View>
            <View style={{ width: W * scale, height: H * scale }}>
                <View style={{ position: 'absolute', left: (W * scale - W) / 2, top: (H * scale - H) / 2, width: W, height: H, transform: [{ scale }] }}>
                    <Shelves />
                    <ShelvedBook progress={still ? done : progress} />
                    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H }, nod]}>
                        <Lady />
                        <Glint progress={progress} />
                        <Arm progress={still ? done : progress} />
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
}

export default Librarian;

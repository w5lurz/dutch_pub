import { useEffect, useId } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

/** How long the glass slides. */
export const SLIDE_MS = 1100;
/** The drawing box. */
const BOX = 60;
/** The flame's drawing box: its base at the bottom middle, the tip at the top. */
const FLAME_W = 40;
const FLAME_H = 80;

export type Point = { x: number; y: number };

/** The glass seen from above, like the rest of the table: shadow, thick rim, heavy base. */
function Glass({ size }: { size: number }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: 'absolute' }}>
            <Defs>
                <RadialGradient id={`${id}-glass`} cx="40%" cy="38%" r="62%">
                    <Stop offset={0} stopColor="#ffffff" stopOpacity={0.55} />
                    <Stop offset={0.75} stopColor="#dfe8ef" stopOpacity={0.35} />
                    <Stop offset={1} stopColor="#9fb3c2" stopOpacity={0.6} />
                </RadialGradient>
            </Defs>
            {/* Shadow on the table. */}
            <Circle cx={33} cy={34} r={22} fill="#000" opacity={0.28} />
            {/* The glass and its rim. */}
            <Circle cx={30} cy={30} r={22} fill={`url(#${id}-glass)`} stroke="#ffffff" strokeOpacity={0.85} strokeWidth={1.6} />
            <Circle cx={30} cy={30} r={22.8} stroke="#000" strokeOpacity={0.25} strokeWidth={0.8} fill="none" />
            {/* The heavy base seen through the liquor, a little off-centre (perspective). */}
            <Circle cx={31.5} cy={31.5} r={13} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={2} fill="none" />
        </Svg>
    );
}

/** The liquor (clear, faintly golden, like pálinka) with its meniscus and the lamp's reflection. */
function Liquor({ size }: { size: number }) {
    return (
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: 'absolute' }}>
            <Circle cx={30} cy={30} r={18} fill="#f5df9a" fillOpacity={0.22} />
            <Circle cx={30} cy={30} r={18} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.2} fill="none" />
            <Path d="M19 24 Q23 16 32 15" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={2.2} strokeLinecap="round" fill="none" />
            <Circle cx={37} cy={37} r={1.6} fill="#ffffff" opacity={0.8} />
        </Svg>
    );
}

/** A tongue of fire: red-orange outside, orange, a yellow heart and a blue base, like burning liquor. */
function Flame({ width, height }: { width: number; height: number }) {
    return (
        <Svg width={width} height={height} viewBox={`0 0 ${FLAME_W} ${FLAME_H}`}>
            <Path d="M20 2 C27 20 38 36 36 54 C35 68 28 76 20 76 C12 76 5 68 4 54 C2 38 14 26 20 2 Z" fill="#e8360e" opacity={0.92} />
            <Path d="M20 16 C25 30 32 42 31 56 C30 67 25 72 20 72 C15 72 10 67 9 56 C8 44 16 32 20 16 Z" fill="#ff8a00" />
            <Path d="M20 34 C23 44 27 52 26 61 C25 67 23 70 20 70 C17 70 15 67 14 61 C13 53 18 44 20 34 Z" fill="#ffd84d" />
            <Path d="M20 58 C23 62 25 66 24 69 C23 72 21 73 20 73 C19 73 17 72 16 69 C15 66 17 62 20 58 Z" fill="#5fb4ff" opacity={0.9} />
        </Svg>
    );
}

/** The fire's glow on the table: a soft orange circle fading out. */
function TableGlow({ size }: { size: number }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
                <RadialGradient id={`${id}-table`} cx="50%" cy="50%" r="50%">
                    <Stop offset={0} stopColor="#ff9d2e" stopOpacity={0.6} />
                    <Stop offset={0.5} stopColor="#ff7a00" stopOpacity={0.22} />
                    <Stop offset={1} stopColor="#ff7a00" stopOpacity={0} />
                </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={50} fill={`url(#${id}-table)`} />
        </Svg>
    );
}

type ShotGlassProps = {
    /** Where it starts (the middle of the table) and where it stops (beside the winner), in the parent's coordinates. */
    from: Point;
    to: Point;
    /** Diameter in dp. */
    size?: number;
};

/** Share of the time spent sliding (slowing down); then the liquor settles and the flame stands up. */
const SLIDE_END = 1 / 1.6;

/**
 * The winner's shot, a flaming one so nobody misses it: a glass of clear liquor slides
 * across the table from the middle and stops beside the winner. While it slides its tongue
 * of fire streams out long behind it; once it stops the flame stands up and keeps
 * flickering, with a warm glow on the table around it. Above the table, below the night's
 * card lighting; no touches. With "reduce motion" it fades in at its place, the flame still.
 */
export function ShotGlass({ from, to, size = 52 }: ShotGlassProps) {
    const still = useReducedMotion();
    const progress = useSharedValue(still ? 1 : 0);
    const flicker = useSharedValue(0.5);
    useEffect(() => {
        if (still) return;
        progress.set(withTiming(1, { duration: SLIDE_MS / SLIDE_END, easing: Easing.linear }));
        flicker.set(
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 90, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0.3, { duration: 120, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0.8, { duration: 70 }),
                    withTiming(0, { duration: 140, easing: Easing.inOut(Easing.quad) }),
                ),
                -1,
            ),
        );
    }, [progress, flicker, still]);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / distance;
    const uy = dy / distance;
    // The flame's angle (clockwise from straight up) when it streams out behind the glass.
    const trailing = (Math.atan2(-ux, uy) * 180) / Math.PI;
    // The flame: twice the glass high, its base just inside the glass's middle.
    const flameHeight = size * 2;
    const flameWidth = (flameHeight * FLAME_W) / FLAME_H;

    const sliding = useAnimatedStyle(() => {
        const p = progress.get();
        const s = Easing.out(Easing.cubic)(Math.min(1, p / SLIDE_END));
        return {
            opacity: still ? 1 : interpolate(p, [0, 0.06], [0, 1], 'clamp'),
            transform: [{ translateX: from.x + dx * s - size / 2 }, { translateY: from.y + dy * s - size / 2 }],
        };
    });
    const spinning = useAnimatedStyle(() => {
        const s = Easing.out(Easing.cubic)(Math.min(1, progress.get() / SLIDE_END));
        return { transform: [{ rotate: `${interpolate(s, [0, 1], [-40, 0])}deg` }] };
    });
    // The liquor lags behind while the glass speeds off, runs forward when it stops, then settles.
    const slosh = useAnimatedStyle(() => {
        const p = progress.get();
        const lean = interpolate(p, [0, 0.08, SLIDE_END * 0.8, SLIDE_END, SLIDE_END + 0.1, SLIDE_END + 0.2, 1], [0, -2.5, -1, 3, -1.5, 0.6, 0], 'clamp');
        return { transform: [{ translateX: ux * lean }, { translateY: uy * lean }] };
    });
    // The flame turns about its base (the middle of a square centred on the glass): streaming out
    // behind while sliding, standing up once the glass stops.
    const turning = useAnimatedStyle(() => {
        const angle = interpolate(progress.get(), [0, SLIDE_END * 0.7, SLIDE_END + 0.12], [trailing, trailing * 0.6, 0], 'clamp');
        return { transform: [{ rotate: `${angle + (flicker.get() - 0.5) * 6}deg` }] };
    });
    // Long and thin while fast, flickering always; scaled about its base (its bottom edge).
    const burning = useAnimatedStyle(() => {
        const speed = 1 - Math.min(1, progress.get() / SLIDE_END);
        const f = flicker.get();
        return {
            transform: [
                { translateY: flameHeight / 2 },
                { scaleY: 1 + speed * 0.9 + f * 0.12 },
                { scaleX: 1 - speed * 0.25 - f * 0.06 },
                { translateY: -flameHeight / 2 },
            ],
        };
    });
    const glow = useAnimatedStyle(() => ({ opacity: 0.6 + flicker.get() * 0.3, transform: [{ scale: 1 + flicker.get() * 0.08 }] }));

    return (
        <Animated.View pointerEvents="none" testID="shot-glass" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, sliding]}>
            {/* Warm light on the table around the glass. */}
            <Animated.View style={[{ position: 'absolute', left: -size, top: -size, width: size * 3, height: size * 3 }, glow]}>
                <TableGlow size={size * 3} />
            </Animated.View>
            <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, spinning]}>
                <Glass size={size} />
                <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, slosh]}>
                    <Liquor size={size} />
                </Animated.View>
            </Animated.View>
            <Animated.View
                style={[
                    { position: 'absolute', left: size / 2 - flameHeight, top: size / 2 - flameHeight, width: flameHeight * 2, height: flameHeight * 2 },
                    turning,
                ]}
            >
                <Animated.View
                    style={[{ position: 'absolute', left: flameHeight - flameWidth / 2, top: flameHeight * 0.08, width: flameWidth, height: flameHeight }, burning]}
                >
                    <Flame width={flameWidth} height={flameHeight} />
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
}

export default ShotGlass;

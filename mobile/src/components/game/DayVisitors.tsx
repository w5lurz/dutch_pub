import { useEffect, useId, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTableTheme } from './tableTheme';

/**
 * Life around the table by day (UI-PLAN "Later: table life"): now and then a bee buzzes
 * across, or a butterfly drifts over; very rarely a red or blue frisbee flies over the table.
 */
export type VisitorKind = 'bee' | 'butterfly' | 'frisbee';

/** When the first visitor comes, and the pause after one left before the next. */
const FIRST_MS = { min: 6000, max: 12000 };
const NEXT_MS = { min: 18000, max: 40000 };
/** How long each kind takes to cross the screen. */
const CROSS_MS: Record<VisitorKind, { min: number; max: number }> = {
    bee: { min: 4000, max: 6000 },
    butterfly: { min: 7000, max: 10000 },
    frisbee: { min: 1300, max: 1700 },
};
/** Chance of a frisbee per visit (otherwise a bee or a butterfly, about half each). */
const FRISBEE_CHANCE = 0.06;
/** Drawing sizes (dp). */
const SIZE: Record<VisitorKind, number> = { bee: 22, butterfly: 32, frisbee: 54 };

const between = ({ min, max }: { min: number; max: number }) => min + Math.random() * (max - min);

/** Which visitor comes, from a random number in [0, 1). */
export function pickVisitor(random: number): VisitorKind {
    if (random < FRISBEE_CHANCE) return 'frisbee';
    return random < FRISBEE_CHANCE + (1 - FRISBEE_CHANCE) / 2 ? 'bee' : 'butterfly';
}

type Visit = {
    kind: VisitorKind;
    duration: number;
    /** Start and end (off-screen on opposite sides), their heights. */
    fromX: number;
    toX: number;
    fromY: number;
    toY: number;
    /** Wobble phases and, for frisbees and butterflies, the colour. */
    phase1: number;
    phase2: number;
    color: string;
    /** Frisbee: spin direction and the sideways curve of its path. */
    spin: number;
    curve: number;
};

const BUTTERFLY_COLORS = ['#f28c28', '#3b82f6', '#facc15', '#f9fafb'];

function planVisit(kind: VisitorKind, width: number, height: number): Visit {
    const size = SIZE[kind];
    const leftToRight = Math.random() < 0.5;
    const off = size * 1.5;
    // Anywhere from the upper fifth to the lower third of the screen.
    const y = () => between({ min: height * 0.15, max: height * 0.7 });
    return {
        kind,
        duration: between(CROSS_MS[kind]),
        fromX: leftToRight ? -off : width + off,
        toX: leftToRight ? width + off : -off,
        fromY: y(),
        toY: y(),
        phase1: Math.random() * Math.PI * 2,
        phase2: Math.random() * Math.PI * 2,
        color:
            kind === 'frisbee'
                ? Math.random() < 0.5
                    ? '#dc2626'
                    : '#2563eb'
                : BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)],
        spin: Math.random() < 0.5 ? 1 : -1,
        curve: between({ min: -60, max: 60 }),
    };
}

/** Where the visitor is at `t` (0..1 of its crossing): each kind has its own way of flying. */
function visitorAt(v: Visit, t: number): { x: number; y: number } {
    'worklet';
    const x = v.fromX + (v.toX - v.fromX) * t;
    const y = v.fromY + (v.toY - v.fromY) * t;
    if (v.kind === 'bee') {
        // Busy zigzags and little loops, a fast buzz on top.
        return {
            x: x + 20 * Math.sin(t * Math.PI * 6 + v.phase1),
            y: y + 16 * Math.sin(t * Math.PI * 9 + v.phase2) + 2.5 * Math.sin(t * 160),
        };
    }
    if (v.kind === 'butterfly') {
        // Lazy meanders, bobbing with each wing beat.
        return {
            x: x + 34 * Math.sin(t * Math.PI * 2 + v.phase1),
            y: y + 42 * Math.sin(t * Math.PI * 3 + v.phase2) + 6 * Math.sin(t * Math.PI * 2 * 18),
        };
    }
    // Frisbee: a smooth curve.
    return { x, y: y + v.curve * Math.sin(t * Math.PI) };
}

/** Bee seen from above, head toward +x: striped body, dark head, see-through wings (flutter separately). */
function BeeBody() {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={SIZE.bee} height={SIZE.bee} viewBox="0 0 20 20" style={StyleSheet.absoluteFill}>
            <Defs>
                <ClipPath id={`${id}-body`}>
                    <Ellipse cx={9.5} cy={10} rx={6} ry={3.6} />
                </ClipPath>
            </Defs>
            <Path d="M 3.2 10 L 1.4 10" stroke="#2b2118" strokeWidth={0.9} strokeLinecap="round" />
            <Ellipse cx={9.5} cy={10} rx={6} ry={3.6} fill="#f5c518" />
            <G clipPath={`url(#${id}-body)`}>
                <Rect x={5.2} y={5} width={1.8} height={10} fill="#2b2118" />
                <Rect x={8.6} y={5} width={1.8} height={10} fill="#2b2118" />
                <Rect x={12} y={5} width={1.5} height={10} fill="#2b2118" />
            </G>
            <Circle cx={16.3} cy={10} r={2.3} fill="#2b2118" />
        </Svg>
    );
}

function BeeWings() {
    return (
        <Svg width={SIZE.bee} height={SIZE.bee} viewBox="0 0 20 20">
            <Ellipse cx={10.5} cy={4.6} rx={3.4} ry={2.8} fill="#e0f2fe" opacity={0.75} stroke="#94a3b8" strokeWidth={0.3} />
            <Ellipse cx={10.5} cy={15.4} rx={3.4} ry={2.8} fill="#e0f2fe" opacity={0.75} stroke="#94a3b8" strokeWidth={0.3} />
        </Svg>
    );
}

/** Butterfly seen from above, head toward +x: big forewings, smaller hindwings, thin body. */
function ButterflyWings({ color }: { color: string }) {
    const edge = color === '#f9fafb' ? '#9ca3af' : '#2b1d14';
    const half = (
        <G>
            <Path d="M 15 13 C 17 7 21 2.5 25 3 C 26.5 6 23 11 15 13.4 Z" fill={color} stroke={edge} strokeWidth={0.9} />
            <Path d="M 13 13.2 C 10 8 5.5 6 3.5 8 C 3.5 11 7 13.4 13 13.6 Z" fill={color} stroke={edge} strokeWidth={0.9} />
            <Circle cx={22.5} cy={5.2} r={0.9} fill="#ffffff" />
            <Circle cx={6} cy={9.3} r={0.8} fill="#ffffff" opacity={0.8} />
        </G>
    );
    return (
        <Svg width={SIZE.butterfly} height={SIZE.butterfly} viewBox="0 0 28 28">
            {half}
            <G transform="translate(0 28) scale(1 -1)">{half}</G>
        </Svg>
    );
}

function ButterflyBody() {
    return (
        <Svg width={SIZE.butterfly} height={SIZE.butterfly} viewBox="0 0 28 28" style={StyleSheet.absoluteFill}>
            <Ellipse cx={14} cy={14} rx={7} ry={1.2} fill="#2b1d14" />
            <Circle cx={21.2} cy={14} r={1.3} fill="#2b1d14" />
            <Path d="M 22 13.4 Q 24.5 11 26 10.4 M 22 14.6 Q 24.5 17 26 17.6" stroke="#2b1d14" strokeWidth={0.5} fill="none" />
        </Svg>
    );
}

/** Frisbee seen from above: a disc with raised rings and a shine. */
function FrisbeeArt({ color }: { color: string }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={SIZE.frisbee} height={SIZE.frisbee} viewBox="0 0 60 60">
            <Defs>
                <RadialGradient id={`${id}-disc`} cx="40%" cy="38%" r="65%">
                    <Stop offset={0} stopColor="#ffffff" stopOpacity={0.35} />
                    <Stop offset={0.5} stopColor="#ffffff" stopOpacity={0} />
                    <Stop offset={1} stopColor="#000000" stopOpacity={0.25} />
                </RadialGradient>
            </Defs>
            <Circle cx={30} cy={30} r={28} fill={color} />
            <Circle cx={30} cy={30} r={28} fill={`url(#${id}-disc)`} />
            <Circle cx={30} cy={30} r={24} fill="none" stroke="#000000" strokeOpacity={0.18} strokeWidth={1.5} />
            <Circle cx={30} cy={30} r={15} fill="none" stroke="#ffffff" strokeOpacity={0.3} strokeWidth={1.2} />
            <Circle cx={30} cy={30} r={8} fill="none" stroke="#000000" strokeOpacity={0.15} strokeWidth={1} />
            {/* A mark, so the spin shows. */}
            <Path d="M 22 14 A 17 17 0 0 1 44 18" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        </Svg>
    );
}

function Flight({ visit }: { visit: Visit }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.set(withTiming(1, { duration: visit.duration, easing: Easing.linear }));
    }, [visit, progress]);
    const size = SIZE[visit.kind];

    const flyStyle = useAnimatedStyle(() => {
        const t = progress.get();
        const here = visitorAt(visit, t);
        if (visit.kind === 'frisbee') {
            // Spins as it flies; a little bigger in the middle (higher up, closer to you).
            return {
                transform: [
                    { translateX: here.x - size / 2 },
                    { translateY: here.y - size / 2 },
                    { rotate: `${visit.spin * t * 900}deg` },
                    { scale: 1 + 0.12 * Math.sin(t * Math.PI) },
                ],
            };
        }
        // Facing where it flies (the drawings face +x).
        const ahead = visitorAt(visit, Math.min(1, t + 0.004));
        const heading = Math.atan2(ahead.y - here.y, ahead.x - here.x);
        return { transform: [{ translateX: here.x - size / 2 }, { translateY: here.y - size / 2 }, { rotate: `${heading}rad` }] };
    });
    // Wing beats: a fast buzz for the bee, slow flaps for the butterfly (folded wings look narrow from above).
    const wingStyle = useAnimatedStyle(() => {
        const ms = progress.get() * visit.duration;
        const hz = visit.kind === 'bee' ? 24 : 3.5;
        const beat = Math.abs(Math.sin((ms * hz * Math.PI) / 1000));
        return { transform: [{ scaleY: (visit.kind === 'bee' ? 0.55 : 0.15) + (visit.kind === 'bee' ? 0.45 : 0.85) * beat }] };
    });
    // The frisbee's shadow on the table: further away (it is higher) in the middle of its flight.
    const shadowStyle = useAnimatedStyle(() => {
        const t = progress.get();
        const here = visitorAt(visit, t);
        const lift = 10 + 16 * Math.sin(t * Math.PI);
        return {
            transform: [{ translateX: here.x - size / 2 + lift * 0.6 }, { translateY: here.y - size / 2 + lift }],
            opacity: 0.3 - 0.1 * Math.sin(t * Math.PI),
        };
    });

    const box = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };
    if (visit.kind === 'frisbee') {
        return (
            <>
                <Animated.View style={[box, { borderRadius: size / 2, backgroundColor: '#000000' }, shadowStyle]} />
                <Animated.View testID="day-visitor-frisbee" style={[box, flyStyle]}>
                    <FrisbeeArt color={visit.color} />
                </Animated.View>
            </>
        );
    }
    return (
        <Animated.View testID={`day-visitor-${visit.kind}`} style={[box, flyStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, wingStyle]}>
                {visit.kind === 'bee' ? <BeeWings /> : <ButterflyWings color={visit.color} />}
            </Animated.View>
            {visit.kind === 'bee' ? <BeeBody /> : <ButterflyBody />}
        </Animated.View>
    );
}

/** Dev preview: makes the next visitor come at once (see the dev table screen). */
const summoners = new Set<(kind: VisitorKind) => void>();
export function summonVisitor(kind: VisitorKind) {
    summoners.forEach(summon => summon(kind));
}

function Visits() {
    const window = useWindowDimensions();
    const [visit, setVisit] = useState<Visit | null>(null);
    // The latest size for the next visit, without restarting the schedule when it changes.
    const place = useRef({ width: window.width, height: window.height });
    useEffect(() => {
        place.current = { width: window.width, height: window.height };
    }, [window.width, window.height]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const come = (kind: VisitorKind) => {
            clearTimeout(timer);
            const next = planVisit(kind, place.current.width, place.current.height);
            setVisit(next);
            timer = setTimeout(() => {
                setVisit(null);
                timer = setTimeout(() => come(pickVisitor(Math.random())), between(NEXT_MS));
            }, next.duration);
        };
        timer = setTimeout(() => come(pickVisitor(Math.random())), between(FIRST_MS));
        summoners.add(come);
        return () => {
            clearTimeout(timer);
            summoners.delete(come);
        };
    }, []);

    return visit ? <Flight key={`${visit.kind}-${visit.phase1}`} visit={visit} /> : null;
}

/**
 * Bees, butterflies and (rarely) a frisbee passing over the table by day. Above the cards
 * (they fly over them), only decoration: no touches, hidden from screen readers. Not at
 * night (there is the moth then), and not when the system's "reduce motion" is on.
 */
export function DayVisitors() {
    const day = useTableTheme().mode === 'day';
    const still = useReducedMotion();
    if (!day || still) return null;
    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
        >
            <Visits />
        </View>
    );
}

export default DayVisitors;

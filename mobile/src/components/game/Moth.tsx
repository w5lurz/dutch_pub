import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { lampLightY } from './TableLamp';
import { useTableTheme } from './tableTheme';

/** The moth's size (its drawing's box, dp). */
const SIZE = 18;

/** When the first moth comes, and the pause after one flew off before the next. */
const FIRST_MS = { min: 8000, max: 15000 };
const NEXT_MS = { min: 20000, max: 45000 };
/** How long it circles the lamp, and how long it takes to fly in / off. */
const CIRCLE_MS = { min: 5000, max: 8000 };
const ARRIVE_MS = 1300;
const LEAVE_MS = 1300;
/** Wing beats per second. */
const FLUTTER_HZ = 11;

const between = ({ min, max }: { min: number; max: number }) => min + Math.random() * (max - min);

type Point = { x: number; y: number };

/** One visit: where the moth comes from and goes to, and the shape of its wobbly orbit around the lamp. */
type Flight = {
    duration: number;
    arrive: number;
    leave: number;
    from: Point;
    to: Point;
    /** The orbit's centre and radii. */
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    /** Start angle, direction (1 / -1) and speed (radians per second). */
    angle: number;
    turn: number;
    speed: number;
    /** Phases of the wobbles, so no two visits look the same. */
    phase1: number;
    phase2: number;
};

function planFlight(width: number, height: number, lightY: number): Flight {
    const side = () => (Math.random() < 0.5 ? -1 : 1);
    const offX = (s: number) => (s < 0 ? -SIZE * 2 : width + SIZE * 2);
    const low = Math.min(240, height * 0.3);
    const arriveSide = side();
    const circle = between(CIRCLE_MS);
    return {
        duration: ARRIVE_MS + circle + LEAVE_MS,
        arrive: ARRIVE_MS,
        leave: LEAVE_MS,
        from: { x: offX(arriveSide), y: lightY + between({ min: 40, max: low }) },
        // Off to either side, sometimes up over the top edge.
        to: Math.random() < 0.3 ? { x: width / 2 + between({ min: -120, max: 120 }), y: -SIZE * 3 } : { x: offX(side()), y: lightY + between({ min: 0, max: low }) },
        cx: width / 2,
        // A little below the light, so most of the orbit is on screen.
        cy: lightY + 14,
        rx: between({ min: 38, max: 60 }),
        ry: between({ min: 16, max: 26 }),
        angle: Math.random() * Math.PI * 2,
        turn: side(),
        speed: between({ min: 3.2, max: 4.4 }),
        phase1: Math.random() * Math.PI * 2,
        phase2: Math.random() * Math.PI * 2,
    };
}

/** Eases 0..1 in and out. (Defined before `mothAt`: a worklet captures what it uses when it is created.) */
function smooth(k: number) {
    'worklet';
    const c = Math.min(1, Math.max(0, k));
    return c * c * (3 - 2 * c);
}

/** Where the moth is `ms` into its flight: a wobbly ellipse around the lamp, eased in from / out to off-screen. */
function mothAt(f: Flight, ms: number): Point {
    'worklet';
    const t = ms / 1000;
    const a = f.angle + f.turn * f.speed * t;
    // The radius wavers with the angle and over time; small jitters on top.
    const r = 1 + 0.16 * Math.sin(2.3 * a + f.phase1) + 0.1 * Math.sin(1.7 * t + f.phase2);
    let x = f.cx + f.rx * r * Math.cos(a) + 4 * Math.sin(9.1 * t + f.phase2);
    let y = f.cy + f.ry * r * Math.sin(a) + 3 * Math.sin(7.3 * t + f.phase1);
    if (ms < f.arrive) {
        const k = smooth(ms / f.arrive);
        x = f.from.x + (x - f.from.x) * k;
        y = f.from.y + (y - f.from.y) * k;
    } else if (ms > f.duration - f.leave) {
        const k = smooth((ms - (f.duration - f.leave)) / f.leave);
        x += (f.to.x - x) * k;
        y += (f.to.y - y) * k;
    }
    return { x, y };
}

/** A wing pair's upper half (head toward +x): forewing and hindwing, swept back. */
function Wings() {
    return (
        <G>
            <Path d="M 11 8.6 C 9.5 4.5 6.5 1.6 4 1.2 C 2.4 2.6 2.8 6 7 8.8 Z" fill="#8c7c67" />
            <Path d="M 8 8.9 C 5.5 6.8 2.8 6.6 1.4 8 C 3 9 5.5 9.2 8 9 Z" fill="#6e6151" />
            <Circle cx={6.2} cy={4.6} r={0.9} fill="#5a4e41" />
        </G>
    );
}

function MothArt() {
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 18 18" style={StyleSheet.absoluteFill}>
            <Ellipse cx={9.5} cy={9} rx={5} ry={1.6} fill="#4a3f35" />
            <Circle cx={14.6} cy={9} r={1.4} fill="#3b322a" />
            <Path d="M 15.6 8.3 Q 16.8 6.6 17.8 5.8 M 15.6 9.7 Q 16.8 11.4 17.8 12.2" stroke="#3b322a" strokeWidth={0.5} fill="none" />
        </Svg>
    );
}

function MothFlight({ flight }: { flight: Flight }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.set(withTiming(1, { duration: flight.duration, easing: Easing.linear }));
    }, [flight, progress]);

    const flyStyle = useAnimatedStyle(() => {
        const ms = progress.get() * flight.duration;
        const here = mothAt(flight, ms);
        const ahead = mothAt(flight, ms + 30);
        // Facing where it flies (the drawing faces +x).
        const heading = Math.atan2(ahead.y - here.y, ahead.x - here.x);
        return { transform: [{ translateX: here.x - SIZE / 2 }, { translateY: here.y - SIZE / 2 }, { rotate: `${heading}rad` }] };
    });
    const wingStyle = useAnimatedStyle(() => {
        const beat = Math.abs(Math.sin((progress.get() * flight.duration * FLUTTER_HZ * Math.PI) / 1000));
        return { transform: [{ scaleY: 0.3 + 0.7 * beat }, { scaleX: 0.9 + 0.1 * beat }] };
    });
    return (
        <Animated.View testID="moth" style={[{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE }, flyStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, wingStyle]}>
                <Svg width={SIZE} height={SIZE} viewBox="0 0 18 18">
                    <Wings />
                    <G transform="translate(0 18) scale(1 -1)">
                        <Wings />
                    </G>
                </Svg>
            </Animated.View>
            <MothArt />
        </Animated.View>
    );
}

/** Sends a moth now and then: the first after 8–15 s, then 20–45 s after the last one left. */
function MothVisits({ insetTop }: { insetTop: number }) {
    const window = useWindowDimensions();
    const [flight, setFlight] = useState<Flight | null>(null);
    // The latest sizes for the next flight, without restarting the schedule when they change.
    const place = useRef({ width: window.width, height: window.height, lightY: lampLightY(insetTop) });
    useEffect(() => {
        place.current = { width: window.width, height: window.height, lightY: lampLightY(insetTop) };
    }, [window.width, window.height, insetTop]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const visit = () => {
            const { width, height, lightY } = place.current;
            const next = planFlight(width, height, lightY);
            setFlight(next);
            timer = setTimeout(() => {
                setFlight(null);
                timer = setTimeout(visit, between(NEXT_MS));
            }, next.duration);
        };
        timer = setTimeout(visit, between(FIRST_MS));
        return () => clearTimeout(timer);
    }, []);

    return flight ? <MothFlight flight={flight} /> : null;
}

/**
 * A moth that now and then circles the lamp at the top edge's middle (see `TableLamp`) for a
 * few seconds, then flies off. Night only, and not when the system's "reduce motion" is on.
 * Only decoration: no touches, hidden from screen readers. Put it right after `TableLamp`.
 */
export function Moth({ insetTop }: { insetTop: number }) {
    const night = useTableTheme().mode === 'night';
    const still = useReducedMotion();
    if (!night || still) return null;
    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
        >
            <MothVisits insetTop={insetTop} />
        </View>
    );
}

export default Moth;

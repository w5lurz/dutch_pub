import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
    withSequence,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { useTableTheme } from './tableTheme';

/** The lamp's width (the shade's rim) and its glow around it. */
const LAMP_WIDTH = 84;
const HALO = { width: 220, height: 130 };

/** Flickers: one now and then (random gap), each 2–4 quick dips of the light. */
const FLICKER_GAP_MS = { min: 5000, max: 12000 };
const FLICKER_DIPS = { min: 2, max: 4 };
/** How dark the table gets in one dip (an overlay's opacity), and how long the dip lasts. */
const DIP_DEPTH = { min: 0.1, max: 0.18 };
const DIP_MS = { min: 40, max: 120 };
/** The pause between two dips of one flicker. */
const DIP_GAP_MS = { min: 30, max: 140 };

const between = ({ min, max }: { min: number; max: number }) => min + Math.random() * (max - min);

/**
 * How far the lamp reaches down from the top edge (dp). An opponent sits just below the
 * status bar, so the lamp stays inside it (up to 26 dp); without one (web, a phone turned
 * sideways, where the top opponent's cards reach the edge) only the rim and the bulb show.
 */
export function lampDrop(insetTop: number): number {
    return Math.round(Math.min(26, Math.max(8, insetTop - 2)));
}

/** Where the light comes from (dp from the top): the middle of the shade's lit underside. */
export function lampLightY(insetTop: number): number {
    return lampDrop(insetTop) - 5;
}

/** One flicker: 2–4 short dips of the light (the darkening overlay's opacity) with short pauses. */
function flickerAnimation() {
    const dips = FLICKER_DIPS.min + Math.floor(Math.random() * (FLICKER_DIPS.max - FLICKER_DIPS.min + 1));
    const steps = [];
    for (let i = 0; i < dips; i++) {
        const ms = between(DIP_MS);
        if (i > 0) steps.push(withTiming(0, { duration: between(DIP_GAP_MS) }));
        steps.push(withTiming(between(DIP_DEPTH), { duration: ms * 0.35 }), withTiming(0, { duration: ms * 0.65 }));
    }
    const [first, ...rest] = steps;
    return withSequence(first, ...rest);
}

/** 0 normally; for a moment now and then (`enabled` only) the light dips, up to ~0.18. */
function useFlicker(enabled: boolean): SharedValue<number> {
    const dip = useSharedValue(0);
    useEffect(() => {
        if (!enabled) return;
        let timer: ReturnType<typeof setTimeout>;
        const schedule = () => {
            timer = setTimeout(() => {
                dip.set(flickerAnimation());
                schedule();
            }, between(FLICKER_GAP_MS));
        };
        schedule();
        return () => {
            clearTimeout(timer);
            cancelAnimation(dip);
            dip.set(0);
        };
    }, [enabled, dip]);
    return dip;
}

/** The dark metal shade's lower part with its rim, and the unlit underside (seen through the light when it dips). */
function Shade({ drop, id }: { drop: number; id: string }) {
    const c = LAMP_WIDTH / 2;
    const rim = drop - 5;
    return (
        <Svg width={LAMP_WIDTH} height={drop} style={StyleSheet.absoluteFill}>
            <Defs>
                <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset={0} stopColor="#111316" />
                    <Stop offset={1} stopColor="#3b4148" />
                </LinearGradient>
            </Defs>
            {/* The dome, mostly above the screen's top edge. */}
            <Path
                d={`M 2 ${rim} C 4 ${rim - 22} 20 ${rim - 40} ${c} ${rim - 42} C ${LAMP_WIDTH - 20} ${rim - 40} ${LAMP_WIDTH - 4} ${rim - 22} ${LAMP_WIDTH - 2} ${rim} Z`}
                fill={`url(#${id}-metal)`}
            />
            <Path d={`M 9 ${rim - 3} C 12 ${rim - 12} 18 ${rim - 20} 26 ${rim - 26}`} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1.5} fill="none" />
            {/* The rim, seen a little from below, and the shade's inside when the light is off. */}
            <Ellipse cx={c} cy={rim} rx={c - 2} ry={4} fill="#25292e" stroke="#7a828c" strokeOpacity={0.7} strokeWidth={1} />
            <Ellipse cx={c} cy={rim} rx={c - 6} ry={2.8} fill="#4a3520" />
        </Svg>
    );
}

/** The lit parts: the shade's bright underside and the bulb peeking out below the rim. */
function Light({ drop, id }: { drop: number; id: string }) {
    const c = LAMP_WIDTH / 2;
    const rim = drop - 5;
    return (
        <Svg width={LAMP_WIDTH} height={drop}>
            <Defs>
                <RadialGradient id={`${id}-inside`} cx="50%" cy="50%" r="50%">
                    <Stop offset={0} stopColor="#fff8e1" />
                    <Stop offset={0.5} stopColor="#ffd27a" />
                    <Stop offset={1} stopColor="#e08a2e" />
                </RadialGradient>
            </Defs>
            <Ellipse cx={c} cy={rim} rx={c - 6} ry={2.8} fill={`url(#${id}-inside)`} />
            <Ellipse cx={c} cy={rim + 1.5} rx={8} ry={3.2} fill="#fffdf2" />
        </Svg>
    );
}

/** The warm glow around the lamp. */
function Halo({ id }: { id: string }) {
    return (
        <Svg width={HALO.width} height={HALO.height}>
            <Defs>
                <RadialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
                    <Stop offset={0} stopColor="#ffd58a" stopOpacity={0.45} />
                    <Stop offset={0.35} stopColor="#ffc46b" stopOpacity={0.16} />
                    <Stop offset={1} stopColor="#ffb35c" stopOpacity={0} />
                </RadialGradient>
            </Defs>
            <Ellipse cx={HALO.width / 2} cy={HALO.height / 2} rx={HALO.width / 2} ry={HALO.height / 2} fill={`url(#${id}-halo)`} />
        </Svg>
    );
}

function LitLamp({ insetTop, flicker }: { insetTop: number; flicker: boolean }) {
    const id = useId().replace(/:/g, '');
    const dip = useFlicker(flicker);
    const drop = lampDrop(insetTop);
    const shadeStyle = useAnimatedStyle(() => ({ opacity: dip.get() }));
    // The lamp's own light dims much more than the table (it is the light).
    const lightStyle = useAnimatedStyle(() => ({ opacity: 1 - dip.get() * 3 }));
    const haloStyle = useAnimatedStyle(() => ({ opacity: 1 - dip.get() * 4 }));
    return (
        <>
            {/* The whole table darkens a little while the light dips. */}
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#020308' }, shadeStyle]} />
            <Animated.View
                style={[
                    { position: 'absolute', left: '50%', marginLeft: -HALO.width / 2, top: lampLightY(insetTop) - HALO.height / 2 },
                    haloStyle,
                ]}
            >
                <Halo id={id} />
            </Animated.View>
            <View style={{ position: 'absolute', left: '50%', marginLeft: -LAMP_WIDTH / 2, top: 0, width: LAMP_WIDTH, height: drop }}>
                <Shade drop={drop} id={id} />
                <Animated.View style={[StyleSheet.absoluteFill, lightStyle]}>
                    <Light drop={drop} id={id} />
                </Animated.View>
            </View>
        </>
    );
}

/**
 * The outdoor lamp above the table at night (UI-PLAN U5): only the lower rim of its dark shade
 * and the bright underside peek in at the top edge's middle, with a soft warm glow. Now and
 * then the light flickers briefly (not when the system's "reduce motion" is on). Put it last
 * (above the cards, `TableLighting layer="cards"` included). Only decoration: no touches,
 * hidden from screen readers; shows by night only.
 */
export function TableLamp({ insetTop }: { insetTop: number }) {
    const night = useTableTheme().mode === 'night';
    const still = useReducedMotion();
    if (!night) return null;
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="table-lamp"
            style={StyleSheet.absoluteFill}
        >
            <LitLamp insetTop={insetTop} flicker={!still} />
        </Animated.View>
    );
}

export default TableLamp;

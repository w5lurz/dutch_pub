import { useEffect, useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTableTheme } from './tableTheme';

/** The drawing's coordinate box (a square, the ashtray centred in it). */
const BOX = 120;
/** Where the lit tip of the cigarette is in the drawing (it rests in the notch at -30°). */
const EMBER = { x: 60 + 11 * Math.cos(Math.PI / 6), y: 60 - 11 * Math.sin(Math.PI / 6) };

/** Smoke puffs drawn at once, how long each takes to rise and fade, and their spacing. */
const PUFFS = 5;
const PUFF_MS = 4200;
const PUFF_STAGGER = PUFF_MS / PUFFS;

/** A stubbed-out cigarette: filter, a bit of paper, the burnt end. Drawn along +x from (0, 0). */
function Butt({ x, y, angle, paper }: { x: number; y: number; angle: number; paper: number }) {
    return (
        <G transform={`translate(${x} ${y}) rotate(${angle})`}>
            <Rect x={1} y={-1.5} width={14 + paper} height={5} rx={1.5} fill="#000" opacity={0.35} />
            <Rect x={0} y={-2.5} width={13} height={5} rx={1.5} fill="#c98b4f" />
            <Rect x={13} y={-2.5} width={paper} height={5} fill="#e6e1d5" />
            <Rect x={13 + paper} y={-2.5} width={2.5} height={5} rx={1} fill="#3d3833" />
        </G>
    );
}

/** The ashtray seen from above: dark glass rim with three notches, ash, butts and a lit cigarette. */
function AshtrayArt({ size }: { size: number }) {
    const id = useId().replace(/:/g, '');
    return (
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
            <Defs>
                <RadialGradient id={`${id}-glass`} cx="42%" cy="38%" r="65%">
                    <Stop offset={0} stopColor="#5a616a" />
                    <Stop offset={0.7} stopColor="#30353b" />
                    <Stop offset={1} stopColor="#1e2226" />
                </RadialGradient>
                <RadialGradient id={`${id}-bowl`} cx="50%" cy="50%" r="50%">
                    <Stop offset={0} stopColor="#2b2e33" />
                    <Stop offset={1} stopColor="#16181b" />
                </RadialGradient>
            </Defs>
            {/* Shadow on the table. */}
            <Circle cx={63} cy={64} r={49} fill="#000" opacity={0.35} />
            {/* Rim, with a highlight on the lamp's side. */}
            <Circle cx={60} cy={60} r={48} fill={`url(#${id}-glass)`} stroke="#767d86" strokeWidth={1.2} strokeOpacity={0.6} />
            <Path d="M 22 44 A 42 42 0 0 1 52 18" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" fill="none" />
            {/* Notches the cigarettes rest in. */}
            {[-30, 90, 210].map(angle => (
                <Rect
                    key={angle}
                    x={33}
                    y={-4}
                    width={15}
                    height={8}
                    rx={3}
                    fill="#16181b"
                    transform={`translate(60 60) rotate(${angle})`}
                />
            ))}
            {/* Bowl with ash. */}
            <Circle cx={60} cy={60} r={33} fill={`url(#${id}-bowl)`} />
            <Ellipse cx={54} cy={66} rx={11} ry={7} fill="#5f5e5a" />
            <Ellipse cx={67} cy={59} rx={8} ry={5} fill="#77756f" />
            <Ellipse cx={60} cy={73} rx={6} ry={3.5} fill="#4c4b47" />
            <Circle cx={47} cy={57} r={2} fill="#85837c" />
            <Circle cx={71} cy={70} r={1.6} fill="#6e6c66" />
            {/* Stubbed-out butts. */}
            <Butt x={40} y={52} angle={-20} paper={4} />
            <Butt x={46} y={74} angle={-10} paper={3} />
            <Butt x={84} y={72} angle={200} paper={5} />
            {/* The lit cigarette: tip over the bowl, filter out over the rim (resting in the notch). */}
            <G transform="translate(60 60) rotate(-30)">
                <Rect x={13} y={-1} width={53} height={6} rx={2} fill="#000" opacity={0.35} />
                <Rect x={16} y={-3} width={35} height={6} fill="#f4f1ea" />
                <Rect x={51} y={-3} width={15} height={6} rx={1.5} fill="#cf8d50" />
                <Rect x={51} y={-3} width={1} height={6} fill="#a86b35" />
                <Rect x={10} y={-3} width={6} height={6} rx={1.5} fill="#9a9690" />
                <Rect x={10} y={-2.4} width={2.5} height={4.8} rx={1.2} fill="#ff5a1f" />
            </G>
        </Svg>
    );
}

/** The tip's glow, slowly brighter and dimmer like a cigarette that is drawn on now and then. */
function EmberGlow({ size, still }: { size: number; still: boolean }) {
    const id = useId().replace(/:/g, '');
    const pulse = useSharedValue(0.6);
    useEffect(() => {
        if (!still) pulse.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    }, [still, pulse]);
    const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));
    const glow = size * 0.16;
    const scale = size / BOX;
    return (
        <Animated.View
            style={[{ position: 'absolute', left: EMBER.x * scale - glow / 2, top: EMBER.y * scale - glow / 2, width: glow, height: glow }, style]}
        >
            <Svg width={glow} height={glow}>
                <Defs>
                    <RadialGradient id={`${id}-ember`} cx="50%" cy="50%" r="50%">
                        <Stop offset={0} stopColor="#ffb347" stopOpacity={0.95} />
                        <Stop offset={0.35} stopColor="#ff5a1f" stopOpacity={0.6} />
                        <Stop offset={1} stopColor="#ff3d00" stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill={`url(#${id}-ember)`} />
            </Svg>
        </Animated.View>
    );
}

/** One soft puff of smoke: rises from the tip, drifts and wavers, grows and fades. */
function Puff({ size, index }: { size: number; index: number }) {
    const id = useId().replace(/:/g, '');
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.set(
            withDelay(index * PUFF_STAGGER, withRepeat(withTiming(1, { duration: PUFF_MS, easing: Easing.out(Easing.quad) }), -1, false)),
        );
    }, [index, progress]);

    const puff = size * 0.36;
    const rise = size * 1.1;
    const drift = size * (index % 2 === 0 ? 0.18 : 0.3);
    const wobble = size * 0.06;
    const phase = index * 1.3;
    const scale = size / BOX;
    const style = useAnimatedStyle(() => puffStyle(progress, { rise, drift, wobble, phase }));
    return (
        <Animated.View
            style={[{ position: 'absolute', left: EMBER.x * scale - puff / 2, top: EMBER.y * scale - puff / 2, width: puff, height: puff }, style]}
        >
            <Svg width={puff} height={puff}>
                <Defs>
                    <RadialGradient id={`${id}-smoke`} cx="50%" cy="50%" r="50%">
                        <Stop offset={0} stopColor="#e2e4e8" stopOpacity={0.8} />
                        <Stop offset={0.6} stopColor="#cfd2d7" stopOpacity={0.35} />
                        <Stop offset={1} stopColor="#c4c7cc" stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Circle cx={puff / 2} cy={puff / 2} r={puff / 2} fill={`url(#${id}-smoke)`} />
            </Svg>
        </Animated.View>
    );
}

function puffStyle(progress: SharedValue<number>, path: { rise: number; drift: number; wobble: number; phase: number }) {
    'worklet';
    const p = progress.get();
    return {
        // Fades in quickly at the tip, out slowly as it spreads.
        opacity: Math.min(1, p * 6) * (1 - p),
        transform: [
            { translateX: path.drift * p + Math.sin(p * Math.PI * 2 + path.phase) * path.wobble * (0.3 + p) },
            { translateY: -path.rise * p },
            { scale: 0.3 + p * 1.8 },
        ],
    };
}

/**
 * An ashtray on the table at night: a few butts and a cigarette burning in it, with a
 * glowing tip and smoke curling up from it (still, without smoke, when the system's "reduce
 * motion" is on). Only decoration: no touches, hidden from screen readers; shows by night only.
 */
export function Ashtray({ size, style }: { size: number; style?: StyleProp<ViewStyle> }) {
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
            testID="ashtray"
            style={[{ position: 'absolute', width: size, height: size }, style]}
        >
            <AshtrayArt size={size} />
            <EmberGlow size={size} still={still} />
            {still ? null : (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
                    {Array.from({ length: PUFFS }, (_, i) => (
                        <Puff key={i} size={size} index={i} />
                    ))}
                </View>
            )}
        </Animated.View>
    );
}

export default Ashtray;

import { useEffect } from 'react';
import {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { EMOTE_MS, type ShownEmote } from '@/lib/emotes';

/**
 * The movement of a big avatar showing an emotion (`shown`, from `useEmotes`): it grows out of the
 * seat, acts the emotion out (hello: waves side to side, angry: shakes, relieved: sinks and sighs,
 * thumbs up: a happy hop) and shrinks away again before `EMOTE_MS` is over. Restarts with every
 * new emotion; with "reduce motion" it just stands there (the face still shows the emotion).
 */
export function useEmoteMotion(shown: ShownEmote | undefined) {
    const still = useReducedMotion();
    const move = useSharedValue(0);
    const grow = useSharedValue(0);
    const emote = shown?.emote ?? null;
    const key = shown?.key ?? 0;

    useEffect(() => {
        if (!emote) {
            grow.set(0);
            return;
        }
        if (still) {
            move.set(0);
            grow.set(1);
            return;
        }
        grow.set(
            withSequence(
                withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
                withDelay(EMOTE_MS - 600, withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) })),
            ),
        );
        const swing = (ms: number, times: number) =>
            withSequence(withRepeat(withSequence(withTiming(1, { duration: ms }), withTiming(-1, { duration: ms })), times), withTiming(0, { duration: ms }));
        if (emote === 'hello') move.set(withDelay(200, swing(220, 4)));
        else if (emote === 'angry') move.set(withDelay(200, swing(60, 12)));
        else if (emote === 'relieved') move.set(withDelay(200, withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1100 }))));
        else move.set(withDelay(200, withSequence(withSpring(1, { damping: 6, stiffness: 180 }), withTiming(0, { duration: 400 }))));
        return () => {
            cancelAnimation(move);
            cancelAnimation(grow);
        };
    }, [emote, key, still, move, grow]);

    return useAnimatedStyle(() => {
        const m = move.get();
        const scale = grow.get();
        const opacity = Math.min(1, scale * 1.5);
        if (emote === 'hello') return { opacity, transform: [{ scale }, { rotate: `${m * 12}deg` }] };
        if (emote === 'angry') return { opacity, transform: [{ scale }, { translateX: m * 5 }] };
        if (emote === 'relieved') return { opacity, transform: [{ scale: scale * (1 - m * 0.06) }, { translateY: m * 6 }] };
        if (emote === 'thumbsUp') return { opacity, transform: [{ scale: scale * (1 + m * 0.08) }, { translateY: -m * 12 }] };
        return { opacity, transform: [{ scale }] };
    });
}

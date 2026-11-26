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

/** How much bigger an avatar gets while it shows an emotion. */
const GROW = 1.3;

/**
 * The movement of an avatar showing an emotion (`shown`, from `useEmotes`): it grows a little and
 * acts it out (hello: waves side to side, angry: shakes, relieved: sinks and sighs, thumbs up: a
 * happy hop), then settles back. Restarts with every new emotion; with "reduce motion" it keeps
 * still (the face still changes).
 */
export function useEmoteMotion(shown: ShownEmote | undefined) {
    const still = useReducedMotion();
    const move = useSharedValue(0);
    const grow = useSharedValue(1);
    const emote = shown?.emote ?? null;
    const key = shown?.key ?? 0;

    useEffect(() => {
        if (still || !emote) {
            move.set(0);
            grow.set(1);
            return;
        }
        grow.set(withSequence(withTiming(GROW, { duration: 180 }), withDelay(EMOTE_MS - 520, withTiming(1, { duration: 300 }))));
        const swing = (ms: number, times: number) =>
            withSequence(withRepeat(withSequence(withTiming(1, { duration: ms }), withTiming(-1, { duration: ms })), times), withTiming(0, { duration: ms }));
        if (emote === 'hello') move.set(swing(200, 4));
        else if (emote === 'angry') move.set(swing(60, 10));
        else if (emote === 'relieved') move.set(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1100 })));
        else move.set(withSequence(withSpring(1, { damping: 5, stiffness: 200 }), withTiming(0, { duration: 400 })));
        return () => {
            cancelAnimation(move);
            cancelAnimation(grow);
        };
    }, [emote, key, still, move, grow]);

    return useAnimatedStyle(() => {
        const m = move.get();
        const scale = grow.get();
        if (emote === 'hello') return { transform: [{ scale }, { rotate: `${m * 14}deg` }] };
        if (emote === 'angry') return { transform: [{ scale }, { translateX: m * 3 }] };
        if (emote === 'relieved') return { transform: [{ scale: scale - m * 0.06 }, { translateY: m * 3 }] };
        if (emote === 'thumbsUp') return { transform: [{ scale: scale + m * 0.1 }, { translateY: -m * 6 }] };
        return { transform: [{ scale }] };
    });
}

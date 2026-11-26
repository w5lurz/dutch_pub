import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    FadeOut,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import type { Emote } from '@dutch-pub/shared';

import { Avatar } from '@/components/ui';
import i18n from '@/i18n';

import { measure, type ViewRef } from './CardDrag';

/** The emoji of each emotion. */
export const EMOTE_EMOJI: Record<Emote, string> = { hello: '👋', angry: '😠', relieved: '😌', thumbsUp: '👍' };

const AVATAR = 30;
const HEIGHT = AVATAR + 14;

type EmoteBubbleProps = {
    name: string;
    avatarId?: string | null;
    emote: Emote;
    /**
     * A player's view: yours is your avatar and name, the others' their seat (the bubble goes just
     * above it); `null` gives the game table's root view (the bubble's coordinates are relative to it).
     */
    viewOf: (name: string | null) => ViewRef | null;
};

/**
 * An emotion above a player's name, for a few seconds (`EMOTE_MS`): a speech bubble with the
 * player's avatar acting it out (waving, shaking, sighing, a happy hop) and its emoji. With
 * "reduce motion" the avatar keeps still. No touches.
 */
export function EmoteBubble({ name, avatarId, emote, viewOf }: EmoteBubbleProps) {
    const window = useWindowDimensions();
    const still = useReducedMotion();
    const [place, setPlace] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([measure(viewOf(null)), measure(viewOf(name))]).then(([rootRect, rect]) => {
            if (cancelled || !rootRect || !rect) return;
            const width = AVATAR + 50;
            const centre = rect.x - rootRect.x + rect.width / 2;
            const left = Math.min(rootRect.width - width - 4, Math.max(4, centre - width / 2));
            // Above the player; at the top edge (a top seat) it can't be: then just below its top.
            const above = rect.y - rootRect.y - HEIGHT - 6;
            setPlace({ left, top: above >= 4 ? above : rect.y - rootRect.y + 4 });
        });
        return () => {
            cancelled = true;
        };
    }, [viewOf, name, window.width, window.height]);

    const move = useSharedValue(0);
    useEffect(() => {
        if (still) return;
        const loop = (step: number, ms: number, times: number) =>
            withRepeat(withSequence(withTiming(step, { duration: ms }), withTiming(-step, { duration: ms })), times, true);
        if (emote === 'hello') move.set(withSequence(loop(1, 180, 6), withTiming(0, { duration: 180 })));
        else if (emote === 'angry') move.set(withSequence(loop(1, 60, 14), withTiming(0, { duration: 60 })));
        else if (emote === 'relieved') move.set(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1100 })));
        else move.set(withSequence(withSpring(1, { damping: 4, stiffness: 220 }), withTiming(0, { duration: 400 })));
        return () => cancelAnimation(move);
    }, [emote, still, move]);

    const acting = useAnimatedStyle(() => {
        const m = move.get();
        if (emote === 'hello') return { transform: [{ rotate: `${m * 14}deg` }] };
        if (emote === 'angry') return { transform: [{ translateX: m * 3 }] };
        if (emote === 'relieved') return { transform: [{ translateY: m * 3 }, { scale: 1 - m * 0.06 }] };
        return { transform: [{ translateY: -m * 6 }, { scale: 1 + m * 0.12 }] };
    });

    if (!place) return null;
    const angry = emote === 'angry';
    return (
        <Animated.View
            pointerEvents="none"
            entering={ZoomIn.springify().damping(14)}
            exiting={FadeOut.duration(250)}
            accessibilityLiveRegion="polite"
            accessibilityLabel={i18n.t('game.emote.shown', { name, emote: i18n.t(`game.emote.${emote}`) })}
            style={{ position: 'absolute', left: place.left, top: place.top, alignItems: 'center' }}
        >
            <View
                className="flex-row items-center gap-1 rounded-2xl px-2"
                style={{
                    height: HEIGHT - 6,
                    backgroundColor: angry ? '#fee2e2' : '#ffffff',
                    borderWidth: 2,
                    borderColor: angry ? '#dc2626' : '#d1d5db',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                }}
            >
                <Animated.View style={acting}>
                    <Avatar username={name} avatar={avatarId} size={AVATAR} />
                </Animated.View>
                <Text style={{ fontSize: 22 }}>{EMOTE_EMOJI[emote]}</Text>
            </View>
            {/* The bubble's tail, pointing at the player. */}
            <View
                style={{
                    width: 10,
                    height: 10,
                    marginTop: -6,
                    transform: [{ rotate: '45deg' }],
                    backgroundColor: angry ? '#fee2e2' : '#ffffff',
                    borderRightWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: angry ? '#dc2626' : '#d1d5db',
                }}
            />
        </Animated.View>
    );
}

export default EmoteBubble;

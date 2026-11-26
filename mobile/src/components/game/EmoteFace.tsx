import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from '@/components/ui';
import type { ShownEmote } from '@/lib/emotes';

import { measure, type ViewRef } from './CardDrag';
import { useEmoteMotion } from './emoteMotion';

type EmoteFaceProps = {
    name: string;
    avatarId?: string | null;
    shown: ShownEmote;
    /** A player's avatar view (`null`: the game table's root view, the coordinates' origin). */
    viewOf: (name: string | null) => ViewRef | null;
};

/**
 * A player's emotion, big enough to see: a large copy of their avatar grows out of their seat's
 * avatar, makes the face and acts it out (`useEmoteMotion`), then shrinks back. Centred on the
 * avatar, kept inside the table. No touches.
 */
export function EmoteFace({ name, avatarId, shown, viewOf }: EmoteFaceProps) {
    const window = useWindowDimensions();
    const size = Math.round(Math.min(120, Math.max(84, Math.min(window.width, window.height) * 0.24)));
    const acting = useEmoteMotion(shown);
    const [place, setPlace] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([measure(viewOf(null)), measure(viewOf(name))]).then(([root, rect]) => {
            if (cancelled || !root || !rect) return;
            const box = size + 8;
            const clamp = (value: number, max: number) => Math.min(max - box - 4, Math.max(4, value));
            setPlace({
                left: clamp(rect.x - root.x + rect.width / 2 - box / 2, root.width),
                top: clamp(rect.y - root.y + rect.height / 2 - box / 2, root.height),
            });
        });
        return () => {
            cancelled = true;
        };
    }, [viewOf, name, size, window.width, window.height]);

    if (!place) return null;
    return (
        <Animated.View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[
                {
                    position: 'absolute',
                    left: place.left,
                    top: place.top,
                    padding: 4,
                    borderRadius: (size + 8) / 2,
                    backgroundColor: '#ffffff',
                    elevation: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                },
                acting,
            ]}
        >
            <Avatar username={name} avatar={avatarId} size={size} mood={shown.emote} />
        </Animated.View>
    );
}

export default EmoteFace;

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EMOTES, type Emote } from '@dutch-pub/shared';

import { Avatar } from '@/components/ui';
import i18n from '@/i18n';

import { measure, type ViewRef } from './CardDrag';

const BUTTON = 56;
const FACE = 34;

type EmotePickerProps = {
    username?: string;
    /** Your chosen avatar id: each button shows your avatar with that emotion. */
    avatarId?: string | null;
    /** Your avatar and name for your username (the picker opens just above it); `null`: the game table's root view. */
    viewOf: (name: string | null) => ViewRef | null;
    onPick: (emote: Emote) => void;
    onClose: () => void;
};

/**
 * The emotions you can show (tap your avatar or name): a row of buttons above it, each with
 * your avatar's face showing it. Tapping anywhere else closes it.
 */
export function EmotePicker({ username, avatarId, viewOf, onPick, onClose }: EmotePickerProps) {
    const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
    useEffect(() => {
        let cancelled = false;
        Promise.all([measure(viewOf(null)), measure(viewOf(username ?? ''))]).then(([rootRect, rect]) => {
            if (cancelled || !rootRect || !rect) return;
            const width = EMOTES.length * (BUTTON + 6) + 12;
            const centre = rect.x - rootRect.x + rect.width / 2;
            setPlace({
                left: Math.min(rootRect.width - width - 4, Math.max(4, centre - width / 2)),
                top: Math.max(4, rect.y - rootRect.y - BUTTON - 24),
            });
        });
        return () => {
            cancelled = true;
        };
    }, [viewOf, username]);

    return (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18n.t('common.close')}
                onPress={onClose}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            {place ? (
                <Animated.View
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(150)}
                    accessibilityRole="menu"
                    accessibilityLabel={i18n.t('game.emote.pick')}
                    style={{
                        flexDirection: 'row',
                        gap: 6,
                        borderRadius: 16,
                        padding: 6,
                        position: 'absolute',
                        left: place.left,
                        top: place.top,
                        backgroundColor: 'rgba(17, 24, 39, 0.92)',
                        elevation: 12,
                        shadowColor: '#000',
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 3 },
                    }}
                >
                    {EMOTES.map(emote => (
                        <Pressable
                            key={emote}
                            accessibilityRole="menuitem"
                            accessibilityLabel={i18n.t(`game.emote.${emote}`)}
                            testID={`emote-${emote}`}
                            onPress={() => onPick(emote)}
                            className="items-center justify-center rounded-xl active:opacity-60"
                            style={{ width: BUTTON, height: BUTTON, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                        >
                            <Avatar username={username ?? '?'} avatar={avatarId} size={FACE} mood={emote} />
                            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color: '#e5e7eb', fontSize: 9, fontWeight: '600', marginTop: 2, maxWidth: BUTTON - 4 }}>
                                {i18n.t(`game.emote.${emote}`)}
                            </Text>
                        </Pressable>
                    ))}
                </Animated.View>
            ) : null}
        </View>
    );
}

export default EmotePicker;

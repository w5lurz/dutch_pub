import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { Trans } from 'react-i18next';
import type { PickedUp } from '@dutch-pub/shared';

import i18n from '@/i18n';

type PickUpBannerProps = {
    pickedUp: PickedUp;
    /** Your username: your own pick-up says "You". */
    username?: string;
};

/**
 * Shown to everyone during the pause after a pick-up (`game.pickedUp`, a few seconds): who picked
 * up the pile and how many cards, big over the upper part of the table. No touches. Big pick-ups
 * get the librarian instead (`Librarian`).
 */
export function PickUpBanner({ pickedUp, username }: PickUpBannerProps) {
    const window = useWindowDimensions();
    const you = pickedUp.username === username;
    const cards = i18n.t('game.pickUp.cards', { count: pickedUp.count });
    const title = you ? i18n.t('game.pickUp.you') : i18n.t('game.pickUp.title', { name: pickedUp.username }).replace(/<\/?n>/g, '');
    return (
        <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: window.height * 0.2, alignItems: 'center' }}
        >
            <Animated.View
                entering={ZoomIn.springify().damping(14)}
                exiting={FadeOut.duration(250)}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                accessibilityLabel={`${title} ${cards}`}
                className="items-center rounded-2xl px-5 py-3"
                style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    borderWidth: 2,
                    borderColor: '#fbbf24',
                    maxWidth: window.width * 0.9,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 12,
                }}
            >
                <Text numberOfLines={2} style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                    {you ? (
                        title
                    ) : (
                        <Trans
                            i18nKey="game.pickUp.title"
                            values={{ name: pickedUp.username }}
                            components={{ n: <Text style={{ color: '#fde68a' }} /> }}
                        />
                    )}
                </Text>
                <Text style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{cards}</Text>
            </Animated.View>
        </View>
    );
}

export default PickUpBanner;

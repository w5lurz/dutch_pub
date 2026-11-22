import { Text, View } from 'react-native';
import i18n from '@/i18n';

import { Button } from '@/components/ui';

type SwapPanelProps = {
    /** You are done swapping. */
    ready: boolean;
    /** Players done swapping, of all players (you included). */
    readyCount: number;
    playerCount: number;
    onReady: () => void;
    /** A short window (a phone turned sideways): the text on the left, the count and Ready on the right. */
    compact?: boolean;
};

/**
 * The swap phase, in the middle of the table instead of the piles (a full deck, nothing laid
 * yet): how to swap a hand card with a face-up card, and the Ready button; once you are
 * ready, how many players are. Literal colours (the table has its own palette).
 */
export function SwapPanel({ ready, readyCount, playerCount, onReady, compact = false }: SwapPanelProps) {
    if (compact) {
        return (
            <View
                accessibilityLiveRegion="polite"
                className="mx-4 max-w-xl flex-row items-center gap-3 rounded-2xl px-3 py-2"
                style={{ backgroundColor: 'rgba(17, 24, 39, 0.82)' }}
            >
                <View className="flex-1 gap-0.5">
                    <Text style={{ color: '#fde68a', fontSize: 14, fontWeight: '800' }}>{i18n.t('game.swap.title')}</Text>
                    <Text style={{ color: '#ffffff', fontSize: 12 }}>{ready ? i18n.t('game.swap.waiting') : i18n.t('game.swap.howTo')}</Text>
                </View>
                <View className="items-center gap-1">
                    <Text style={{ color: '#d1d5db', fontSize: 12, fontWeight: '600' }}>
                        {i18n.t('game.swap.readyCount', { ready: readyCount, players: playerCount })}
                    </Text>
                    {ready ? null : <Button label={i18n.t('game.swap.ready')} variant="green" size="sm" onPress={onReady} testID="swap-ready" />}
                </View>
            </View>
        );
    }
    return (
        <View
            accessibilityLiveRegion="polite"
            className="mx-4 max-w-sm items-center gap-2 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(17, 24, 39, 0.82)' }}
        >
            <Text style={{ color: '#fde68a', fontSize: 16, fontWeight: '800' }}>{i18n.t('game.swap.title')}</Text>
            <Text style={{ color: '#ffffff', fontSize: 13, textAlign: 'center' }}>
                {ready
                    ? i18n.t('game.swap.waiting')
                    : i18n.t('game.swap.howTo')}
            </Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, fontWeight: '600' }}>
                {i18n.t('game.swap.readyCount', { ready: readyCount, players: playerCount })}
            </Text>
            {ready ? null : <Button label={i18n.t('game.swap.ready')} variant="green" size="sm" onPress={onReady} testID="swap-ready" />}
        </View>
    );
}

export default SwapPanel;

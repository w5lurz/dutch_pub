import { Text, View } from 'react-native';

import { Button } from '@/components/ui';

type SwapPanelProps = {
    /** You are done swapping. */
    ready: boolean;
    /** Players done swapping, of all players (you included). */
    readyCount: number;
    playerCount: number;
    onReady: () => void;
};

/**
 * The swap phase, in the middle of the table instead of the piles (a full deck, nothing laid
 * yet): how to swap a hand card with a face-up card, and the Ready button; once you are
 * ready, how many players are. Literal colours (the table has its own palette).
 */
export function SwapPanel({ ready, readyCount, playerCount, onReady }: SwapPanelProps) {
    return (
        <View
            accessibilityLiveRegion="polite"
            className="mx-4 max-w-sm items-center gap-2 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(17, 24, 39, 0.82)' }}
        >
            <Text style={{ color: '#fde68a', fontSize: 16, fontWeight: '800' }}>Swap your cards</Text>
            <Text style={{ color: '#ffffff', fontSize: 13, textAlign: 'center' }}>
                {ready
                    ? 'You are ready. The game starts when everyone is.'
                    : 'Tap a card in your hand, then one of your face-up cards, to swap them. Tap Ready when you are done.'}
            </Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, fontWeight: '600' }}>
                {readyCount} / {playerCount} ready
            </Text>
            {ready ? null : <Button label="Ready" variant="green" size="sm" onPress={onReady} testID="swap-ready" />}
        </View>
    );
}

export default SwapPanel;

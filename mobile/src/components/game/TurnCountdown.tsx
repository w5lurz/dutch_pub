import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { Game } from '@dutch-pub/shared';

/** From this many seconds left the countdown turns red. */
export const TURN_HURRY_SECONDS = 5;

/**
 * Whole seconds left of the current turn (rounded up), counting down on this device; null
 * while no turn is timed (room timer off, swap phase, missed blind card, older server).
 * The server sends the ms left with each view of `game`, so a new view restarts the count
 * (no clock offset between the phone and the server is involved).
 */
export function useTurnSecondsLeft(game: Pick<Game, 'turnTimeLeft'>): number | null {
    const timeLeft = game.turnTimeLeft;
    // The ms left as last counted, for this view (keyed by the view itself: two views in a row
    // can carry the same ms left, e.g. two fresh turns).
    const [count, setCount] = useState<{ view: object; left: number } | null>(null);
    useEffect(() => {
        if (timeLeft == null) return;
        const start = Date.now();
        const update = () => {
            const left = Math.max(0, timeLeft - (Date.now() - start));
            setCount({ view: game, left });
            if (left === 0) clearInterval(timer);
        };
        const timer = setInterval(update, 250);
        return () => clearInterval(timer);
    }, [game, timeLeft]);
    if (timeLeft == null) return null;
    const left = count?.view === game ? count.left : timeLeft;
    return Math.ceil(left / 1000);
}

/**
 * The seconds left of a turn as a small pill (next to the name of whoever is on turn): dark,
 * red for the last few seconds. Literal colours: the table's palette doesn't follow the app's.
 */
export function TurnCountdown({ seconds, mine = false }: { seconds: number; mine?: boolean }) {
    const hurry = seconds <= TURN_HURRY_SECONDS;
    return (
        <View
            accessible
            accessibilityLabel={`${seconds} seconds left${mine ? ' of your turn' : ''}`}
            accessibilityLiveRegion={hurry ? 'polite' : 'none'}
            testID="turn-countdown"
            style={{
                backgroundColor: hurry ? '#dc2626' : 'rgba(17, 24, 39, 0.75)',
                borderRadius: 999,
                paddingHorizontal: 6,
                paddingVertical: 1,
                minWidth: 30,
                alignItems: 'center',
            }}
        >
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{seconds}s</Text>
        </View>
    );
}

export default TurnCountdown;

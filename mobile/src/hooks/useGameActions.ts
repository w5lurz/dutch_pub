import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { canLayCard, type TCard } from '@dutch-pub/shared';

import { pileDrawSignature } from '@/components/game/autoDraw';
import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

/** Minimum time between two chat messages (as on the web). */
export const CHAT_COOLDOWN_MS = 3000;

/**
 * The player's moves in the running game (`user.inGame` is the room id):
 * - `layCard(card, cardIndex, touchable)`: `card` is a hand / face-up card, or the index of
 *   a face-down card. Checked locally first (turn, `touchable`, `canLayCard`); the server
 *   validates again and answers `lay-card-rejected` (toasted by GameSync). Returns whether
 *   the card was sent (false: refused locally, with a toast).
 * - Auto pick-up: on your turn with no playable card it emits `draw-cards` once per state.
 * - `sendMessage(text)` with a 3 s cooldown (`canSend`).
 *
 * Call it once, in the game screen (it owns the auto pick-up effect), and pass the
 * callbacks down.
 */
export function useGameActions() {
    const { socket, connected } = useSocket();
    const dispatch = useAppDispatch();
    const username = useAppSelector(state => state.user?.username);
    const roomId = useAppSelector(state => state.user?.inGame);
    const game = useAppSelector(state => state.game);
    const active = !!game.active;
    const laidCards = game.laidCards;

    const layCard = useCallback(
        (card: TCard | number, cardIndex: number, touchable = true): boolean => {
            if (roomId === undefined) return false;
            if (!active || !touchable) {
                dispatch(setToast({ id: `place-card-failed-${Date.now()}`, type: 'warning', message: 'You cannot place that card!', duration: 3000 }));
                return false;
            }
            if (!canLayCard(card, laidCards)) {
                dispatch(setToast({ id: `lay-card-failed-${Date.now()}`, type: 'sad', message: 'You cannot lay that card.', duration: 3000 }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
                return false;
            }
            socket.emit('lay-card', { card, cardIndex, roomId, username });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            return true;
        },
        [active, laidCards, roomId, username, socket, dispatch],
    );

    // Auto pick-up. `drawnFor` holds the signature of the state we already sent `draw-cards`
    // for; it is cleared once a draw is no longer needed, and while offline (an emit lost to
    // a disconnect is re-sent after reconnecting, if the re-synced state still needs it).
    const drawnFor = useRef<string | null>(null);
    useEffect(() => {
        const signature = connected ? pileDrawSignature(roomId, game) : null;
        if (signature === null) {
            drawnFor.current = null;
            return;
        }
        if (drawnFor.current === signature || roomId === undefined) return;
        drawnFor.current = signature;
        socket.emit('draw-cards', { roomId, username });
        dispatch(
            setToast({
                id: `cards-drawn-${Date.now()}`,
                type: 'sad',
                message: 'You could not lay any card, so you picked up the pile.',
                duration: 3000,
            }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }, [connected, roomId, game, username, socket, dispatch]);

    // Chat cooldown.
    const [canSend, setCanSend] = useState(true);
    const cooldownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(cooldownTimer.current), []);

    const sendMessage = useCallback(
        (text: string): boolean => {
            const message = text.trim();
            if (!message || !canSend || roomId === undefined) return false;
            socket.emit('send-message', { roomId, username, message });
            setCanSend(false);
            clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => setCanSend(true), CHAT_COOLDOWN_MS);
            return true;
        },
        [canSend, roomId, username, socket],
    );

    return { layCard, sendMessage, canSend, active, username, roomId };
}

export default useGameActions;

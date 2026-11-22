import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { canLayCard, type Cards, type TCard } from '@dutch-pub/shared';

import { pileDrawSignature } from '@/components/game/autoDraw';
import { useRoomSettings } from '@/hooks/useRoomSettings';
import i18n from '@/i18n';
import { playSound } from '@/lib/sounds';
import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

/** Minimum time between two chat messages (as on the web). */
export const CHAT_COOLDOWN_MS = 3000;

/**
 * The player's moves in the running game (`user.inGame` is the room id):
 * - `layCard(card, cardIndex, touchable)`: `card` is a hand / face-up card, several of them
 *   of the same value (laid together), or the index of a face-down card. Checked locally first (turn, `touchable`, `canLayCard`); the server
 *   validates again and answers `lay-card-rejected` (toasted by GameSync). Returns whether
 *   the card was sent (false: refused locally, with a toast).
 * - Auto pick-up: on your turn with no playable card it emits `draw-cards` once per state.
 * - `sendMessage(text)` with a 3 s cooldown (`canSend`).
 * - `stopGame()`: the room owner ends the game for everyone (`canStop`: you own the room).
 * - Swap phase: `swapCards(hand, faceUp)` trades a hand card with a face-up card, `setReady()`
 *   says you are done (no moves until everyone is).
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
    // The room's house rules that change which cards fit.
    const { nineOnMagic } = useRoomSettings();
    const cardRules = useMemo(() => ({ nineOnMagic }), [nineOnMagic]);

    const layCard = useCallback(
        (card: TCard | number | Cards, cardIndex: number, touchable = true, call?: string): boolean => {
            if (roomId === undefined) return false;
            if (game.phase === 'swap') {
                dispatch(
                    setToast({ id: `swap-first-${Date.now()}`, type: 'info', message: i18n.t('server.swapFirst'), duration: 3000 }),
                );
                return false;
            }
            // A missed blind card is being shown: the pile is about to be picked up.
            if (game.blindMiss) return false;
            // Several cards laid together: all of the same value, the first must fit the pile.
            const several = Array.isArray(card) ? card : null;
            const first = several ? several[0] : (card as TCard | number);
            if (several && (several.length === 0 || several.some(other => other.value !== several[0].value))) {
                dispatch(
                    setToast({
                        id: `lay-cards-mixed-${Date.now()}`,
                        type: 'warning',
                        message: i18n.t('server.sameValue'),
                        duration: 3000,
                    }),
                );
                return false;
            }
            if (!active) {
                dispatch(setToast({ id: `not-your-turn-${Date.now()}`, type: 'warning', message: i18n.t('game.toast.notYourTurnYet'), duration: 3000 }));
                return false;
            }
            if (!touchable) {
                dispatch(setToast({ id: `place-card-failed-${Date.now()}`, type: 'warning', message: i18n.t('game.toast.cannotPlace'), duration: 3000 }));
                return false;
            }
            if (first === undefined || !canLayCard(first, laidCards, cardRules)) {
                dispatch(setToast({ id: `lay-card-failed-${Date.now()}`, type: 'sad', message: i18n.t('server.cannotLay'), duration: 3000 }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
                playSound('invalid');
                return false;
            }
            socket.emit('lay-card', {
                card: first,
                ...(several && several.length > 1 ? { cards: several } : {}),
                ...(call ? { call } : {}),
                cardIndex,
                roomId,
                username,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            return true;
        },
        [active, laidCards, roomId, username, socket, dispatch, game.phase, game.blindMiss, cardRules],
    );

    // Swap phase: trade a hand card with a face-up card, and say when you are done.
    const swapping = game.phase === 'swap' && !game.ready;
    const swapCards = useCallback(
        (hand: TCard, faceUp: TCard) => {
            if (roomId !== undefined && swapping) socket.emit('swap-cards', { roomId, username, hand, faceUp });
        },
        [roomId, swapping, username, socket],
    );
    const setReady = useCallback(() => {
        if (roomId !== undefined && swapping) socket.emit('player-ready', { roomId, username });
    }, [roomId, swapping, username, socket]);

    // Auto pick-up. `drawnFor` holds the signature of the state we already sent `draw-cards`
    // for; it is cleared once a draw is no longer needed, and while offline (an emit lost to
    // a disconnect is re-sent after reconnecting, if the re-synced state still needs it).
    const drawnFor = useRef<string | null>(null);
    useEffect(() => {
        const signature = connected ? pileDrawSignature(roomId, game, cardRules) : null;
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
                message: i18n.t('game.toast.autoPickedUp'),
                duration: 3000,
            }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }, [connected, roomId, game, username, socket, dispatch, cardRules]);

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

    // Stopping the game: only the room's owner (the server checks again). Everyone then gets
    // `game-stopped` (GameSync), which ends the game on every device.
    const owner = useAppSelector(state => (roomId !== undefined ? state.rooms[roomId]?.owner : undefined));
    const canStop = roomId !== undefined && !!username && owner === username;
    const stopGame = useCallback(() => {
        if (canStop && roomId !== undefined) socket.emit('stop-game', roomId);
    }, [canStop, roomId, socket]);

    return { layCard, sendMessage, canSend, active, username, roomId, canStop, stopGame, swapCards, setReady };
}

export default useGameActions;

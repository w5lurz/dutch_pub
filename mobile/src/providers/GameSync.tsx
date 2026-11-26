import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ChatMessage, Game, GameState, TRooms } from '@dutch-pub/shared';

import i18n, { serverMessage } from '@/i18n';
import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { setMessages } from '@/store/chatSlice';
import { initialState as emptyGame, updateGame } from '@/store/gameSlice';
import { clearNotifications, registerForPush } from '@/lib/notifications';
import { showEmote } from '@/lib/emotes';
import { playSound } from '@/lib/sounds';
import { setLastGameEnd, setToast, setWinner } from '@/store/generalSlice';
import { setRooms } from '@/store/roomsSlice';
import { setInGame } from '@/store/userSlice';

/** How long the "won the game" toast stays before the game is cleared (the winner's shot glass slides meanwhile). */
const GAME_WON_DELAY_MS = 4500;

const haptic = (type: Haptics.NotificationFeedbackType) => {
    Haptics.notificationAsync(type).catch(() => {}); // unsupported on some platforms (web)
};

/**
 * Mirrors every server event into the store, so screens only read the store and emit.
 * - Rooms: `rooms-listed`, `joined-room`, `left-room`, `room-deleted`.
 * - Game: `game-started` (sets `user.inGame`, which redirects to /game), `card-laid`,
 *   `cards-drawn`, `game-won` (toast and the winner's shot glass, then clears the game after 4.5 s), `game-stopped` (the
 *   owner ended it: toast, clears the game at once), `lay-card-rejected`.
 * - Chat: `message-sent`. Re-sync: `game-state`.
 * - On every (re)connect it emits `list-rooms`, and `get-game-state` for a signed-in user
 *   (the server has already re-bound the user's seat to the new socket by then).
 * - When the app returns to the foreground it re-syncs too (events may have been missed
 *   while JS was suspended), or reconnects if the socket dropped.
 * Mount once, inside <SocketProvider>.
 */
export function GameSync() {
    const { socket, connected } = useSocket();
    const dispatch = useAppDispatch();
    const signedIn = useAppSelector(state => state.user !== null);
    const username = useAppSelector(state => state.user?.username);

    // Read inside listeners without re-subscribing (which would cancel the game-won timer).
    const usernameRef = useRef(username);
    useEffect(() => {
        usernameRef.current = username;
    }, [username]);

    useEffect(() => {
        let gameWonTimer: ReturnType<typeof setTimeout> | undefined;

        const onRooms = (rooms: TRooms) => dispatch(setRooms(rooms));
        const onGameState = (state: GameState) => {
            dispatch(setRooms(state.rooms));
            dispatch(setMessages(state.messages));
            dispatch(updateGame(state.game ?? emptyGame));
            // `inGame` = the room whose game is running (as on the web).
            dispatch(setInGame(state.game && state.roomId !== null ? state.roomId : undefined));
        };
        const onGameStarted = (game: Game, rooms: TRooms, roomId: number) => {
            // "Your turn" notifications while the app is away: the permission is asked here, where it makes sense.
            registerForPush({ ask: true });
            dispatch(setLastGameEnd(null));
            dispatch(setWinner(null));
            dispatch(setRooms(rooms));
            dispatch(updateGame(game));
            dispatch(setInGame(roomId));
        };
        const onGameUpdated = (game: Game, rooms: TRooms) => {
            dispatch(updateGame(game));
            dispatch(setRooms(rooms));
        };
        // Who won shows in the middle of the table (`WinBanner`, from `setWinner`) until the game closes.
        const onGameWon = (winner: string, rooms: TRooms) => {
            haptic(Haptics.NotificationFeedbackType.Success);
            dispatch(setLastGameEnd('won'));
            dispatch(setWinner(winner));
            clearTimeout(gameWonTimer);
            gameWonTimer = setTimeout(() => {
                dispatch(setRooms(rooms));
                dispatch(updateGame(emptyGame));
                dispatch(setInGame(undefined));
                dispatch(setWinner(null));
            }, GAME_WON_DELAY_MS);
        };
        // The room owner stopped the game, or the server did because the owner was gone for 2
        // minutes: leave it at once (nobody won, so nothing to wait for).
        const onGameStopped = (owner: string, rooms: TRooms, reason?: 'owner-left') => {
            clearTimeout(gameWonTimer);
            dispatch(
                setToast({
                    id: `game-stopped-${Date.now()}`,
                    type: 'info',
                    message:
                        reason === 'owner-left'
                            ? i18n.t('game.toast.stoppedOwnerGone', { owner })
                            : owner === usernameRef.current
                              ? i18n.t('game.toast.youStopped')
                              : i18n.t('game.toast.playerStopped', { owner }),
                    duration: reason === 'owner-left' ? 5000 : 3000,
                }),
            );
            haptic(Haptics.NotificationFeedbackType.Warning);
            dispatch(setLastGameEnd('stopped'));
            dispatch(setWinner(null));
            dispatch(setRooms(rooms));
            dispatch(updateGame(emptyGame));
            dispatch(setInGame(undefined));
        };
        // A player ran out of time and their turn was skipped (the new turn arrives in `game-updated`).
        const onTurnTimedOut = (skipped: string) => {
            const mine = skipped === usernameRef.current;
            dispatch(
                setToast({
                    id: `turn-timed-out-${Date.now()}`,
                    type: mine ? 'sad' : 'info',
                    message: mine ? i18n.t('game.toast.yourTimeUp') : i18n.t('game.toast.playerTimeUp', { name: skipped }),
                    duration: 3000,
                }),
            );
            if (mine) haptic(Haptics.NotificationFeedbackType.Warning);
        };
        const onLayCardRejected = (reason: string) => {
            dispatch(setToast({ id: `lay-card-rejected-${Date.now()}`, type: 'sad', message: serverMessage(reason), duration: 3000 }));
            playSound('invalid');
            haptic(Haptics.NotificationFeedbackType.Error);
        };
        const onMessageSent = (messages: ChatMessage[]) => dispatch(setMessages(messages));

        socket.on('rooms-listed', onRooms);
        socket.on('joined-room', onRooms);
        socket.on('left-room', onRooms);
        socket.on('room-deleted', onRooms);
        socket.on('game-started', onGameStarted);
        socket.on('card-laid', onGameUpdated);
        socket.on('cards-drawn', onGameUpdated);
        socket.on('game-updated', onGameUpdated);
        socket.on('game-won', onGameWon);
        socket.on('game-stopped', onGameStopped);
        socket.on('turn-timed-out', onTurnTimedOut);
        socket.on('lay-card-rejected', onLayCardRejected);
        socket.on('game-state', onGameState);
        socket.on('message-sent', onMessageSent);
        socket.on('emote-sent', showEmote);
        return () => {
            clearTimeout(gameWonTimer);
            socket.off('rooms-listed', onRooms);
            socket.off('joined-room', onRooms);
            socket.off('left-room', onRooms);
            socket.off('room-deleted', onRooms);
            socket.off('game-started', onGameStarted);
            socket.off('card-laid', onGameUpdated);
            socket.off('cards-drawn', onGameUpdated);
            socket.off('game-updated', onGameUpdated);
            socket.off('game-won', onGameWon);
            socket.off('game-stopped', onGameStopped);
            socket.off('turn-timed-out', onTurnTimedOut);
            socket.off('lay-card-rejected', onLayCardRejected);
            socket.off('game-state', onGameState);
            socket.off('message-sent', onMessageSent);
            socket.off('emote-sent', showEmote);
        };
    }, [socket, dispatch]);

    // Room list for everyone (also anonymous users), on every (re)connect.
    useEffect(() => {
        if (connected) {
            socket.emit('list-rooms');
        }
    }, [socket, connected]);

    useEffect(() => {
        if (connected && signedIn) {
            socket.emit('get-game-state');
            // The server takes a new socket for an open app; it may have (re)connected in the background.
            if (AppState.currentState === 'background') socket.emit('app-state', 'background');
        }
    }, [socket, connected, signedIn]);

    // This phone's push token for whoever is logged in (asking for the permission waits for a game).
    useEffect(() => {
        if (username) registerForPush();
    }, [username]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            // While away, the server sends "your turn" as a notification instead.
            if (nextState === 'background' && socket.connected) socket.emit('app-state', 'background');
            if (nextState !== 'active') return;
            clearNotifications();
            if (socket.connected) socket.emit('app-state', 'active');
            if (!socket.connected) {
                socket.connect(); // `connect` then triggers the re-sync above
            } else if (signedIn) {
                socket.emit('get-game-state');
            } else {
                socket.emit('list-rooms');
            }
        });
        return () => subscription.remove();
    }, [socket, signedIn]);

    return null;
}

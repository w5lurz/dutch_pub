import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { ChatMessage, GameState } from '@dutch-pub/shared';

import { useSocket } from '@/providers/SocketProvider';
import { useAppDispatch, useAppSelector } from '@/store';
import { setMessages } from '@/store/chatSlice';
import { initialState as emptyGame, updateGame } from '@/store/gameSlice';
import { setRooms } from '@/store/roomsSlice';
import { setInGame } from '@/store/userSlice';

/**
 * Keeps the store in sync with the server across reconnects (PLAN.md Step 4).
 * - On every (re)connect of a signed-in user it asks for `get-game-state`. The server
 *   has already re-bound the user's seat to the new socket by then.
 * - When the app returns to the foreground it re-syncs too (events may have been
 *   missed while JS was suspended), or reconnects if the socket dropped.
 * Mount once, inside <SocketProvider>.
 */
export function GameSync() {
    const { socket, connected } = useSocket();
    const dispatch = useAppDispatch();
    const signedIn = useAppSelector(state => state.user !== null);

    useEffect(() => {
        const onGameState = (state: GameState) => {
            dispatch(setRooms(state.rooms));
            dispatch(setMessages(state.messages));
            dispatch(updateGame(state.game ?? emptyGame));
            // `inGame` = the room whose game is running (as on the web).
            dispatch(setInGame(state.game && state.roomId !== null ? state.roomId : undefined));
        };
        const onMessageSent = (messages: ChatMessage[]) => dispatch(setMessages(messages));

        socket.on('game-state', onGameState);
        socket.on('message-sent', onMessageSent);
        return () => {
            socket.off('game-state', onGameState);
            socket.off('message-sent', onMessageSent);
        };
    }, [socket, dispatch]);

    useEffect(() => {
        if (connected && signedIn) {
            socket.emit('get-game-state');
        }
    }, [socket, connected, signedIn]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState !== 'active') return;
            if (!socket.connected) {
                socket.connect(); // `connect` then triggers the re-sync above
            } else if (signedIn) {
                socket.emit('get-game-state');
            }
        });
        return () => subscription.remove();
    }, [socket, signedIn]);

    return null;
}

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, Pressable, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { GameTable, TableThemeProvider, useAnyOrientationWhileFocused } from '@/components/game';
import { useGameActions } from '@/hooks/useGameActions';
import { useRoomSettings } from '@/hooks/useRoomSettings';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

/**
 * The running game. Opens in portrait; while it is focused the orientation follows the device,
 * so turning a phone switches the table to its wide layout (the rest of the app is portrait).
 * Connects the store and socket actions to `GameTable`, which draws the table. The root
 * layout brings the user here when `user.inGame` is set; this screen leaves when it clears
 * (game won, or a re-sync without a game) and blocks Android's back button meanwhile.
 */
export default function GameScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const game = useAppSelector(state => state.game);
    const inGame = useAppSelector(state => state.user?.inGame);
    const messages = useAppSelector(state => state.chat);
    // Turn order for the seats: the room's player list (the server takes turns in that order).
    const roomPlayers = useAppSelector(state => (inGame !== undefined ? state.rooms[inGame]?.players : undefined));
    const playerOrder = useMemo(() => roomPlayers?.map(player => player.username), [roomPlayers]);
    const { layCard, sendMessage, canSend, active, username } = useGameActions();
    // Chosen avatars from the room (kept current by the server); yours from your account, so a
    // change shows at once.
    const ownAvatar = useAppSelector(state => state.user?.avatar);
    const avatars = useMemo(() => {
        const byName: Record<string, string | null | undefined> = Object.fromEntries(
            (roomPlayers ?? []).map(player => [player.username, player.avatar]),
        );
        return ownAvatar !== undefined && username ? { ...byName, [username]: ownAvatar } : byName;
    }, [roomPlayers, ownAvatar, username]);
    const roomSettings = useRoomSettings();
    const running = inGame !== undefined;

    useAnyOrientationWhileFocused();

    // Leave when the game is over; straight to Play if we never were in a game (deep link).
    const wasInGame = useRef(false);
    useEffect(() => {
        if (running) {
            wasInGame.current = true;
            return;
        }
        router.replace(wasInGame.current ? '/leaderboard' : '/play');
    }, [running, router]);

    // No leaving a running game with the hardware back button (Android).
    useFocusEffect(
        useCallback(() => {
            if (!running) return;
            const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
                dispatch(
                    setToast({ id: 'game-back-blocked', type: 'info', message: 'You cannot leave a running game.', duration: 3000 }),
                );
                return true;
            });
            return () => subscription.remove();
        }, [running, dispatch]),
    );

    return (
        <TableThemeProvider>
            <GameTable
                game={game}
                active={active}
                username={username}
                playerOrder={playerOrder}
                avatars={avatars}
                cardSettings={roomSettings}
                onLayCard={layCard}
                messages={messages}
                onSendMessage={sendMessage}
                canSendMessage={canSend}
            />
            {__DEV__ ? (
                // Dev builds only: the card preview, also during a game (back returns here).
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/dev/cards')}
                    className="absolute right-2 top-10 rounded-full bg-gray-800/80 px-3 py-1"
                >
                    <Text className="text-xs font-semibold text-white">Cards (dev)</Text>
                </Pressable>
            ) : null}
        </TableThemeProvider>
    );
}

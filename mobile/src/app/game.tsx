import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ChatButton, ChatModal, OpponentsBar, PileArea, PlayerBoard } from '@/components/game';
import { Screen } from '@/components/ui';
import { useGameActions } from '@/hooks/useGameActions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setToast } from '@/store/generalSlice';

/**
 * The running game (portrait): opponents on top, deck / laid / burnt in the centre, your
 * table cards and hand at the bottom, chat in a modal. The root layout brings the user here
 * when `user.inGame` is set; this screen leaves when it clears (game won, or a re-sync
 * without a game) and blocks Android's back button meanwhile.
 */
export default function GameScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const game = useAppSelector(state => state.game);
    const inGame = useAppSelector(state => state.user?.inGame);
    const messages = useAppSelector(state => state.chat);
    const { layCard, sendMessage, canSend, active, username } = useGameActions();
    const running = inGame !== undefined;

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

    // Chat: unread = messages that arrived while the modal was closed.
    const [chatOpen, setChatOpen] = useState(false);
    const [seenCount, setSeenCount] = useState(messages.length);
    if (messages.length < seenCount) {
        // History was replaced by a shorter one (new room / re-sync): adjust during render.
        setSeenCount(messages.length);
    }
    const unread = chatOpen ? 0 : messages.length - seenCount;
    const toggleChat = (open: boolean) => {
        setSeenCount(messages.length);
        setChatOpen(open);
    };

    const activeOpponent = Object.entries(game.opponents).find(([, opponent]) => opponent.active)?.[0];
    const turnOf = active ? null : activeOpponent;

    return (
        <Screen edges={['top', 'bottom', 'left', 'right']} padded={false} background="gray">
            <OpponentsBar opponents={game.opponents} />

            <View className="flex-1 justify-center">
                <PileArea deck={game.deck} laidCards={game.laidCards} burntCards={game.burntCards} turnOf={turnOf} />
                <ChatButton unread={unread} onPress={() => toggleChat(true)} className="absolute right-3 top-2" />
            </View>

            <PlayerBoard
                userCards={game.userCards}
                laidCards={game.laidCards}
                active={active}
                username={username}
                onLayCard={layCard}
            />

            <ChatModal
                visible={chatOpen}
                onClose={() => toggleChat(false)}
                messages={messages}
                username={username}
                onSend={sendMessage}
                canSend={canSend}
            />
        </Screen>
    );
}

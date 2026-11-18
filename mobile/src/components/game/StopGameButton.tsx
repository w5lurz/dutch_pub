import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { StopIcon } from '@/components/icons';
import { BottomSheet, Button } from '@/components/ui';

import { useTableTheme } from './tableTheme';

type StopGameButtonProps = {
    /** Called once the owner confirmed: ends the game for everyone. */
    onStop: () => void;
};

/** Literal colours (by the table's day / night, not the phone's theme), like the chat button. */
const COLORS = {
    day: { background: '#ffffff', line: '#b91c1c' }, // red-700
    night: { background: '#1f2937', line: '#fca5a5' }, // gray-800, red-300
};

/**
 * The room owner's "Stop game" button (above the chat button). It asks first, as stopping
 * ends the game for every player: nobody wins, nothing counts on the leaderboard and the
 * room is closed.
 */
export function StopGameButton({ onStop }: StopGameButtonProps) {
    const { background, line } = COLORS[useTableTheme().mode];
    const [confirming, setConfirming] = useState(false);
    const stop = () => {
        setConfirming(false);
        onStop();
    };
    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Stop game"
                accessibilityHint="Ends the game for all players. Asks first."
                onPress={() => setConfirming(true)}
                hitSlop={8}
                style={{ backgroundColor: background, borderColor: line }}
                className="h-10 w-10 items-center justify-center rounded-full border-2 shadow-md"
            >
                <StopIcon size={22} color={line} strokeWidth={2} />
            </Pressable>
            <BottomSheet visible={confirming} title="Stop the game?" onClose={() => setConfirming(false)} closeLabel="Keep playing">
                <Text className="text-base text-gray-700">
                    The game ends for all players. Nobody wins, it does not count on the leaderboard, and the room is closed.
                </Text>
                <View className="gap-2">
                    <Button label="Stop game" variant="red" onPress={stop} testID="confirm-stop-game" />
                    <Button label="Keep playing" variant="gray" onPress={() => setConfirming(false)} />
                </View>
            </BottomSheet>
        </>
    );
}

export default StopGameButton;

import { Pressable, Text, View } from 'react-native';
import i18n from '@/i18n';

import { Avatar, BottomSheet, Button } from '@/components/ui';

export type AceCallSheetProps = {
    visible: boolean;
    /** The other players, in seat order. */
    players: readonly string[];
    /** Chosen avatars by name (null / missing: generated from the name). */
    avatars?: Record<string, string | null | undefined>;
    /** The player who must lay a magic card next. */
    onCall: (player: string) => void;
    /** Closed without choosing: the Ace isn't laid (it goes back to your hand). */
    onCancel: () => void;
};

/**
 * After an Ace ("Call Next") is dropped on the pile: pick the player who must lay a magic card
 * (or pick up the pile). Play then goes on from them.
 */
export function AceCallSheet({ visible, players, avatars, onCall, onCancel }: AceCallSheetProps) {
    return (
        <BottomSheet visible={visible} title={i18n.t('game.ace.title')} onClose={onCancel} closeLabel={i18n.t('game.ace.keep')}>
            <Text className="text-sm text-gray-700">{i18n.t('game.ace.text')}</Text>
            <View className="gap-2">
                {players.map(player => (
                    <Pressable
                        key={player}
                        accessibilityRole="button"
                        accessibilityLabel={i18n.t('game.ace.callLabel', { name: player })}
                        testID={`call-${player}`}
                        onPress={() => onCall(player)}
                        className="min-h-12 flex-row items-center gap-3 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 active:bg-gray-200"
                    >
                        <Avatar username={player} avatar={avatars?.[player]} size={32} />
                        <Text className="flex-1 text-base font-semibold text-gray-900">{player}</Text>
                    </Pressable>
                ))}
            </View>
            <Button label={i18n.t('game.ace.keep')} variant="gray" onPress={onCancel} />
        </BottomSheet>
    );
}

export default AceCallSheet;

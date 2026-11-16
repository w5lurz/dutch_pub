import { Pressable, Text, View } from 'react-native';

import { ChatIcon } from '@/components/icons';

type ChatButtonProps = {
    onPress: () => void;
    /** Messages received while the chat was closed. */
    unread: number;
    className?: string;
};

/** Round "Open chat" button with a red unread badge. */
export function ChatButton({ onPress, unread, className = '' }: ChatButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? `Open chat, ${unread} unread` : 'Open chat'}
            onPress={onPress}
            hitSlop={8}
            className={`h-12 w-12 items-center justify-center rounded-full border-2 border-blue-700 bg-white shadow-md active:bg-blue-100 ${className}`}
        >
            <ChatIcon size={26} color="#1d4ed8" />
            {unread > 0 ? (
                <View className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-red-600 px-1">
                    <Text className="text-xs font-bold text-white">{unread > 99 ? '99+' : unread}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

export default ChatButton;

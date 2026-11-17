import { Pressable, Text, View } from 'react-native';

import { ChatIcon } from '@/components/icons';

import { useTableTheme } from './tableTheme';

type ChatButtonProps = {
    onPress: () => void;
    /** Messages received while the chat was closed. */
    unread: number;
    className?: string;
};

/** Round "Open chat" button with a red unread badge. */
/** Literal colours (by the table's day / night, not the phone's theme): dark blue on white by day, for contrast. */
const COLORS = {
    day: { background: '#ffffff', line: '#1e40af' }, // blue-800
    night: { background: '#1f2937', line: '#93c5fd' }, // gray-800, blue-300
};

export function ChatButton({ onPress, unread, className = '' }: ChatButtonProps) {
    const { background, line } = COLORS[useTableTheme().mode];
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? `Open chat, ${unread} unread` : 'Open chat'}
            onPress={onPress}
            hitSlop={8}
            style={{ backgroundColor: background, borderColor: line }}
            className={`h-12 w-12 items-center justify-center rounded-full border-2 shadow-md ${className}`}
        >
            <ChatIcon size={26} color={line} strokeWidth={1.8} />
            {unread > 0 ? (
                <View className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-red-600 px-1">
                    <Text className="text-xs font-bold text-white">{unread > 99 ? '99+' : unread}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

export default ChatButton;

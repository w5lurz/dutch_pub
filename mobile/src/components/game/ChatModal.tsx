import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Pressable, Text, View } from 'react-native';
import type { ChatMessage } from '@dutch-pub/shared';

import { CloseIcon } from '@/components/icons';
import { Button, Screen, TextField } from '@/components/ui';
import { useTheme } from '@/lib/theme';

type ChatModalProps = {
    visible: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    /** Your username, to mark your own messages. */
    username?: string;
    /** Returns whether the message was sent (the input is cleared then). */
    onSend: (message: string) => boolean;
    /** False during the 3 s cooldown after sending. */
    canSend: boolean;
};

function MessageRow({ message, own }: { message: ChatMessage; own: boolean }) {
    return (
        <View
            accessible
            accessibilityLabel={`${message.senderName} at ${message.time}: ${message.message}`}
            className={`mb-2 max-w-[85%] rounded-lg px-3 py-2 ${own ? 'self-end bg-blue-100' : 'self-start bg-gray-100'}`}
        >
            <View className="flex-row items-center justify-between gap-3">
                <Text className="font-semibold text-gray-900">{message.senderName}</Text>
                <Text className="text-xs text-gray-500">{message.time}</Text>
            </View>
            <Text className="text-gray-900">{message.message}</Text>
        </View>
    );
}

/** iOS presents a Modal in portrait only unless told otherwise; the game screen is landscape. */
const MODAL_ORIENTATIONS = ['portrait', 'landscape', 'landscape-left', 'landscape-right'] as const;

/**
 * Full-screen chat of the game's room: messages (newest at the bottom), input and Send.
 * Kept compact for landscape, where the keyboard takes most of the height: a slim header,
 * no visible input label, the list shrinking above the input (KeyboardAvoidingView), and
 * no Android full-screen keyboard ("extract") mode, so the messages stay visible.
 */
export function ChatModal({ visible, onClose, messages, username, onSend, canSend }: ChatModalProps) {
    const colors = useTheme();
    const [text, setText] = useState('');
    // Inverted list: newest first in the data, shown at the bottom and kept in view.
    const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
    const sendDisabled = !canSend || text.trim().length === 0;

    const send = () => {
        if (onSend(text)) setText('');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
            navigationBarTranslucent
            supportedOrientations={[...MODAL_ORIENTATIONS]}
        >
            <Screen edges={['top', 'bottom', 'left', 'right']} padded={false}>
                <KeyboardAvoidingView className="flex-1" behavior="padding">
                    <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-1">
                        <Text accessibilityRole="header" className="text-lg font-bold text-gray-900">
                            Chat
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Hide chat"
                            onPress={onClose}
                            hitSlop={8}
                            className="rounded-md p-1 active:bg-gray-200"
                        >
                            <CloseIcon size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    {messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-gray-500">No messages yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            inverted
                            data={newestFirst}
                            keyExtractor={message => String(message.id)}
                            renderItem={({ item }) => <MessageRow message={item} own={item.senderName === username} />}
                            className="flex-1"
                            contentContainerClassName="px-4 py-2"
                            keyboardShouldPersistTaps="handled"
                        />
                    )}

                    <View className="flex-row items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-1.5">
                        <TextField
                            accessibilityLabel="Send a message"
                            placeholder="Type a message…"
                            disableFullscreenUI
                            value={text}
                            onChangeText={setText}
                            onSubmitEditing={() => !sendDisabled && send()}
                            returnKeyType="send"
                            submitBehavior="submit"
                            maxLength={500}
                            containerClassName="flex-1 w-auto"
                        />
                        <Button
                            label="Send"
                            variant="blue"
                            disabled={sendDisabled}
                            onPress={send}
                            accessibilityLabel={canSend ? 'Send' : 'Send, wait a moment'}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Screen>
        </Modal>
    );
}

export default ChatModal;

import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import type { ChatMessage } from '@dutch-pub/shared';

import { CloseIcon } from '@/components/icons';
import { Avatar, Button, KeyboardSpacer, Screen, TextField } from '@/components/ui';
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
	/** Chosen avatars by username (null / missing: generated from the name), shown by each message. */
	avatars?: Readonly<Record<string, string | null | undefined>>;
};

/** The sender's avatar beside the bubble: on the left for others, on the right for you. */
const CHAT_AVATAR = 28;

function MessageRow({ message, own, avatar }: { message: ChatMessage; own: boolean; avatar?: string | null }) {
	return (
		<View
			accessible
			accessibilityLabel={`${message.senderName} at ${message.time}: ${message.message}`}
			className={`mb-2 max-w-[85%] flex-row items-end gap-2 ${own ? 'flex-row-reverse self-end' : 'self-start'}`}
		>
			<Avatar username={message.senderName} avatar={avatar} size={CHAT_AVATAR} />
			<View className={`shrink rounded-lg px-3 py-2 ${own ? 'bg-blue-100' : 'bg-gray-100'}`}>
				<View className="flex-row items-center justify-between gap-3">
					<Text className="font-semibold text-gray-900">{message.senderName}</Text>
					<Text className="text-xs text-gray-500">{message.time}</Text>
				</View>
				<Text className="text-gray-900">{message.message}</Text>
			</View>
		</View>
	);
}

/** iOS presents a Modal in portrait only unless told otherwise; the game screen is landscape. */
const MODAL_ORIENTATIONS = ['portrait', 'landscape', 'landscape-left', 'landscape-right'] as const;

/**
 * Full-screen chat of the game's room: messages (newest at the bottom), input and Send.
 * Kept compact for landscape, where the keyboard takes most of the height: a slim header,
 * no visible input label, the list shrinking above the input (KeyboardSpacer), and
 * no Android full-screen keyboard ("extract") mode, so the messages stay visible.
 */
export function ChatModal({ visible, onClose, messages, username, onSend, canSend, avatars }: ChatModalProps) {
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
				{/* Keeps the input and Send right above the keyboard (measured, see KeyboardSpacer). */}
				<KeyboardSpacer>
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
							<CloseIcon size={24} color={colors.placeholder} />
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
							keyExtractor={(message) => String(message.id)}
							renderItem={({ item }) => (
								<MessageRow message={item} own={item.senderName === username} avatar={avatars?.[item.senderName]} />
							)}
							className="flex-1"
							contentContainerClassName="px-4 py-2"
							keyboardShouldPersistTaps="handled"
						/>
					)}

					<View className="flex-row items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
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
				</KeyboardSpacer>
			</Screen>
		</Modal>
	);
}

export default ChatModal;

import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import i18n from '@/i18n';
import type { ChatMessage } from '@dutch-pub/shared';

import { CloseIcon } from '@/components/icons';
import { Avatar, BottomSheet, Button, KeyboardSpacer, Screen, TextField } from '@/components/ui';
import { blockPlayer, unblockPlayer, useBlockedPlayers } from '@/lib/blockedPlayers';
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

/** A message; tapping someone else's offers to block them (`onBlock`). */
function MessageRow({ message, own, avatar, onBlock }: { message: ChatMessage; own: boolean; avatar?: string | null; onBlock?: () => void }) {
	return (
		<Pressable
			accessible
			accessibilityLabel={i18n.t('game.chat.messageLabel', { name: message.senderName, time: message.time, message: message.message })}
			accessibilityHint={onBlock ? i18n.t('game.chat.blockHint', { name: message.senderName }) : undefined}
			disabled={!onBlock}
			onPress={onBlock}
			className={`mb-2 max-w-[85%] flex-row items-end gap-2 active:opacity-70 ${own ? 'flex-row-reverse self-end' : 'self-start'}`}
		>
			<Avatar username={message.senderName} avatar={avatar} size={CHAT_AVATAR} />
			<View className={`shrink rounded-lg px-3 py-2 ${own ? 'bg-blue-100' : 'bg-gray-200'}`}>
				<View className="flex-row items-center justify-between gap-3">
					<Text className="font-semibold text-gray-900">{message.senderName}</Text>
					<Text className="text-xs text-gray-500">{message.time}</Text>
				</View>
				<Text className="text-gray-900">{message.message}</Text>
			</View>
		</Pressable>
	);
}

/** iOS presents a Modal in portrait only unless told otherwise; the game screen is landscape. */
const MODAL_ORIENTATIONS = ['portrait', 'landscape', 'landscape-left', 'landscape-right'] as const;

/**
 * Full-screen chat of the game's room: messages (newest at the bottom), input and Send.
 * Kept compact for landscape, where the keyboard takes most of the height: a slim header,
 * no visible input label, the list shrinking above the input (KeyboardSpacer), and
 * no Android full-screen keyboard ("extract") mode, so the messages stay visible.
 *
 * Tapping someone else's message offers to block them: their messages and emotions are hidden
 * on this phone (`blockedPlayers`; the game table leaves their messages out of `messages`). The
 * header then lists the blocked players, to unblock them.
 */
export function ChatModal({ visible, onClose, messages, username, onSend, canSend, avatars }: ChatModalProps) {
	const colors = useTheme();
	const [text, setText] = useState('');
	const blocked = useBlockedPlayers();
	const [blocking, setBlocking] = useState<string | null>(null);
	const [blockedList, setBlockedList] = useState(false);
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
							{i18n.t('game.chat.title')}
						</Text>
						{blocked.length > 0 ? (
							<Pressable
								accessibilityRole="button"
								onPress={() => setBlockedList(true)}
								hitSlop={8}
								className="ml-auto mr-3 rounded-md px-2 py-1 active:bg-gray-200"
							>
								<Text className="text-sm font-semibold text-gray-600">{i18n.t('game.chat.blockedCount', { count: blocked.length })}</Text>
							</Pressable>
						) : null}
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={i18n.t('game.chat.hide')}
							onPress={onClose}
							hitSlop={8}
							className="rounded-md p-1 active:bg-gray-200"
						>
							<CloseIcon size={24} color={colors.placeholder} />
						</Pressable>
					</View>

					{messages.length === 0 ? (
						<View className="flex-1 items-center justify-center">
							<Text className="text-gray-500">{i18n.t('game.chat.empty')}</Text>
						</View>
					) : (
						<FlatList
							inverted
							data={newestFirst}
							keyExtractor={(message) => String(message.id)}
							renderItem={({ item }) => (
								<MessageRow
									message={item}
									own={item.senderName === username}
									avatar={avatars?.[item.senderName]}
									onBlock={item.senderName === username ? undefined : () => setBlocking(item.senderName)}
								/>
							)}
							className="flex-1"
							contentContainerClassName="px-4 py-2"
							keyboardShouldPersistTaps="handled"
						/>
					)}

					<View className="flex-row items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
						<TextField
							accessibilityLabel={i18n.t('game.chat.sendAMessage')}
							placeholder={i18n.t('game.chat.placeholder')}
							disableFullscreenUI
							value={text}
							onChangeText={setText}
							onSubmitEditing={() => !sendDisabled && send()}
							returnKeyType="send"
							submitBehavior="submit"
							maxLength={256}
							containerClassName="flex-1 w-auto"
						/>
						<Button
							label={i18n.t('game.chat.send')}
							variant="blue"
							disabled={sendDisabled}
							onPress={send}
							accessibilityLabel={canSend ? i18n.t('game.chat.send') : i18n.t('game.chat.sendWait')}
						/>
					</View>
				</KeyboardSpacer>
			</Screen>

			<BottomSheet visible={blocking !== null} title={i18n.t('game.chat.blockTitle', { name: blocking ?? '' })} onClose={() => setBlocking(null)}>
				<Text className="text-base text-gray-700">{i18n.t('game.chat.blockText', { name: blocking ?? '' })}</Text>
				<Button
					label={i18n.t('game.chat.block')}
					variant="red"
					onPress={() => {
						if (blocking) blockPlayer(blocking);
						setBlocking(null);
					}}
					className="w-full"
				/>
				<Button label={i18n.t('common.cancel')} variant="gray" onPress={() => setBlocking(null)} className="w-full" />
			</BottomSheet>

			<BottomSheet visible={blockedList} title={i18n.t('game.chat.blockedTitle')} onClose={() => setBlockedList(false)}>
				{blocked.length === 0 ? <Text className="text-base text-gray-700">{i18n.t('game.chat.blockedNone')}</Text> : null}
				{blocked.map((name) => (
					<View key={name} className="flex-row items-center justify-between gap-3">
						<View className="flex-1 flex-row items-center gap-2">
							<Avatar username={name} avatar={avatars?.[name]} size={CHAT_AVATAR} />
							<Text numberOfLines={1} className="shrink text-base font-semibold text-gray-900">
								{name}
							</Text>
						</View>
						<Button
							label={i18n.t('game.chat.unblock')}
							variant="gray"
							onPress={() => unblockPlayer(name)}
							accessibilityLabel={i18n.t('game.chat.unblockLabel', { name })}
						/>
					</View>
				))}
			</BottomSheet>
		</Modal>
	);
}

export default ChatModal;

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@dutch-pub/shared';

import { BottomSheet, Button, SegmentedControl, TextField } from '@/components/ui';
import type { NewRoom, RoomVisibility } from '@/hooks/useRooms';
import { RoomSettingsFields, useVisibilityOptions } from './RoomSettingsFields';

const SLOT_OPTIONS = [
	{ label: '2', value: 2 },
	{ label: '3', value: 3 },
	{ label: '4', value: 4 },
] as const;

export type CreateRoomModalProps = {
	visible: boolean;
	onClose: () => void;
	/** Called with a validated room; the caller emits it and closes the modal. */
	onCreate: (room: NewRoom) => void;
	disabled?: boolean;
	/** The creator's name, for the prefilled room name ("Anna's table"). */
	ownerName?: string;
};

/** Bottom-sheet style modal for creating a room (web `CreateRoomForm`). */
export function CreateRoomModal({ visible, onClose, onCreate, disabled = false, ownerName }: CreateRoomModalProps) {
	const { t } = useTranslation();
	const visibilityOptions = useVisibilityOptions();
	// Prefilled ("Anna's table"): creating a room is one tap; the name can still be changed.
	const defaultName = ownerName ? t('rooms.defaultName', { name: ownerName }).slice(0, 40) : '';
	// What was typed; until then the default (known only once the session is restored).
	const [typed, setTyped] = useState<string | null>(null);
	const name = typed ?? defaultName;
	const [slots, setSlots] = useState<number>(2);
	// The web select ends up on "Private" by default.
	const [visibility, setVisibility] = useState<RoomVisibility>('private');
	const [settings, setSettings] = useState<RoomSettings>({ ...DEFAULT_ROOM_SETTINGS });
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setTyped(null);
		setSlots(2);
		setVisibility('private');
		setSettings({ ...DEFAULT_ROOM_SETTINGS });
		setError(null);
	};

	const close = () => {
		reset();
		onClose();
	};

	const submit = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setError(t('rooms.nameRequired'));
			return;
		}
		onCreate({ name: trimmed, slots, visibility, settings });
		reset();
	};

	return (
		<BottomSheet visible={visible} title={t('play.createRoom')} onClose={close} closeLabel={t('rooms.cancelCreate')}>
			{/* Scrolls on short (landscape) screens now that the form has a settings section. */}
			<ScrollView className="shrink" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
				<TextField
					label={t('rooms.name')}
					placeholder={t('rooms.namePlaceholder')}
					value={name}
					onChangeText={(text) => {
						setTyped(text);
						if (error) setError(null);
					}}
					error={error}
					maxLength={40}
					autoCorrect={false}
					returnKeyType="done"
					onSubmitEditing={submit}
				/>

				<View className="gap-1">
					<Text className="text-sm font-medium text-gray-900">{t('rooms.slots')}</Text>
					<SegmentedControl options={SLOT_OPTIONS} value={slots} onChange={setSlots} accessibilityLabel={t('rooms.slots')} />
				</View>

				<View className="gap-1">
					<Text className="text-sm font-medium text-gray-900">{t('rooms.visibility')}</Text>
					<SegmentedControl
						options={visibilityOptions}
						value={visibility}
						onChange={setVisibility}
						accessibilityLabel={t('rooms.visibility')}
					/>
				</View>

				<View className="gap-1">
					<Text accessibilityRole="header" className="text-sm font-medium text-gray-900">
						{t('rooms.settings')}
					</Text>
					<RoomSettingsFields
						value={settings}
						onChange={(change) => setSettings((current) => ({ ...current, ...change }))}
					/>
				</View>
			</ScrollView>

			<View className="flex-row gap-2">
				<Button label={t('common.cancel')} variant="gray" onPress={close} className="flex-1" />
				<Button label={t('rooms.create')} variant="blue" onPress={submit} disabled={disabled} className="flex-1" />
			</View>
		</BottomSheet>
	);
}

export default CreateRoomModal;

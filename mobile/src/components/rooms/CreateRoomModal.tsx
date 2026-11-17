import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@dutch-pub/shared';

import { BottomSheet, Button, SegmentedControl, TextField } from '@/components/ui';
import type { NewRoom, RoomVisibility } from '@/hooks/useRooms';
import { RoomSettingsFields } from './RoomSettingsFields';

const SLOT_OPTIONS = [
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
] as const;

const VISIBILITY_OPTIONS = [
    { label: 'Private', value: 'private' },
    { label: 'Public', value: 'public' },
] as const satisfies readonly { label: string; value: RoomVisibility }[];

export type CreateRoomModalProps = {
    visible: boolean;
    onClose: () => void;
    /** Called with a validated room; the caller emits it and closes the modal. */
    onCreate: (room: NewRoom) => void;
    disabled?: boolean;
};

/** Bottom-sheet style modal for creating a room (web `CreateRoomForm`). */
export function CreateRoomModal({ visible, onClose, onCreate, disabled = false }: CreateRoomModalProps) {
    const [name, setName] = useState('');
    const [slots, setSlots] = useState<number>(2);
    // The web select ends up on "Private" by default.
    const [visibility, setVisibility] = useState<RoomVisibility>('private');
    const [settings, setSettings] = useState<RoomSettings>({ ...DEFAULT_ROOM_SETTINGS });
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setName('');
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
            setError('Room name is required.');
            return;
        }
        onCreate({ name: trimmed, slots, visibility, settings });
        reset();
    };

    return (
        <BottomSheet visible={visible} title="Create room" onClose={close} closeLabel="Cancel creating room">
            {/* Scrolls on short (landscape) screens now that the form has a settings section. */}
            <ScrollView className="shrink" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
                <TextField
                    label="Room Name"
                    placeholder="random room name"
                    value={name}
                    onChangeText={text => {
                        setName(text);
                        if (error) setError(null);
                    }}
                    error={error}
                    maxLength={40}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                />

                <View className="gap-1">
                    <Text className="text-sm font-medium text-gray-900">Slots</Text>
                    <SegmentedControl options={SLOT_OPTIONS} value={slots} onChange={setSlots} accessibilityLabel="Slots" />
                </View>

                <View className="gap-1">
                    <Text className="text-sm font-medium text-gray-900">Visibility</Text>
                    <SegmentedControl
                        options={VISIBILITY_OPTIONS}
                        value={visibility}
                        onChange={setVisibility}
                        accessibilityLabel="Visibility"
                    />
                </View>

                <View className="gap-1">
                    <Text accessibilityRole="header" className="text-sm font-medium text-gray-900">
                        Room settings
                    </Text>
                    <RoomSettingsFields value={settings} onChange={change => setSettings(current => ({ ...current, ...change }))} />
                </View>
            </ScrollView>

            <View className="flex-row gap-2">
                <Button label="Cancel" variant="gray" onPress={close} className="flex-1" />
                <Button label="Create Room" variant="blue" onPress={submit} disabled={disabled} className="flex-1" />
            </View>
        </BottomSheet>
    );
}

export default CreateRoomModal;

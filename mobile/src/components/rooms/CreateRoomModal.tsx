import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { Button, SegmentedControl, TextField } from '@/components/ui';
import type { NewRoom, RoomVisibility } from '@/hooks/useRooms';

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
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [slots, setSlots] = useState<number>(2);
    // The web select ends up on "Private" by default.
    const [visibility, setVisibility] = useState<RoomVisibility>('private');
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setName('');
        setSlots(2);
        setVisibility('private');
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
        onCreate({ name: trimmed, slots, visibility });
        reset();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={close} statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
                <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} className="absolute inset-0 bg-black/40" />
                <View className="gap-4 rounded-t-2xl bg-white p-5" style={{ paddingBottom: insets.bottom + 20 }}>
                    <View className="flex-row items-center justify-between">
                        <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                            Create room
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Cancel creating room"
                            hitSlop={12}
                            onPress={close}
                            className="rounded p-1 active:bg-gray-100"
                        >
                            <CloseIcon size={24} color="#374151" />
                        </Pressable>
                    </View>

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

                    <View className="flex-row gap-2">
                        <Button label="Cancel" variant="gray" onPress={close} className="flex-1" />
                        <Button label="Create Room" variant="blue" onPress={submit} disabled={disabled} className="flex-1" />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

export default CreateRoomModal;

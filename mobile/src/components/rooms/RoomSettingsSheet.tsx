import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomSettings } from '@dutch-pub/shared';

import { BottomSheet, Button, ChoiceRow } from '@/components/ui';
import type { RoomVisibility } from '@/hooks/useRooms';
import { RoomSettingsFields, useVisibilityOptions } from './RoomSettingsFields';

/** How long a toggle shows its new value while waiting for the server's broadcast. */
const PENDING_TIMEOUT_MS = 3000;

export type RoomSettingsSheetProps = {
    visible: boolean;
    onClose: () => void;
    roomName: string;
    /** The room's current settings, as broadcast by the server. */
    settings: RoomSettings;
    /** The owner, before the game started. Everyone else sees the settings read-only. */
    canEdit: boolean;
    /** Sends the change to the server (`update-room-settings`). */
    onChange: (change: Partial<RoomSettings>) => void;
    disabled?: boolean;
    /** The room's visibility; with `onVisibilityChange` the sheet shows it (the owner can switch it). */
    visibility?: RoomVisibility;
    /** Sends the new visibility to the server (`update-room-settings`). */
    onVisibilityChange?: (visibility: RoomVisibility) => void;
};

/** Waiting-room sheet with the room's settings: switches for the owner, read-only for the others. */
export function RoomSettingsSheet({
    visible,
    onClose,
    roomName,
    settings,
    canEdit,
    onChange,
    disabled = false,
    visibility,
    onVisibilityChange,
}: RoomSettingsSheetProps) {
    const { t } = useTranslation();
    const visibilityOptions = useVisibilityOptions();
    // A toggle shows right away. It is dropped as soon as the server's settings change (its
    // broadcast arrived) or after a timeout (e.g. the change was rejected).
    const settingsKey = JSON.stringify(settings);
    const [pending, setPending] = useState<{ base: string; values: Partial<RoomSettings> } | null>(null);
    const shown = pending?.base === settingsKey ? { ...settings, ...pending.values } : settings;
    // The same for the visibility (`base`: the room's visibility when it was switched).
    const [pendingVisibility, setPendingVisibility] = useState<{ base?: RoomVisibility; value: RoomVisibility } | null>(null);
    const shownVisibility = pendingVisibility && pendingVisibility.base === visibility ? pendingVisibility.value : visibility;

    useEffect(() => {
        if (!pending) return;
        const timer = setTimeout(() => setPending(null), PENDING_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [pending]);
    useEffect(() => {
        if (!pendingVisibility) return;
        const timer = setTimeout(() => setPendingVisibility(null), PENDING_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [pendingVisibility]);

    const changeVisibility = (next: RoomVisibility) => {
        setPendingVisibility({ base: visibility, value: next });
        onVisibilityChange?.(next);
    };

    const change = (next: Partial<RoomSettings>) => {
        setPending(current => ({ base: settingsKey, values: { ...(current?.base === settingsKey ? current.values : {}), ...next } }));
        onChange(next);
    };

    const close = () => {
        setPending(null);
        setPendingVisibility(null);
        onClose();
    };

    return (
        <BottomSheet visible={visible} title={t('rooms.settings')} onClose={close} closeLabel={t('rooms.closeSettings')}>
            <Text className="text-sm text-gray-700">
                {canEdit ? t('rooms.settingsIntroOwner', { room: roomName }) : t('rooms.settingsIntroPlayer', { room: roomName })}
            </Text>
            {/* Scrolls on small phones (the settings plus the house rules are taller than the sheet). */}
            <ScrollView className="shrink">
                {shownVisibility && onVisibilityChange ? (
                    <ChoiceRow
                        label={t('rooms.visibility')}
                        description={t('rooms.visibilityDescription')}
                        options={visibilityOptions}
                        value={shownVisibility}
                        onChange={changeVisibility}
                        disabled={!canEdit || disabled}
                    />
                ) : null}
                <RoomSettingsFields value={shown} onChange={change} disabled={!canEdit || disabled} />
            </ScrollView>
            <Button label={t('common.done')} variant="gray" onPress={close} />
        </BottomSheet>
    );
}

export default RoomSettingsSheet;

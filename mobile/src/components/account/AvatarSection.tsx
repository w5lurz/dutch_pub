import { useState } from 'react';
import { Text, View } from 'react-native';
import type { AvatarId, User } from '@dutch-pub/shared';

import { Avatar, AvatarPicker, Button, describeAvatar } from '@/components/ui';
import { api } from '@/lib/api';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';
import { setAvatar } from '@/store/userSlice';

type AvatarSectionProps = {
    user: NonNullable<User>;
};

const errorMessage = async (res: Response) => {
    try {
        return ((await res.json()) as { message?: string }).message ?? 'Could not save your avatar.';
    } catch {
        return 'Could not save your avatar.';
    }
};

/**
 * Your avatar on the account screen. Logged-in players can choose one of the presets (saved
 * on the server, shown at once everywhere: the store is updated first and put back if
 * saving fails); guests see the one generated from their name.
 */
export function AvatarSection({ user }: AvatarSectionProps) {
    const dispatch = useAppDispatch();
    const [picking, setPicking] = useState(false);
    const [saving, setSaving] = useState(false);
    const chosen = user.isGuest ? null : (user.avatar ?? null);

    const save = async (avatar: AvatarId | null) => {
        if (avatar === chosen) return;
        dispatch(setAvatar(avatar));
        setSaving(true);
        let failure: string | null = null;
        try {
            const res = await api.setAvatar(avatar);
            if (!res.ok) failure = await errorMessage(res);
        } catch {
            failure = 'Cannot reach the server.';
        } finally {
            setSaving(false);
        }
        if (failure) {
            dispatch(setAvatar(chosen));
            dispatch(setToast({ id: `avatar-failed-${Date.now()}`, type: 'error', message: failure, duration: 3000 }));
        }
    };

    return (
        <View className="w-full items-center gap-3">
            <Avatar username={user.username} avatar={chosen} size={96} accessibilityLabel={`Your avatar: ${describeAvatar(user.username, chosen)}`} />
            {user.isGuest ? (
                <Text className="text-center text-sm text-gray-500">
                    Your avatar is generated from your name. Logged-in players can choose one.
                </Text>
            ) : (
                <>
                    <Button
                        label={picking ? 'Done' : 'Change avatar'}
                        variant="blue"
                        size="sm"
                        onPress={() => setPicking(open => !open)}
                    />
                    {picking ? <AvatarPicker username={user.username} value={chosen} onChange={save} disabled={saving} /> : null}
                </>
            )}
        </View>
    );
}

export default AvatarSection;

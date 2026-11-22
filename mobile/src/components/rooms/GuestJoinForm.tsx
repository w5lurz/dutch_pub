import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, TextField } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

export type GuestJoinFormProps = {
    /** Disables submit (e.g. while the socket is disconnected). */
    disabled?: boolean;
};

/**
 * Signed-out Play tab: a card on top of the room list to play as a guest (a name is enough),
 * or go to log in / registration.
 */
export function GuestJoinForm({ disabled = false }: GuestJoinFormProps) {
    const { t } = useTranslation();
    const { joinAsGuest } = useSession();
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (loading) return;
        const trimmed = username.trim();
        if (!trimmed) {
            setError(t('rooms.guest.usernameRequired'));
            return;
        }
        setLoading(true);
        const result = await joinAsGuest(trimmed);
        setLoading(false);
        if (result.ok) {
            dispatch(setToast({ id: 'add-guest-success', type: 'success', message: t('rooms.guest.added', { name: trimmed }), duration: 3000 }));
        } else {
            dispatch(setToast({ id: 'add-guest-failed', type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <View className="w-full max-w-md gap-4 self-center rounded-lg bg-white p-5 shadow">
            <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                {t('rooms.guest.title')}
            </Text>
            <TextField
                label={t('rooms.guest.name')}
                value={username}
                onChangeText={text => {
                    setUsername(text);
                    if (error) setError(null);
                }}
                error={error}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="go"
                onSubmitEditing={submit}
                editable={!loading}
            />
            <Button label={t('rooms.guest.join')} variant="green" onPress={submit} loading={loading} disabled={disabled} className="w-full" />
            <Text className="text-sm text-gray-500">{t('rooms.guest.hint')}</Text>
            <View className="flex-row flex-wrap gap-2">
                <Button label={t('common.logIn')} variant="outline" size="sm" onPress={() => router.push('/login')} className="flex-1" />
                <Button label={t('common.register')} variant="outline" size="sm" onPress={() => router.push('/registration')} className="flex-1" />
            </View>
        </View>
    );
}

export default GuestJoinForm;

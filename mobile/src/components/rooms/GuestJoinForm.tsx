import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, TextField } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

export type GuestJoinFormProps = {
    /** Disables submit (e.g. while the socket is disconnected). */
    disabled?: boolean;
};

/** Signed-out Play tab: join as a guest (web `LoginAsGuestForm`), or go to login / registration. */
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
            dispatch(setToast({ id: 'add-guest-success', type: 'success', message: t('rooms.guest.added'), duration: 3000 }));
        } else {
            dispatch(setToast({ id: 'add-guest-failed', type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
            <ScrollView contentContainerClassName="grow justify-center p-4" keyboardShouldPersistTaps="handled">
                <View className="w-full max-w-md gap-4 self-center rounded-lg bg-white p-6 shadow">
                    <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                        {t('rooms.guest.title')}
                    </Text>
                    <TextField
                        label={t('auth.username')}
                        placeholder={t('rooms.guest.placeholder')}
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
                    <Button label={t('rooms.guest.join')} variant="blue" onPress={submit} loading={loading} disabled={disabled} className="w-full" />
                    <Text className="text-sm text-gray-500">
                        {t('rooms.guest.hint')}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Button label={t('common.logIn')} variant="gray" size="sm" onPress={() => router.push('/login')} className="flex-1" />
                        <Button label={t('common.register')} variant="green" size="sm" onPress={() => router.push('/registration')} className="flex-1" />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default GuestJoinForm;

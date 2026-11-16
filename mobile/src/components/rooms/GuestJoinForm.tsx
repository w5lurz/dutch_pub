import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

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
    const { joinAsGuest } = useSession();
    const dispatch = useAppDispatch();
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (loading) return;
        const trimmed = username.trim();
        if (!trimmed) {
            setError('Username is required.');
            return;
        }
        setLoading(true);
        const result = await joinAsGuest(trimmed);
        setLoading(false);
        if (result.ok) {
            dispatch(setToast({ id: 'add-guest-success', type: 'success', message: 'Your Guest account added!', duration: 3000 }));
        } else {
            dispatch(setToast({ id: 'add-guest-failed', type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
            <ScrollView contentContainerClassName="grow justify-center p-4" keyboardShouldPersistTaps="handled">
                <View className="w-full max-w-md gap-4 self-center rounded-lg bg-white p-6 shadow">
                    <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                        Sign in as a Guest
                    </Text>
                    <TextField
                        label="Username"
                        placeholder="your preferred guest username"
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
                    <Button label="Join as guest" variant="blue" onPress={submit} loading={loading} disabled={disabled} className="w-full" />
                    <Text className="text-sm text-gray-500">
                        As a Guest you’ll only be able to play in public games. You’d prefer creating a normal account?
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Button label="Log in" variant="gray" size="sm" onPress={() => router.push('/login')} className="flex-1" />
                        <Button label="Register" variant="green" size="sm" onPress={() => router.push('/registration')} className="flex-1" />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default GuestJoinForm;

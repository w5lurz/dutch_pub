import { useRef, useState, type ComponentRef } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';

import { AuthForm, AuthSwitchLink } from '@/components/auth';
import { Button, TextField, TextLink } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

export default function LoginScreen() {
    const { logIn } = useSession();
    const dispatch = useAppDispatch();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

    const canSubmit = username.trim() !== '' && password !== '';

    const handleSubmit = async () => {
        if (!canSubmit || loading) return;
        setLoading(true);
        const result = await logIn(username.trim(), password);
        setLoading(false);

        if (result.ok) {
            dispatch(setToast({ id: `login-success-${Date.now()}`, type: 'success', message: 'You successfully logged in!', duration: 3000 }));
            if (router.canGoBack()) router.back();
            else router.replace('/');
        } else {
            dispatch(setToast({ id: `login-failed-${Date.now()}`, type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <AuthForm
            title="Sign in to your account"
            footer={
                <AuthSwitchLink
                    prompt="Don’t have an account yet?"
                    label="Sign up"
                    // Pops back to an existing registration screen instead of stacking a new one.
                    onPress={() => router.dismissTo('/registration')}
                />
            }
        >
            <TextField
                label="Username"
                placeholder="your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
            />
            <TextField
                ref={passwordRef}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!loading}
            />
            <Button label="Sign in" variant="blue" onPress={handleSubmit} disabled={!canSubmit} loading={loading} className="w-full" />
            <TextLink label="Forgot password?" onPress={() => router.push('/forgot-password')} className="self-center" />
        </AuthForm>
    );
}

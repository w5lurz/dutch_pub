import { useRef, useState, type ComponentRef } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AuthForm, AuthSwitchLink } from '@/components/auth';
import { Button, TextField, TextLink } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

export default function LoginScreen() {
    const { t } = useTranslation();
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
            dispatch(setToast({ id: `login-success-${Date.now()}`, type: 'success', message: t('auth.loggedIn'), duration: 3000 }));
            if (router.canGoBack()) router.back();
            else router.replace('/');
        } else {
            dispatch(setToast({ id: `login-failed-${Date.now()}`, type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <AuthForm
            title={t('auth.signInTitle')}
            footer={
                <AuthSwitchLink
                    prompt={t('auth.noAccountYet')}
                    label={t('auth.signUp')}
                    // Pops back to an existing registration screen instead of stacking a new one.
                    onPress={() => router.dismissTo('/registration')}
                />
            }
        >
            <TextField
                label={t('auth.usernameOrEmail')}
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
                label={t('auth.password')}
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
            <Button label={t('auth.signIn')} variant="blue" onPress={handleSubmit} disabled={!canSubmit} loading={loading} className="w-full" />
            <TextLink
                label={t('auth.forgotPassword')}
                // An email typed in the login field carries over (no typing it twice).
                onPress={() => router.push(username.includes('@') ? { pathname: '/forgot-password', params: { email: username.trim() } } : '/forgot-password')}
                className="self-center"
            />
        </AuthForm>
    );
}

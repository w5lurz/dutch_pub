import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Linking, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { passwordError as passwordRule, usernameError as usernameRule } from '@dutch-pub/shared';

import { AuthForm, AuthSwitchLink } from '@/components/auth';
import { Button, TextField } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { serverMessage } from '@/i18n';
import { PRIVACY_URL } from '@/lib/config';
import { useAppDispatch } from '@/store';
import { setToast } from '@/store/generalSlice';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InputRef = ComponentRef<typeof TextInput>;

/** The privacy policy link inside the agreement sentence (a component, so its style survives `Trans`). */
function PrivacyLink({ children }: { children?: ReactNode }) {
    const { t } = useTranslation();
    return (
        <Text
            accessibilityRole="link"
            accessibilityHint={t('common.opensInBrowser')}
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
            className="font-medium text-blue-600 underline"
        >
            {children}
        </Text>
    );
}

export default function RegistrationScreen() {
    const { t } = useTranslation();
    const { register, logIn } = useSession();
    const dispatch = useAppDispatch();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [loading, setLoading] = useState(false);

    const emailRef = useRef<InputRef>(null);
    const passwordRef = useRef<InputRef>(null);
    const confirmRef = useRef<InputRef>(null);

    const emailValid = EMAIL_PATTERN.test(email.trim());
    const passwordsMatch = password === confirmPassword;
    const allFilled = username.trim() !== '' && email.trim() !== '' && password !== '' && confirmPassword !== '';

    // Email is checked once the field was left (or on submit); the confirmation live, as on the web.
    const emailError = emailTouched && email.trim() !== '' && !emailValid ? t('auth.invalidEmail') : null;
    const confirmError = confirmPassword !== '' && !passwordsMatch ? t('auth.passwordsDontMatch') : null;
    // The server's rules (packages/shared), shown as soon as something is typed.
    const usernameError = username.trim() !== '' ? serverMessage(usernameRule(username)) : null;
    const passwordError = password !== '' ? serverMessage(passwordRule(password)) : null;

    const handleSubmit = async () => {
        if (loading) return;
        setEmailTouched(true);
        if (!allFilled || !emailValid || !passwordsMatch || usernameError || passwordError) return;

        setLoading(true);
        const result = await register(username.trim(), email.trim(), password);
        setLoading(false);

        if (result.ok) {
            // Logged in right away (no typing it all again on the login screen).
            setLoading(true);
            const session = await logIn(username.trim(), password);
            setLoading(false);
            dispatch(
                setToast({
                    id: `registration-success-${Date.now()}`,
                    type: 'success',
                    message: session.ok ? t('auth.welcome', { name: username.trim() }) : t('auth.registered'),
                    duration: 3000,
                }),
            );
            if (!session.ok) router.dismissTo('/login');
            else if (router.canDismiss()) router.dismissAll();
            else router.replace('/');
        } else {
            dispatch(setToast({ id: `registration-failed-${Date.now()}`, type: 'error', message: result.message, duration: 3000 }));
        }
    };

    return (
        <AuthForm
            title={t('auth.createAccount')}
            footer={<AuthSwitchLink prompt={t('auth.haveAccount')} label={t('auth.logInHere')} onPress={() => router.dismissTo('/login')} />}
        >
            <TextField
                label={t('auth.preferredUsername')}
                helper={t('auth.usernameRules')}
                value={username}
                onChangeText={setUsername}
                error={usernameError}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => emailRef.current?.focus()}
                editable={!loading}
            />
            <TextField
                ref={emailRef}
                label={t('auth.yourEmail')}
                placeholder="name@domain.com"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
            />
            <TextField
                ref={passwordRef}
                label={t('auth.password')}
                helper={t('auth.passwordRules')}
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmRef.current?.focus()}
                editable={!loading}
            />
            <TextField
                ref={confirmRef}
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={confirmError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!loading}
            />
            <Button
                label={t('common.register')}
                variant="blue"
                onPress={handleSubmit}
                disabled={!allFilled || !passwordsMatch || (emailTouched && !emailValid) || !!usernameError || !!passwordError}
                loading={loading}
                className="w-full"
            />
            <Text className="text-center text-sm text-gray-600">
                <Trans
                    i18nKey="auth.agreePrivacy"
                    components={{ link: <PrivacyLink /> }}
                />
            </Text>
        </AuthForm>
    );
}

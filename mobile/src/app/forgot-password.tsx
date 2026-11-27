import { useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { emailError as emailRule } from '@dutch-pub/shared';

import { AuthForm } from '@/components/auth';
import { Button, TextField } from '@/components/ui';
import i18n, { serverMessage } from '@/i18n';
import { api } from '@/lib/api';

/**
 * "Forgot password?": asks the server to email a link for setting a new password. The link
 * opens a page on the server (in the browser), not the app; afterwards the user logs in here.
 */
export default function ForgotPasswordScreen() {
    const { t } = useTranslation();
    // From the login screen, when an email was typed there.
    const params = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const invalid = serverMessage(emailRule(email));
    const fieldError = error ?? (touched && email.trim() !== '' && invalid ? invalid : null);

    const handleSubmit = async () => {
        setTouched(true);
        if (invalid || loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.requestPasswordReset(email.trim(), i18n.language);
            const body = (await res.json().catch(() => ({}))) as { message?: string };
            if (res.ok) setSent(serverMessage(body.message) ?? t('forgot.sent'));
            else setError(serverMessage(body.message) ?? t('forgot.failed'));
        } catch {
            setError(t('errors.noServer'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm title={t('forgot.title')}>
            {sent ? (
                <>
                    <Text className="text-base text-gray-700">{sent}</Text>
                    <Text className="text-sm text-gray-500">{t('forgot.afterSent')}</Text>
                    <Button
                        label={t('forgot.backToLogIn')}
                        variant="blue"
                        // Opened straight at this address (web, reload): nothing to go back to.
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
                        className="w-full"
                    />
                </>
            ) : (
                <>
                    <Text className="text-base text-gray-700">
                        {t('forgot.intro')}
                    </Text>
                    <TextField
                        label={t('auth.yourEmail')}
                        placeholder="name@domain.com"
                        value={email}
                        onChangeText={text => {
                            setEmail(text);
                            setError(null);
                        }}
                        onBlur={() => setTouched(true)}
                        error={fieldError}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="send"
                        onSubmitEditing={handleSubmit}
                        editable={!loading}
                    />
                    <Button label={t('forgot.send')} variant="blue" onPress={handleSubmit} disabled={!email.trim()} loading={loading} className="w-full" />
                </>
            )}
        </AuthForm>
    );
}

import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { emailError as emailRule } from '@dutch-pub/shared';

import { AuthForm } from '@/components/auth';
import { Button, TextField } from '@/components/ui';
import { api } from '@/lib/api';

/**
 * "Forgot password?": asks the server to email a link for setting a new password. The link
 * opens a page on the server (in the browser), not the app; afterwards the user logs in here.
 */
export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const invalid = emailRule(email);
    const fieldError = error ?? (touched && email.trim() !== '' && invalid ? invalid : null);

    const handleSubmit = async () => {
        setTouched(true);
        if (invalid || loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.requestPasswordReset(email.trim());
            const body = (await res.json().catch(() => ({}))) as { message?: string };
            if (res.ok) setSent(body.message ?? 'The link is on its way.');
            else setError(body.message ?? 'Could not send the link. Please try again later.');
        } catch {
            setError('Cannot reach the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm title="Forgot your password?">
            {sent ? (
                <>
                    <Text className="text-base text-gray-700">{sent}</Text>
                    <Text className="text-sm text-gray-500">Open the link in the email, choose a new password, then log in with it.</Text>
                    <Button
                        label="Back to log in"
                        variant="blue"
                        // Opened straight at this address (web, reload): nothing to go back to.
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
                        className="w-full"
                    />
                </>
            ) : (
                <>
                    <Text className="text-base text-gray-700">
                        Enter the email address of your account. We send you a link to set a new password.
                    </Text>
                    <TextField
                        label="Your email"
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
                    <Button label="Send the link" variant="blue" onPress={handleSubmit} disabled={!email.trim()} loading={loading} className="w-full" />
                </>
            )}
        </AuthForm>
    );
}

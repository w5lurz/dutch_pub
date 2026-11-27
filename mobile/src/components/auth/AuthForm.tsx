import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';

import { DutchPubLogo } from '@/components/icons';

export type AuthFormProps = {
    /** Heading above the fields, e.g. "Sign in to your account". */
    title: string;
    children: ReactNode;
    /** Rendered under the fields (e.g. a "Sign up" link). */
    footer?: ReactNode;
};

/**
 * Keyboard-aware, scrollable card for the login / registration stack screens.
 * Must be rendered under a stack header: the header height offsets the keyboard avoidance.
 */
export function AuthForm({ title, children, footer }: AuthFormProps) {
    const headerHeight = useHeaderHeight();

    return (
        // Edge-to-edge on Android too, so 'padding' is needed on both platforms (Expo keyboard guide).
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight} className="flex-1 bg-gray-50">
            <ScrollView
                className="flex-1"
                contentContainerClassName="grow items-center justify-center p-4"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                <View className="mb-6 flex-row items-center gap-3">
                    <DutchPubLogo size={40} />
                    <Text className="text-2xl font-semibold text-gray-900">Dutch Pub</Text>
                </View>
                <View className="w-full max-w-md gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow">
                    <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">
                        {title}
                    </Text>
                    {children}
                    {footer}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default AuthForm;

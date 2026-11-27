import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { useAppSelector } from '@/store';

export type WelcomeActionsProps = {
    className?: string;
};

/** "Play" plus, when signed out, "Log in" / "Register". */
export function WelcomeActions({ className = '' }: WelcomeActionsProps) {
    const user = useAppSelector(state => state.user);
    const { t } = useTranslation();

    return (
        <View className={`gap-3 ${className}`}>
            <Button label={t('common.play')} onPress={() => router.navigate('/play')} className="w-full" />
            {!user && (
                <View className="flex-row gap-3">
                    <Button label={t('common.logIn')} variant="blue" onPress={() => router.push('/login')} className="flex-1" />
                    <Button label={t('common.register')} variant="gray" onPress={() => router.push('/registration')} className="flex-1" />
                </View>
            )}
        </View>
    );
}

export default WelcomeActions;

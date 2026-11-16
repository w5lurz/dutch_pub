import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { useAppSelector } from '@/store';

export type WelcomeActionsProps = {
    className?: string;
};

/** "Play" plus, when signed out, "Log in" / "Register". */
export function WelcomeActions({ className = '' }: WelcomeActionsProps) {
    const user = useAppSelector(state => state.user);

    return (
        <View className={`gap-3 ${className}`}>
            <Button label="Play" onPress={() => router.navigate('/play')} className="w-full" />
            {!user && (
                <View className="flex-row gap-3">
                    <Button label="Log in" variant="blue" onPress={() => router.push('/login')} className="flex-1" />
                    <Button label="Register" variant="gray" onPress={() => router.push('/registration')} className="flex-1" />
                </View>
            )}
        </View>
    );
}

export default WelcomeActions;

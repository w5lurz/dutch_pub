import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { APP_VERSION, HAS_STORE, openStore, useUpdateRequired } from '@/lib/appVersion';

/**
 * Covers the whole app once the server refuses this version (older than its MIN_APP_VERSION):
 * nothing else would work anyway. One button to the store page. Mount once, last.
 */
export default function UpdateRequired() {
    const required = useUpdateRequired();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    if (!required) return null;
    return (
        <View
            testID="update-required"
            accessibilityViewIsModal
            className="absolute inset-0 z-50 items-center justify-center gap-4 bg-white px-8"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <Text className="text-5xl">🍺</Text>
            <Text accessibilityRole="header" className="text-center text-2xl font-bold text-gray-900">
                {t('update.title')}
            </Text>
            <Text className="text-center text-base text-gray-700">{t('update.text')}</Text>
            {HAS_STORE ? <Button label={t('update.button')} onPress={() => void openStore()} className="mt-2 w-full max-w-xs" testID="update-button" /> : null}
            <Text className="text-xs text-gray-500">v{APP_VERSION}</Text>
        </View>
    );
}

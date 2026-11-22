import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type GuestBadgeProps = {
    className?: string;
};

/** Small pill marking a guest (unregistered) user. */
export function GuestBadge({ className = '' }: GuestBadgeProps) {
    const { t } = useTranslation();
    return (
        <View
            accessible
            accessibilityLabel={t('account.guestUser')}
            className={`self-center rounded-full border border-yellow-500 bg-yellow-100 px-3 py-0.5 ${className}`}
        >
            <Text className="text-xs font-semibold uppercase tracking-wide text-yellow-800">{t('account.guest')}</Text>
        </View>
    );
}

export default GuestBadge;

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LeaderBoardHeader, LeaderBoardRow, useLeaderBoard, type LeaderBoardEntry } from '@/components/leaderboard';
import { Button, Screen } from '@/components/ui';
import { useTheme } from '@/lib/theme';

const keyExtractor = (item: LeaderBoardEntry) => item.winner;
const renderItem = ({ item }: { item: LeaderBoardEntry }) => <LeaderBoardRow entry={item} />;

export default function LeaderboardScreen() {
    const { t } = useTranslation();
    const colors = useTheme();
    const { status, data, refresh, reload } = useLeaderBoard();

    // Refetch whenever the tab gains focus (also the first load), so a just-finished game shows up.
    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload]),
    );

    if (status === 'idle' || status === 'loading') {
        return (
            <Screen contentClassName="items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent} accessibilityLabel={t('leaderboard.loading')} />
            </Screen>
        );
    }

    if (status === 'error') {
        return (
            <Screen contentClassName="items-center justify-center gap-4">
                <Text className="text-center text-base text-gray-800">{t('leaderboard.error')}</Text>
                <Button label={t('common.retry')} variant="blue" onPress={reload} />
            </Screen>
        );
    }

    return (
        <Screen padded={false} background="gray">
            <FlatList
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                className="flex-1"
                contentContainerClassName="grow p-4"
                ListHeaderComponent={data.length > 0 ? <LeaderBoardHeader /> : undefined}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center gap-4 py-16">
                        <Text accessibilityRole="header" className="text-center text-lg font-semibold text-gray-800">
                            {t('leaderboard.emptyTitle')}
                        </Text>
                        <Text className="text-center text-base text-gray-600">{t('leaderboard.emptyText')}</Text>
                        <Button label={t('common.play')} onPress={() => router.navigate('/play')} />
                    </View>
                }
                refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={refresh} colors={[colors.accent]} tintColor={colors.accent} />}
            />
        </Screen>
    );
}

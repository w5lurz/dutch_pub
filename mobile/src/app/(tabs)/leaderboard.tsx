import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LeaderBoardHeader, LeaderBoardRow, Podium, useLeaderBoard, type LeaderBoardEntry } from '@/components/leaderboard';
import { Button, Screen } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useAppSelector } from '@/store';

const keyExtractor = (item: LeaderBoardEntry) => item.winner;

export default function LeaderboardScreen() {
    const { t } = useTranslation();
    const colors = useTheme();
    const { status, data, refresh, reload } = useLeaderBoard();
    const username = useAppSelector(state => state.user?.username);
    const onList = !!username && data.some(entry => entry.winner === username);

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
                // The top three stand on the podium; the list goes on from the fourth.
                data={data.slice(3)}
                keyExtractor={keyExtractor}
                className="flex-1"
                contentContainerClassName="grow p-4"
                renderItem={({ item }) => <LeaderBoardRow entry={item} isYou={item.winner === username} />}
                ListHeaderComponent={
                    data.length > 0 ? (
                        <>
                            <Podium top={data.slice(0, 3)} username={username} />
                            {data.length > 3 ? <LeaderBoardHeader /> : null}
                        </>
                    ) : undefined
                }
                ListFooterComponent={
                    data.length > 0 && username && !onList ? (
                        <Text className="py-6 text-center text-base text-gray-600">{t('leaderboard.notOnList')}</Text>
                    ) : undefined
                }
                ListEmptyComponent={
                    data.length > 0 ? undefined : (
                    <View className="flex-1 items-center justify-center gap-4 py-16">
                        <Text accessibilityRole="header" className="text-center text-lg font-semibold text-gray-800">
                            {t('leaderboard.emptyTitle')}
                        </Text>
                        <Text className="text-center text-base text-gray-600">{t('leaderboard.emptyText')}</Text>
                        <Button label={t('common.play')} onPress={() => router.navigate('/play')} />
                    </View>
                    )
                }
                refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={refresh} colors={[colors.accent]} tintColor={colors.accent} />}
            />
        </Screen>
    );
}

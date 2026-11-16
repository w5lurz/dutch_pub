import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';

import { LeaderBoardHeader, LeaderBoardRow, useLeaderBoard, type LeaderBoardEntry } from '@/components/leaderboard';
import { Button, Screen } from '@/components/ui';

const keyExtractor = (item: LeaderBoardEntry) => item.winner;
const renderItem = ({ item }: { item: LeaderBoardEntry }) => <LeaderBoardRow entry={item} />;

export default function LeaderboardScreen() {
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
                <ActivityIndicator size="large" color="#2563eb" accessibilityLabel="Loading leaderboard" />
            </Screen>
        );
    }

    if (status === 'error') {
        return (
            <Screen contentClassName="items-center justify-center gap-4">
                <Text className="text-center text-base text-gray-800">Error fetching data!</Text>
                <Button label="Retry" variant="blue" onPress={reload} />
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
                            No games played yet
                        </Text>
                        <Text className="text-center text-base text-gray-600">Play a game and be the first on the Leaderboard!</Text>
                        <Button label="Play" onPress={() => router.navigate('/play')} />
                    </View>
                }
                refreshControl={<RefreshControl refreshing={status === 'refreshing'} onRefresh={refresh} colors={['#2563eb']} tintColor="#2563eb" />}
            />
        </Screen>
    );
}

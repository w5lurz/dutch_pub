import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui';
import type { LeaderBoardEntry } from './LeaderBoardRow';

/** Each place's step: medal, height and colour (gold / silver / bronze, as the list's badges). */
const STEPS: Record<1 | 2 | 3, { medal: string; height: number; className: string }> = {
    1: { medal: '🥇', height: 72, className: 'bg-yellow-300 border-yellow-500' },
    2: { medal: '🥈', height: 52, className: 'bg-gray-200 border-gray-400' },
    3: { medal: '🥉', height: 38, className: 'bg-orange-200 border-orange-400' },
};

function Place({ entry, place, isYou }: { entry: LeaderBoardEntry; place: 1 | 2 | 3; isYou: boolean }) {
    const { t } = useTranslation();
    const step = STEPS[place];
    const size = place === 1 ? 64 : 52;
    return (
        <View
            accessible
            accessibilityLabel={t('leaderboard.rowLabel', { rank: place, name: entry.winner, count: entry.wins, friend: entry.favouriteFriend || '-', latest: '' })}
            className="flex-1 items-center justify-end"
        >
            <Text className="text-2xl">{step.medal}</Text>
            <View className={`rounded-full border-4 ${isYou ? 'border-green-500' : 'border-transparent'}`}>
                <Avatar username={entry.winner} avatar={entry.winnerAvatar} size={size} />
            </View>
            <Text numberOfLines={1} className="mt-1 max-w-full px-1 text-sm font-bold text-gray-900">
                {entry.winner}
            </Text>
            {isYou ? (
                <View className="rounded-full bg-green-200 px-1.5">
                    <Text className="text-xs font-semibold text-green-900">{t('leaderboard.you')}</Text>
                </View>
            ) : null}
            <View style={{ height: step.height }} className={`mt-1 w-full items-center justify-center rounded-t-md border-2 border-b-0 ${step.className}`}>
                <Text className="text-lg font-bold text-gray-900">{entry.wins}</Text>
                <Text className="text-xs text-gray-800">{t('leaderboard.wins')}</Text>
            </View>
        </View>
    );
}

/**
 * The top three on a podium above the list: first in the middle on the tallest step, second
 * on the left, third on the right (fewer steps with fewer players).
 */
export function Podium({ top, username }: { top: readonly LeaderBoardEntry[]; username?: string }) {
    const [first, second, third] = top;
    if (!first) return null;
    return (
        <View testID="podium" className="mb-4 flex-row items-end gap-2 px-2 pt-2">
            {second ? <Place entry={second} place={2} isYou={second.winner === username} /> : <View className="flex-1" />}
            <Place entry={first} place={1} isYou={first.winner === username} />
            {third ? <Place entry={third} place={3} isYou={third.winner === username} /> : <View className="flex-1" />}
        </View>
    );
}

export default Podium;

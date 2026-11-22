import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui';
import type { LeaderBoardEntry } from './LeaderBoardRow';

/**
 * Each place's step: medal, height and colour. Literal gold / silver / bronze (not the palette,
 * which flips in dark mode and turned silver into dark gray), with dark text on them.
 */
const STEPS: Record<1 | 2 | 3, { medal: string; height: number; fill: string; edge: string }> = {
    1: { medal: '🥇', height: 72, fill: '#facc15', edge: '#ca8a04' },
    2: { medal: '🥈', height: 52, fill: '#d1d5db', edge: '#9ca3af' },
    3: { medal: '🥉', height: 38, fill: '#fdba74', edge: '#ea580c' },
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
            <View
                style={{ height: step.height, backgroundColor: step.fill, borderColor: step.edge }}
                className="mt-1 w-full items-center justify-center rounded-t-md border-2 border-b-0"
            >
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700' }}>{entry.wins}</Text>
                <Text style={{ color: '#1f2937', fontSize: 12 }}>{t('leaderboard.wins')}</Text>
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

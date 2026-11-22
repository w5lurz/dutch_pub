import type { TLeaderBoard } from '@dutch-pub/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';

import { Avatar } from '@/components/ui';

export type LeaderBoardEntry = TLeaderBoard[number];

export type LeaderBoardRowProps = {
    entry: LeaderBoardEntry;
    /** The signed-in player's own row: marked "You". */
    isYou?: boolean;
};

// Gold / silver / bronze badges for the podium; plain badge for everyone else.
const rankBadgeClasses: Record<number, string> = {
    1: 'bg-yellow-300 border-yellow-500',
    2: 'bg-gray-200 border-gray-400',
    3: 'bg-orange-200 border-orange-400',
};
const defaultBadgeClasses = 'bg-white border-gray-200';

/**
 * Formats the server's `latestWin` (a Sequelize DATE, serialized as an ISO string).
 * Falls back to the raw value when it is not a parsable date, and to "-" when missing.
 */
export function formatLatestWin(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Column layout shared by the header and the rows, sized to fit small phones:
 * Rank | Username + Favourite friend | Wins + Latest win.
 */
const col = {
    rank: 'w-12 items-center',
    player: 'flex-1 min-w-0 px-2',
    wins: 'w-28 items-end',
} as const;

export function LeaderBoardHeader() {
    const { t } = useTranslation();
    return (
        <View
            className="flex-row items-center rounded-t-md bg-blue-300 px-2 py-2"
            accessibilityRole="header"
            accessibilityLabel={[t('leaderboard.rank'), t('auth.username'), t('leaderboard.favouriteFriend'), t('leaderboard.wins'), t('leaderboard.latestWin')].join(', ')}
        >
            <View className={col.rank}>
                <Text className="text-xs font-semibold uppercase text-gray-700">{t('leaderboard.rank')}</Text>
            </View>
            <View className={col.player}>
                <Text className="text-xs font-semibold uppercase text-gray-700">{t('auth.username')}</Text>
                <Text className="text-xs text-gray-700">{t('leaderboard.favouriteFriend')}</Text>
            </View>
            <View className={col.wins}>
                <Text className="text-xs font-semibold uppercase text-gray-700">{t('leaderboard.wins')}</Text>
                <Text className="text-xs text-gray-700">{t('leaderboard.latestWin')}</Text>
            </View>
        </View>
    );
}

export function LeaderBoardRow({ entry, isYou = false }: LeaderBoardRowProps) {
    const { t } = useTranslation();
    const { rank, winner, wins, favouriteFriend, latestWin, winnerAvatar, favouriteFriendAvatar } = entry;
    const isPodium = rank <= 3;
    const latest = formatLatestWin(latestWin);
    const friend = favouriteFriend || '-';

    return (
        <View
            className={`flex-row items-center border-b border-l-4 border-b-gray-200 px-2 py-3 ${isYou ? 'border-l-green-500' : 'border-l-transparent'} ${isPodium ? 'bg-blue-50' : 'bg-white'}`}
            accessible
            accessibilityLabel={t('leaderboard.rowLabel', { rank, name: winner, count: wins, friend, latest })}
        >
            <View className={col.rank}>
                <View className={`h-9 w-9 items-center justify-center rounded-full border-2 ${rankBadgeClasses[rank] ?? defaultBadgeClasses}`}>
                    <Text className={`text-sm text-gray-900 ${isPodium ? 'font-bold' : 'font-medium'}`}>#{rank}</Text>
                </View>
            </View>
            <View className={`${col.player} flex-row items-center gap-2`}>
                <Avatar username={winner} avatar={winnerAvatar} size={36} />
                <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-1.5">
                        <Text numberOfLines={1} className={`flex-shrink text-base text-gray-900 ${isPodium ? 'font-bold' : 'font-medium'}`}>
                            {winner}
                        </Text>
                        {isYou ? (
                            <View className="rounded-full bg-green-200 px-1.5">
                                <Text className="text-xs font-semibold text-green-900">{t('leaderboard.you')}</Text>
                            </View>
                        ) : null}
                    </View>
                    <View className="flex-row items-center gap-1">
                        {favouriteFriend ? <Avatar username={favouriteFriend} avatar={favouriteFriendAvatar} size={16} /> : null}
                        <Text numberOfLines={1} className="flex-shrink text-sm text-gray-500">
                            {friend}
                        </Text>
                    </View>
                </View>
            </View>
            <View className={col.wins}>
                <Text className="text-base font-semibold text-gray-900">{wins}</Text>
                {/* Older rows have no date: nothing instead of a dash. */}
                {latestWin ? (
                    <Text numberOfLines={1} className="text-xs text-gray-500">
                        {latest}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

export default LeaderBoardRow;

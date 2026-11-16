import type { TLeaderBoard } from '@dutch-pub/shared';
import { Text, View } from 'react-native';

export type LeaderBoardEntry = TLeaderBoard[number];

export type LeaderBoardRowProps = {
    entry: LeaderBoardEntry;
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
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
    return (
        <View
            className="flex-row items-center rounded-t-md bg-blue-300 px-2 py-2"
            accessibilityRole="header"
            accessibilityLabel="Rank, Username, Favourite friend, Wins, Latest win"
        >
            <View className={col.rank}>
                <Text className="text-xs font-semibold uppercase text-gray-700">Rank</Text>
            </View>
            <View className={col.player}>
                <Text className="text-xs font-semibold uppercase text-gray-700">Username</Text>
                <Text className="text-xs text-gray-700">Favourite friend</Text>
            </View>
            <View className={col.wins}>
                <Text className="text-xs font-semibold uppercase text-gray-700">Wins</Text>
                <Text className="text-xs text-gray-700">Latest win</Text>
            </View>
        </View>
    );
}

export function LeaderBoardRow({ entry }: LeaderBoardRowProps) {
    const { rank, winner, wins, favouriteFriend, latestWin } = entry;
    const isPodium = rank <= 3;
    const latest = formatLatestWin(latestWin);
    const friend = favouriteFriend || '-';

    return (
        <View
            className={`flex-row items-center border-b border-gray-200 px-2 py-3 ${isPodium ? 'bg-blue-50' : 'bg-white'}`}
            accessible
            accessibilityLabel={`Rank ${rank}, ${winner}, ${wins} ${wins === 1 ? 'win' : 'wins'}, favourite friend ${friend}, latest win ${latest}`}
        >
            <View className={col.rank}>
                <View className={`h-9 w-9 items-center justify-center rounded-full border-2 ${rankBadgeClasses[rank] ?? defaultBadgeClasses}`}>
                    <Text className={`text-sm text-gray-900 ${isPodium ? 'font-bold' : 'font-medium'}`}>#{rank}</Text>
                </View>
            </View>
            <View className={col.player}>
                <Text numberOfLines={1} className={`text-base text-gray-900 ${isPodium ? 'font-bold' : 'font-medium'}`}>
                    {winner}
                </Text>
                <Text numberOfLines={1} className="text-sm text-gray-500">
                    {friend}
                </Text>
            </View>
            <View className={col.wins}>
                <Text className="text-base font-semibold text-gray-900">{wins}</Text>
                <Text numberOfLines={1} className="text-xs text-gray-500">
                    {latest}
                </Text>
            </View>
        </View>
    );
}

export default LeaderBoardRow;

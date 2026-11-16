import { ScrollView, Text, View } from 'react-native';
import type { Opponent, Opponents, TCard } from '@dutch-pub/shared';

import { PlayingCard } from './PlayingCard';

function OpponentTile({ name, opponent }: { name: string; opponent: Opponent }) {
    const summary = `${name}${opponent.active ? ', on turn' : ''}: ${opponent.hand} in hand, ${opponent.table} face-down`;

    return (
        <View className="min-w-28 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
            <View accessible accessibilityLabel={summary} className="items-center">
                <Text
                    numberOfLines={1}
                    className={`max-w-36 rounded-md px-2 text-base font-semibold text-gray-900 ${
                        opponent.active ? 'bg-green-200' : ''
                    }`}
                >
                    {name}
                </Text>
                <Text className="text-xs text-gray-600">
                    Hand {opponent.hand} · Face-down {opponent.table}
                </Text>
            </View>
            <View className="min-h-6 flex-row gap-1">
                {opponent.tableFlipped.length === 0 ? (
                    <Text className="self-center text-xs text-gray-400">No face-up cards</Text>
                ) : (
                    opponent.tableFlipped.map((card: TCard, i: number) => (
                        <PlayingCard key={`${card.color}-${card.value}-${i}`} card={card} size="sm" />
                    ))
                )}
            </View>
        </View>
    );
}

/** The other players: name (green while on turn, as on the web), card counts, face-up cards. */
export function OpponentsBar({ opponents }: { opponents: Opponents }) {
    const entries = Object.entries(opponents);
    if (entries.length === 0) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="grow-0"
            contentContainerClassName="grow justify-evenly gap-2 px-3 py-2"
        >
            {entries.map(([name, opponent]) => (
                <OpponentTile key={name} name={name} opponent={opponent} />
            ))}
        </ScrollView>
    );
}

export default OpponentsBar;

import { ScrollView, Text, View } from 'react-native';
import type { Opponent, Opponents, TCard } from '@dutch-pub/shared';

import { useCardSize } from './cardSize';
import { PlayingCard } from './PlayingCard';

/** Gap between an opponent's small face-up cards (`gap-1`). */
const SMALL_GAP = 4;
/** Horizontal padding of a tile (`px-1.5`, both sides) plus its border. */
const TILE_PADDING = 2 * 6 + 2;

function OpponentTile({ name, opponent }: { name: string; opponent: Opponent }) {
    const summary = `${name}${opponent.active ? ', on turn' : ''}: ${opponent.hand} in hand, ${opponent.table} face-down`;

    return (
        <View className="items-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 py-1">
            <View accessible accessibilityLabel={summary} className="items-center self-stretch">
                <Text
                    numberOfLines={1}
                    className={`max-w-full rounded-md px-1.5 text-sm font-semibold text-gray-900 ${
                        opponent.active ? 'bg-green-200' : ''
                    }`}
                >
                    {name}
                </Text>
                <Text numberOfLines={1} className="text-xs text-gray-600">
                    Hand {opponent.hand} · Down {opponent.table}
                </Text>
            </View>
            {opponent.tableFlipped.length === 0 ? (
                <Text className="text-xs text-gray-400">No face-up cards</Text>
            ) : (
                <View className="flex-row flex-wrap justify-center" style={{ gap: SMALL_GAP }}>
                    {opponent.tableFlipped.map((card: TCard, i: number) => (
                        <PlayingCard key={`${card.color}-${card.value}-${i}`} card={card} size="sm" />
                    ))}
                </View>
            )}
        </View>
    );
}

/**
 * The other players, as a column on the left of the landscape game screen (scrolls when
 * there are many): name (green while on turn, as on the web), card counts, face-up cards.
 * As wide as three small cards, so the usual 3 face-up cards fit in one row.
 */
export function OpponentsBar({ opponents }: { opponents: Opponents }) {
    const { width: smallWidth } = useCardSize('sm');
    const entries = Object.entries(opponents);
    if (entries.length === 0) return null;
    const tileWidth = 3 * smallWidth + 2 * SMALL_GAP + TILE_PADDING;

    return (
        <ScrollView
            className="grow-0 border-r border-gray-200"
            style={{ width: tileWidth + 16 }}
            contentContainerClassName="grow justify-center gap-2 px-2 py-2"
            showsVerticalScrollIndicator={false}
            accessibilityLabel={`Opponents, ${entries.length}`}
        >
            {entries.map(([name, opponent]) => (
                <OpponentTile key={name} name={name} opponent={opponent} />
            ))}
        </ScrollView>
    );
}

export default OpponentsBar;

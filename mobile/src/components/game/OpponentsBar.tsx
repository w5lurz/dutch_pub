import { ScrollView, Text, View } from 'react-native';
import type { Opponent, Opponents } from '@dutch-pub/shared';

import { HandFan } from './HandFan';
import { TableStacks, useTableStacksWidth } from './TableStacks';

/** Horizontal padding of a tile (`px-1.5`, both sides) plus its border. */
const TILE_PADDING = 2 * 6 + 2;

function OpponentTile({ name, opponent }: { name: string; opponent: Opponent }) {
    const summary =
        `${name}${opponent.active ? ', on turn' : ''}: ${opponent.hand} in hand, ` +
        `${opponent.tableFlipped.length} face-up, ${opponent.table} face-down`;
    const hasTableCards = opponent.tableFlipped.length > 0 || opponent.table > 0;

    return (
        <View
            className={`items-center gap-1 rounded-lg border px-1.5 py-1 ${
                opponent.active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
            }`}
        >
            <Text
                accessibilityLabel={summary}
                numberOfLines={1}
                className={`max-w-full text-sm font-semibold ${opponent.active ? 'text-green-800' : 'text-gray-900'}`}
            >
                {name}
            </Text>
            <HandFan count={opponent.hand} />
            {hasTableCards ? (
                <TableStacks faceUp={opponent.tableFlipped} faceDownCount={opponent.table} size="sm" />
            ) : (
                <Text className="text-xs text-gray-400">No table cards</Text>
            )}
        </View>
    );
}

/**
 * The other players, as a column on the left of the landscape game screen (scrolls when
 * there are many). Each tile: name (tile green while on turn), the hand as a fan of card
 * backs with a count, and the table stacks (face-up cards on their face-down ones).
 * As wide as three small stacks.
 */
export function OpponentsBar({ opponents }: { opponents: Opponents }) {
    const stacksWidth = useTableStacksWidth('sm');
    const entries = Object.entries(opponents);
    if (entries.length === 0) return null;

    return (
        <ScrollView
            className="grow-0 border-r border-gray-200"
            style={{ width: stacksWidth + TILE_PADDING + 16 }}
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

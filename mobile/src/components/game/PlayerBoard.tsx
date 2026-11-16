import { ScrollView, Text, View } from 'react-native';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize, type CardSize } from './cardSize';
import { faceDownSlots } from './faceDown';
import { PlayingCard } from './PlayingCard';

type PlayerBoardProps = {
    userCards: UserCards;
    laidCards: Cards | null;
    active: boolean;
    username?: string;
    /** `touchable`: whether this card may be played at all right now (hand first, then face-up, then face-down). */
    onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean) => void;
};

/**
 * Your side of the table (bottom of the landscape game screen): your name, then one row with
 * your table cards on the left (face-up next to face-down, rendered like the web's
 * `renderFlippedCards`) and your hand on the right, scrolling horizontally when long.
 * Play order: hand, then face-up cards once the hand is empty, then face-down cards once
 * both are empty. While the hand still has cards the table cards are drawn small, to leave
 * the width to the hand. On your turn, cards that cannot be laid on the pile are dimmed.
 */
export function PlayerBoard({ userCards, laidCards, active, username, onLayCard }: PlayerBoardProps) {
    const { hand, tableFlipped, table } = userCards;
    const handPlayable = hand.length > 0;
    const faceUpPlayable = hand.length === 0;
    const faceDownPlayable = hand.length === 0 && tableFlipped.length === 0;
    const tableSize: CardSize = handPlayable ? 'sm' : 'md';
    const { width: tableCardWidth } = useCardSize(tableSize);
    const dim = (card: TCard, playableSource: boolean) => active && playableSource && !canLayCard(card, laidCards);
    // While face-down cards can't be played yet they overlap, to leave room for the face-up ones.
    const faceDownOverlap = faceDownPlayable ? 0 : -Math.round(tableCardWidth * 0.6);
    const hasTableCards = tableFlipped.length > 0 || table > 0;

    return (
        <View className="gap-0.5 pb-1">
            <Text
                numberOfLines={1}
                accessibilityLabel={`You, ${username ?? ''}${active ? ', on turn' : ''}`}
                className={`self-center rounded-md px-2 text-sm font-semibold text-gray-900 ${active ? 'bg-green-200' : ''}`}
            >
                {username ?? ''}
            </Text>

            <View className="flex-row items-end gap-3 px-2">
                {hasTableCards ? (
                    <View className="flex-row items-end gap-3">
                        {tableFlipped.length > 0 ? (
                            <View className="items-center gap-0.5">
                                <Text className="text-xs text-gray-600">Face-up</Text>
                                <View className="flex-row" style={{ gap: CARD_GAP }}>
                                    {tableFlipped.map((card, i) => (
                                        <PlayingCard
                                            key={`${card.color}-${card.value}-${i}`}
                                            card={card}
                                            size={tableSize}
                                            dimmed={dim(card, faceUpPlayable)}
                                            accessibilityHint={faceUpPlayable ? undefined : 'Play your hand first'}
                                            onPress={() => onLayCard(card, i, faceUpPlayable)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : null}
                        {table > 0 ? (
                            <View className="items-center gap-0.5">
                                <Text className="text-xs text-gray-600">Face-down ({table})</Text>
                                <View className="flex-row" style={{ gap: faceDownPlayable ? CARD_GAP : 0 }}>
                                    {faceDownSlots(table).map(({ index, plus }) => (
                                        <PlayingCard
                                            key={`face-down-${index}`}
                                            faceDown
                                            size={tableSize}
                                            plusCount={plus}
                                            style={index > 0 ? { marginLeft: faceDownOverlap } : undefined}
                                            accessibilityHint={faceDownPlayable ? undefined : 'Play your other cards first'}
                                            onPress={() => onLayCard(index, index, faceDownPlayable)}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <View className="flex-1 items-stretch gap-0.5">
                    {handPlayable ? (
                        <>
                            <Text className="text-center text-xs text-gray-600">Hand ({hand.length})</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="grow-0"
                                // Room above for the pressed card's lift.
                                contentContainerClassName="grow justify-center pt-1.5"
                                contentContainerStyle={{ gap: CARD_GAP }}
                                accessibilityLabel={`Your hand, ${hand.length} cards`}
                            >
                                {hand.map((card, i) => (
                                    <PlayingCard
                                        key={`${card.color}-${card.value}-${i}`}
                                        card={card}
                                        dimmed={dim(card, true)}
                                        onPress={() => onLayCard(card, i, true)}
                                    />
                                ))}
                            </ScrollView>
                        </>
                    ) : (
                        <Text className="pb-4 text-center text-xs text-gray-500">Your hand is empty</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

export default PlayerBoard;

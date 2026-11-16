import { ScrollView, Text, View } from 'react-native';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize } from './cardSize';
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
 * Your side of the table: face-up table cards next to the face-down ones (rendered like the
 * web's `renderFlippedCards`), the hand in a horizontal scroll, and your name.
 * Play order: hand, then face-up cards once the hand is empty, then face-down cards once
 * both are empty. On your turn, cards that cannot be laid on the pile are dimmed.
 */
export function PlayerBoard({ userCards, laidCards, active, username, onLayCard }: PlayerBoardProps) {
    const { hand, tableFlipped, table } = userCards;
    const { width: cardWidth } = useCardSize('md');
    const handPlayable = hand.length > 0;
    const faceUpPlayable = hand.length === 0;
    const faceDownPlayable = hand.length === 0 && tableFlipped.length === 0;
    const dim = (card: TCard, playableSource: boolean) => active && playableSource && !canLayCard(card, laidCards);
    // While face-down cards can't be played yet they overlap, to leave room for the face-up ones.
    const faceDownOverlap = faceDownPlayable ? 0 : -Math.round(cardWidth * 0.6);

    return (
        <View className="gap-2 pb-2">
            <View className="flex-row items-end justify-center gap-4 px-3">
                {tableFlipped.length > 0 ? (
                    <View className="items-center gap-1">
                        <Text className="text-xs text-gray-600">Face-up</Text>
                        <View className="flex-row" style={{ gap: CARD_GAP }}>
                            {tableFlipped.map((card, i) => (
                                <PlayingCard
                                    key={`${card.color}-${card.value}-${i}`}
                                    card={card}
                                    dimmed={dim(card, faceUpPlayable)}
                                    accessibilityHint={faceUpPlayable ? undefined : 'Play your hand first'}
                                    onPress={() => onLayCard(card, i, faceUpPlayable)}
                                />
                            ))}
                        </View>
                    </View>
                ) : null}
                {table > 0 ? (
                    <View className="items-center gap-1">
                        <Text className="text-xs text-gray-600">Face-down ({table})</Text>
                        <View className="flex-row" style={{ gap: faceDownPlayable ? CARD_GAP : 0 }}>
                            {faceDownSlots(table).map(({ index, plus }) => (
                                <PlayingCard
                                    key={`face-down-${index}`}
                                    faceDown
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

            {handPlayable ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="grow-0"
                    // Room above for the pressed card's lift.
                    contentContainerClassName="grow justify-center px-3 pt-2"
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
            ) : (
                <Text className="text-center text-xs text-gray-500">Your hand is empty</Text>
            )}

            <Text
                numberOfLines={1}
                className={`self-center rounded-md px-2 text-lg font-semibold text-gray-900 ${active ? 'bg-green-200' : ''}`}
            >
                {username ?? ''}
            </Text>
        </View>
    );
}

export default PlayerBoard;

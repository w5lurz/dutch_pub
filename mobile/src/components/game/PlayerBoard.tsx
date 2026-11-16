import { ScrollView, Text, View } from 'react-native';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize } from './cardSize';
import { PlayingCard } from './PlayingCard';
import { TableStacks } from './TableStacks';

/** From this many cards on, the hand overlaps a little (and still scrolls when longer). */
const OVERLAP_FROM = 8;
/** Share of each hand card hidden under the next one when overlapping. */
const HAND_OVERLAP = 0.25;

type PlayerBoardProps = {
	userCards: UserCards;
	laidCards: Cards | null;
	active: boolean;
	username?: string;
	/** `touchable`: whether this card may be played at all right now (hand first, then face-up, then face-down). */
	onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean) => void;
};

/**
 * Your side of the table (bottom of the landscape game screen): your hand centred, scrolling
 * horizontally when long (cards overlap slightly from 8 cards on); below it your table
 * stacks, centred, with your name on their left. Play order: hand, then face-up cards once
 * the hand is empty, then face-down cards once both are empty. While the hand still has
 * cards the stacks are drawn small and faded (not playable yet). On your turn, cards that
 * cannot be laid on the pile are dimmed.
 */
export function PlayerBoard({ userCards, laidCards, active, username, onLayCard }: PlayerBoardProps) {
	const { hand, tableFlipped, table } = userCards;
	const { width: cardWidth } = useCardSize('md');
	const handPlayable = hand.length > 0;
	const faceUpPlayable = hand.length === 0;
	const faceDownPlayable = hand.length === 0 && tableFlipped.length === 0;
	const dim = (card: TCard) => active && !canLayCard(card, laidCards);
	const overlapHand = hand.length >= OVERLAP_FROM;
	const hasTableCards = tableFlipped.length > 0 || table > 0;

	return (
		<View className="gap-1 pb-1">
			{handPlayable ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					className="grow-0"
					// Room above for the pressed card's lift.
					contentContainerClassName="grow justify-center px-2 pt-1.5"
					contentContainerStyle={{ gap: overlapHand ? 0 : CARD_GAP }}
					accessibilityLabel={`Your hand, ${hand.length} cards`}
				>
					{hand.map((card, i) => (
						<PlayingCard
							key={`${card.color}-${card.value}-${i}`}
							card={card}
							dimmed={dim(card)}
							style={overlapHand && i > 0 ? { marginLeft: -Math.round(cardWidth * HAND_OVERLAP) } : undefined}
							onPress={() => onLayCard(card, i, true)}
						/>
					))}
				</ScrollView>
			) : null}

			{/* Name | stacks | spacer: the side columns share the rest, so the stacks stay centred. */}
			<View className="flex-row items-center px-2">
				<View className="flex-1 items-end pr-3">
					<Text
						numberOfLines={1}
						accessibilityLabel={`You, ${username ?? ''}${active ? ', on turn' : ''}`}
						className={`rounded-md px-2 text-sm font-semibold text-gray-900 ${active ? 'bg-green-200' : ''}`}
					>
						{username ?? ''}
					</Text>
				</View>
				{hasTableCards ? (
					<View style={{ opacity: handPlayable ? 0.75 : 1 }}>
						<TableStacks
							faceUp={tableFlipped}
							faceDownCount={table}
							size={handPlayable ? 'sm' : 'md'}
							play={{ faceUpPlayable, faceDownPlayable, dim, onLayCard }}
						/>
					</View>
				) : null}
				<View className="flex-1" />
			</View>
		</View>
	);
}

export default PlayerBoard;

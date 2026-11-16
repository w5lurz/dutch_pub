import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize } from './cardSize';
import { DraggableCard } from './DraggableCard';
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
	/**
	 * `touchable`: whether this card may be played at all right now (hand first, then face-up,
	 * then face-down). Returns whether the card was played.
	 */
	onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean) => boolean;
};

/**
 * Your side of the table (bottom of the landscape game screen): your hand centred, scrolling
 * horizontally when long (cards overlap slightly from 8 cards on); below it your table
 * stacks, centred, with your name on their left. Play order: hand, then face-up cards once
 * the hand is empty, then face-down cards once both are empty. While the hand still has
 * cards the stacks are drawn small and faded (not playable yet). On your turn, cards that
 * cannot be laid on the pile are dimmed.
 *
 * Tap a card to select it (one at a time for now; selecting several cards of the same value
 * to lay them together is planned), drag it onto the laid pile to play it.
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

	// Ids include the card, so a selection never jumps to a different card when the cards change.
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const toggleSelected = (id: string) => setSelectedId(current => (current === id ? null : id));
	const play = (card: TCard | number, cardIndex: number, touchable: boolean) => {
		const played = onLayCard(card, cardIndex, touchable);
		if (played) setSelectedId(null);
		return played;
	};

	return (
		<View className="gap-1 pb-1">
			{handPlayable ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={{ flexGrow: 0 }}
					// Room above for the selected card's lift. (Gesture Handler's ScrollView, so it
					// works together with the cards' drag gesture; it takes no className.)
					contentContainerStyle={{
						flexGrow: 1,
						justifyContent: 'center',
						paddingHorizontal: 8,
						paddingTop: 10,
						gap: overlapHand ? 0 : CARD_GAP,
					}}
					accessibilityLabel={`Your hand, ${hand.length} cards`}
				>
					{hand.map((card, i) => {
						const id = `hand-${i}-${card.color}-${card.value}`;
						return (
							<DraggableCard
								key={id}
								id={id}
								card={card}
								size="md"
								inHorizontalScroll
								selected={selectedId === id}
								dimmed={dim(card)}
								style={overlapHand && i > 0 ? { marginLeft: -Math.round(cardWidth * HAND_OVERLAP) } : undefined}
								onSelect={() => toggleSelected(id)}
								onPlay={() => play(card, i, true)}
							/>
						);
					})}
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
					<TableStacks
						faceUp={tableFlipped}
						faceDownCount={table}
						size={handPlayable ? 'sm' : 'md'}
						faded={handPlayable}
						play={{ faceUpPlayable, faceDownPlayable, dim, onLayCard: play, selectedId, onSelect: toggleSelected }}
					/>
				) : null}
				<View className="flex-1" />
			</View>
		</View>
	);
}

export default PlayerBoard;

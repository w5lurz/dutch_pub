import { useState, type ReactNode } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import { useCardSize, type CardSize } from './cardSize';
import { DraggableCard } from './DraggableCard';
import { handArcLayout } from './handArc';
import { SeatAvatar } from './Seat';
import { TableStacks } from './TableStacks';

/** Horizontal room kept free on each side of the hand. */
const HAND_PADDING = 8;
/** Room kept free on both sides of the hand for the chat button in the bottom-left corner (48dp + margins). */
const CORNER_SPACE = 60;
/** How far a selected hand card lifts (along its tilt); the hand keeps this much room above it. */
const HAND_LIFT = 14;

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
	/** Size of your hand cards (bigger in the wide layout). Default 'md'. */
	handSize?: CardSize;
	/**
	 * The hand covers the lower half of your table stacks (short windows, e.g. a phone turned
	 * sideways), like cards held above the ones lying in front of you. The stacks cannot be
	 * played while the hand has cards, and without a hand nothing covers them.
	 */
	overlapStacks?: boolean;
	/** Shown in the bottom-left corner (the chat button). */
	corner?: ReactNode;
};

/**
 * Your side of the table (bottom of the game screen), one centred column: your avatar and
 * name, your table stacks on the table in front of you, and your hand along the bottom edge,
 * held as a fan (`handArcLayout`: tilted cards on an arc, closing up when long instead of
 * scrolling); the chat button (`corner`) in the bottom-left corner. On short windows the
 * hand covers the lower half of the stacks (`overlapStacks`).
 * Play order: hand, then face-up cards once the hand is empty, then face-down cards once
 * both are empty. While the hand still has cards the stacks are drawn small and faded (not
 * playable yet). On your turn, cards that cannot be laid on the pile are dimmed.
 *
 * Tap a card to select it (one at a time for now; selecting several cards of the same value
 * to lay them together is planned), drag it onto the laid pile to play it.
 */
export function PlayerBoard({
	userCards,
	laidCards,
	active,
	username,
	onLayCard,
	handSize = 'md',
	overlapStacks = false,
	corner,
}: PlayerBoardProps) {
	const { hand, tableFlipped, table } = userCards;
	const { width: cardWidth, height: cardHeight } = useCardSize(handSize);
	const { height: stackCardHeight } = useCardSize('sm');
	const { width: avatarCard } = useCardSize('xs');
	const handPlayable = hand.length > 0;
	const faceUpPlayable = hand.length === 0;
	const faceDownPlayable = hand.length === 0 && tableFlipped.length === 0;
	const dim = (card: TCard) => active && !canLayCard(card, laidCards);
	const hasTableCards = tableFlipped.length > 0 || table > 0;

	// The fan is laid out in the width the hand has (measured), minus room at the sides.
	const handPadding = corner ? CORNER_SPACE : HAND_PADDING;
	// Until it is measured, the window width (no empty first frame).
	const { width: windowWidth } = useWindowDimensions();
	const [handWidth, setHandWidth] = useState(0);
	const arc = handArcLayout(hand.length, cardWidth, cardHeight, (handWidth || windowWidth) - 2 * handPadding, HAND_LIFT);

	// Ids include the card, so a selection never jumps to a different card when the cards change.
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const toggleSelected = (id: string) => setSelectedId(current => (current === id ? null : id));
	const play = (card: TCard | number, cardIndex: number, touchable: boolean) => {
		const played = onLayCard(card, cardIndex, touchable);
		if (played) setSelectedId(null);
		return played;
	};

	const handView = handPlayable ? (
		<View
			onLayout={event => setHandWidth(event.nativeEvent.layout.width)}
			style={{ height: arc.height }}
			accessibilityLabel={`Your hand, ${hand.length} cards`}
		>
			{hand.map((card, i) => {
				// Keyed by the card (plus its occurrence, in case of duplicates), not its
				// position: the cards then animate in / out and glide along the arc.
				const occurrence = hand.slice(0, i).filter(c => c.color === card.color && c.value === card.value).length;
				const id = `hand-${card.color}-${card.value}-${occurrence}`;
				const place = arc.cards[i];
				return (
					<DraggableCard
						key={id}
						id={id}
						card={card}
						size={handSize}
						rotation={place.rotation}
						lift={HAND_LIFT}
						selected={selectedId === id}
						dimmed={dim(card)}
						// Later cards lie on top, so each card's top-left corner index stays visible.
						style={{ position: 'absolute', left: handPadding + place.left, top: place.top, zIndex: i }}
						onSelect={() => toggleSelected(id)}
						onPlay={() => play(card, i, true)}
					/>
				);
			})}
		</View>
	) : null;

	// Under a hand the stacks are small, faded (not playable yet) and, on short windows, mostly covered (the top 40% shows).
	const covered = overlapStacks && handPlayable;
	const stacks = hasTableCards ? (
		<View className="items-center" style={{ marginBottom: covered ? -Math.round(stackCardHeight * 0.6) : 4 }}>
			<TableStacks
				faceUp={tableFlipped}
				faceDownCount={table}
				size={handPlayable ? 'sm' : 'md'}
				faded={handPlayable}
				play={{ faceUpPlayable, faceDownPlayable, dim, onLayCard: play, selectedId, onSelect: toggleSelected }}
			/>
		</View>
	) : null;

	// Avatar and name on one line, like at the opponents' seats.
	const you = (
		<View
			accessible
			accessibilityLabel={`You, ${username ?? ''}${active ? ', on turn' : ''}`}
			className="flex-row items-center justify-center gap-1.5"
		>
			<SeatAvatar name={username ?? '?'} active={active} size={Math.max(24, Math.round(avatarCard * 0.8))} />
			<Text numberOfLines={1} className={`max-w-32 text-xs font-semibold ${active ? 'text-green-800' : 'text-gray-900'}`}>
				{username ?? ''}
			</Text>
		</View>
	);

	// One centred column: you, your table stacks, your hand (drawn last, so it lies on top of
	// covered stacks). The chat button (`corner`) sits in the bottom-left corner; the hand keeps that
	// much room on both sides, so it never covers a card and the hand stays centred.
	return (
		<View className="pb-1">
			{you}
			{stacks}
			{handView}
			{corner ? <View className="absolute bottom-1 left-1">{corner}</View> : null}
		</View>
	);
}

export default PlayerBoard;

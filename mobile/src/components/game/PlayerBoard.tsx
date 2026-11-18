import { useState, type ReactNode, type Ref } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { canLayCard, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import type { ViewRef } from './CardDrag';
import { useCardSize, type CardSize } from './cardSize';
import { DraggableCard } from './DraggableCard';
import { useDrawnCards } from './drawnCards';
import { handArcLayout } from './handArc';
import { HandSilhouette } from './HandSilhouette';
import { SeatAvatar } from './Seat';
import { TableStacks } from './TableStacks';
import { useTableTheme } from './tableTheme';

/** Horizontal room kept free on each side of the hand. */
const HAND_PADDING = 8;
/** Room kept free on both sides of the hand for the corner buttons (chat, lamp: 48dp + margins). */
const CORNER_SPACE = 60;
/** How far a selected hand card lifts (along its tilt); the hand keeps this much room above it. */
const HAND_LIFT = 14;
/** Share of a hand card below the screen edge on short windows (`overlapStacks`). */
const HANG_OFF = 0.3;

type PlayerBoardProps = {
	userCards: UserCards;
	laidCards: Cards | null;
	active: boolean;
	username?: string;
	/** Your chosen avatar id; null / missing: the one generated from your name. */
	avatar?: string | null;
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
	/** Shown in the bottom-right corner (the lamp switch). */
	cornerRight?: ReactNode;
	/** Set to your avatar and name (the winner's shot glass stops beside them). */
	avatarRef?: Ref<ViewRef | null>;
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
	avatar,
	onLayCard,
	handSize = 'md',
	overlapStacks = false,
	corner,
	cornerRight,
	avatarRef,
}: PlayerBoardProps) {
	const { labelStyle } = useTableTheme();
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
	const handPadding = corner || cornerRight ? CORNER_SPACE : HAND_PADDING;
	// Until it is measured, the window width (no empty first frame).
	const { width: windowWidth } = useWindowDimensions();
	const [handWidth, setHandWidth] = useState(0);
	const arc = handArcLayout(
		hand.length,
		cardWidth,
		cardHeight,
		(handWidth || windowWidth) - 2 * handPadding,
		HAND_LIFT,
	);

	// Ids include the card, so a selection never jumps to a different card when the cards change.
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const toggleSelected = (id: string) => setSelectedId((current) => (current === id ? null : id));
	const play = (card: TCard | number, cardIndex: number, touchable: boolean) => {
		const played = onLayCard(card, cardIndex, touchable);
		if (played) setSelectedId(null);
		return played;
	};

	// Keyed by the card (plus its occurrence, in case of duplicates), not its position: the cards
	// then animate in / out and glide along the arc, and newly drawn ones fly in (useDrawnCards).
	const handIds = hand.map((card, i) => {
		const occurrence = hand.slice(0, i).filter((c) => c.color === card.color && c.value === card.value).length;
		return `hand-${card.color}-${card.value}-${occurrence}`;
	});
	const hangOff = overlapStacks ? Math.round(cardHeight * HANG_OFF) : 0;
	const { boardRef, enterFrom: drawnFrom } = useDrawnCards(handIds, laidCards?.length ?? 0);

	const handView = handPlayable ? (
		<View
			onLayout={(event) => setHandWidth(event.nativeEvent.layout.width)}
			// On short windows the hand hangs partly off the bottom edge (its corner indices stay
			// visible), like cards held at the table edge: the piles and seats keep their room.
			style={{ height: arc.height, marginBottom: -hangOff }}
			accessibilityLabel={`Your hand, ${hand.length} cards`}
		>
			{hand.map((card, i) => {
				const id = handIds[i];
				const place = arc.cards[i];
				// From the board's bottom: its padding (pb-1, 4dp), less what hangs off the screen.
				const enterFrom = drawnFrom(
					id,
					handPadding + place.left + cardWidth / 2,
					hangOff - 4 - (arc.height - place.top - cardHeight / 2),
					cardWidth,
				);
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
						enterFrom={enterFrom}
						onSelect={() => toggleSelected(id)}
						onPlay={() => play(card, i, true)}
					/>
				);
			})}
			{/* Your thumb on the front of the fan (only a drawing: touches reach the cards below it). */}
			<HandSilhouette
				centre={(handWidth || windowWidth) / 2}
				// The hand's bottom edge, less what hangs off the screen.
				bottom={arc.height - hangOff}
				cardWidth={cardWidth}
				style={{ zIndex: hand.length }}
			/>
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
			className="flex-row items-center justify-center"
		>
			{/* Just the avatar and the name (measured for the winner's shot glass). */}
			<View ref={avatarRef} collapsable={false} className="flex-row items-center gap-1.5">
				<SeatAvatar
					name={username ?? '?'}
					active={active}
					size={Math.max(24, Math.round(avatarCard * 0.8))}
					avatarId={avatar}
				/>
				<Text
					numberOfLines={1}
					className={`max-w-32 text-xs font-semibold ${active ? 'text-green-800' : 'text-gray-900'}`}
					style={labelStyle}
				>
					{username ?? ''}
				</Text>
			</View>
		</View>
	);

	// One centred column: you, your table stacks, your hand (drawn last, so it lies on top of
	// covered stacks). The chat button (`corner`) and the lamp switch (`cornerRight`) sit in the
	// bottom corners; the hand keeps room on both sides, so it never covers them and stays centred.
	return (
		<View ref={boardRef} collapsable={false} className="pb-1">
			{you}
			{stacks}
			{handView}
			{corner ? <View className="absolute bottom-2 left-2">{corner}</View> : null}
			{cornerRight ? <View className="absolute bottom-2 right-2">{cornerRight}</View> : null}
		</View>
	);
}

export default PlayerBoard;

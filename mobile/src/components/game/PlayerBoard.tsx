import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import * as Haptics from 'expo-haptics';
import { Text, useWindowDimensions, View } from 'react-native';
import i18n from '@/i18n';
import { canLayCard, type CardRules, type Cards, type TCard, type UserCards } from '@dutch-pub/shared';

import type { Companion, ViewRef } from './CardDrag';
import { useCardSize, type CardSize } from './cardSize';
import { DraggableCard } from './DraggableCard';
import { useDrawnCards } from './drawnCards';
import { handArcLayout, isCrowded, spreadHandLayout } from './handArc';
import { HandSilhouette } from './HandSilhouette';
import { isCloseToWinning, SeatAvatar } from './Seat';
import { nextSelection } from './selection';
import { TableStacks, tableSpots, upId } from './TableStacks';
import { useTableTheme } from './tableTheme';
import { TurnCountdown } from './TurnCountdown';

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
	 * `card`: one card, a face-down card's index, or several cards of the same value laid
	 * together. `touchable`: whether it may be played at all right now (hand first, then
	 * face-up, then face-down). Returns whether it was played.
	 */
	onLayCard: (card: TCard | number | Cards, cardIndex: number, touchable: boolean) => boolean;
	/** Size of your hand cards (bigger in the wide layout). Default 'md'. */
	handSize?: CardSize;
	/**
	 * The hand covers the lower half of your table stacks (short windows, e.g. a phone turned
	 * sideways), like cards held above the ones lying in front of you. The stacks cannot be
	 * played while the hand has cards, and without a hand nothing covers them.
	 */
	overlapStacks?: boolean;
	/**
	 * Your avatar and name beside your table cards instead of above them (a phone turned
	 * sideways: the height is short, the width plenty). Above the hand when no table cards are left.
	 */
	youBeside?: boolean;
	/** Size of your face-up cards while swapping (default md; sm in landscape with side seats, so they fit between them). */
	swapStackSize?: CardSize;
	/** Shown in the bottom-left corner (the chat button). */
	corner?: ReactNode;
	/** Shown in the bottom-right corner (the lamp switch). */
	cornerRight?: ReactNode;
	/** Set to your avatar and name (the winner's shot glass stops beside them). */
	avatarRef?: Ref<ViewRef | null>;
	/**
	 * Swap phase, until you are ready: tapping a hand card and a face-up card (either first)
	 * swaps them (`onSwap`); your face-up cards are shown full size meanwhile.
	 */
	onSwap?: (hand: TCard, faceUp: TCard) => void;
	/** Turn timer: seconds left of your turn (a countdown by your name); null: not timed. */
	secondsLeft?: number | null;
	/** The room's house rules that change which cards fit (for dimming). */
	cardRules?: CardRules;
	/** The deck is gone: face-up cards may join a hand of one value (`nextSelection`). */
	deckEmpty?: boolean;
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
 * Tap a card to select it, drag it onto the laid pile to play it. Several cards of the same
 * value (from your hand, or from your face-up cards) can be selected: dragging any of them lays
 * them all (`nextSelection`).
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
	youBeside = false,
	swapStackSize = 'md',
	corner,
	cornerRight,
	avatarRef,
	onSwap,
	secondsLeft,
	cardRules,
	deckEmpty = false,
}: PlayerBoardProps) {
	const { labelStyle } = useTableTheme();
	const { hand, tableFlipped, table } = userCards;
	const { width: cardWidth, height: cardHeight } = useCardSize(handSize);
	const { height: stackCardHeight } = useCardSize('sm');
	const { width: avatarCard } = useCardSize('xs');
	const handPlayable = hand.length > 0;
	const faceUpPlayable = hand.length === 0;
	const faceDownPlayable = hand.length === 0 && tableFlipped.length === 0;
	const dim = (card: TCard) => active && !canLayCard(card, laidCards, cardRules);
	// With the deck gone and a hand of only one value, face-up cards of that value may join it.
	const combineValue = deckEmpty && hand.length > 0 && hand.every((own) => own.value === hand[0].value) ? hand[0].value : null;
	const hasTableCards = tableFlipped.length > 0 || table > 0;
	const spots = tableSpots(tableFlipped, table, userCards.spots);

	// The fan is laid out in the width the hand has (measured), minus room at the sides.
	const handPadding = corner || cornerRight ? CORNER_SPACE : HAND_PADDING;
	// Until it is measured, the window width (no empty first frame).
	const { width: windowWidth } = useWindowDimensions();
	// The measured width counts only for the window it was measured in: right after the phone
	// turned, the new window's width (no second rearrangement once the hand is measured again).
	const [measured, setMeasured] = useState({ width: 0, window: 0 });
	const handWidth = measured.window === windowWidth ? measured.width : 0;
	const handRoom = (handWidth || windowWidth) - 2 * handPadding;
	const arc = handArcLayout(hand.length, cardWidth, cardHeight, handRoom, HAND_LIFT);
	// Holding a card of a crowded hand spreads it into two rows (every corner index shows) until let go.
	const [spread, setSpread] = useState(false);
	const canSpread = isCrowded(arc.step, cardWidth, hand.length);
	const places = spread && canSpread ? spreadHandLayout(hand.length, cardWidth, cardHeight, handRoom, HAND_LIFT) : arc.cards;
	const startSpread = () => {
		setSpread(true);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
	};

	// Keyed by the card (plus its occurrence, in case of duplicates), not its position: the cards
	// then animate in / out and glide along the arc, and newly drawn ones fly in (useDrawnCards).
	const handIds = hand.map((card, i) => {
		const occurrence = hand.slice(0, i).filter((c) => c.color === card.color && c.value === card.value).length;
		return `hand-${card.color}-${card.value}-${occurrence}`;
	});
	// Selected cards (ids include the card, so a selection never jumps to a different card when
	// the cards change; ids of cards no longer there are ignored).
	const cardsById = new Map<string, TCard>([
		...hand.map((card, i): [string, TCard] => [handIds[i], card]),
		...spots.flatMap((spot, i): [string, TCard][] => (spot.faceUp ? [[upId(spot.faceUp, i), spot.faceUp]] : [])),
	]);
	const [selection, setSelection] = useState<readonly string[]>([]);
	const selectedIds = selection.filter((id) => cardsById.has(id) || id.startsWith('down-'));
	const toggleSelected = (id: string) => {
		if (!onSwap) return setSelection(nextSelection(selectedIds, id, (other) => cardsById.get(other), combineValue));
		// Swap phase: one hand card and one face-up card make a swap; face-down cards can't be swapped.
		if (id.startsWith('down-')) return;
		const current = selectedIds.find((selected) => cardsById.has(selected));
		const card = cardsById.get(id);
		const other = current ? cardsById.get(current) : undefined;
		if (current && other && card && current.startsWith('hand-') !== id.startsWith('hand-')) {
			const [handCard, faceUp] = id.startsWith('hand-') ? [card, other] : [other, card];
			onSwap(handCard, faceUp);
			setSelection([]);
			return;
		}
		setSelection(current === id ? [] : [id]);
	};
	// Dragging a selected card lays every selected card (all of the same value); any other card alone.
	const play = (card: TCard | number, cardIndex: number, touchable: boolean, id: string) => {
		const group = selectedIds.includes(id) ? selectedIds.flatMap((selected) => cardsById.get(selected) ?? []) : [];
		// Face-up cards selected with the whole hand (deck gone): playable now, whichever card is dragged.
		const withHand = group.length > 1 && combineValue !== null && selectedIds.some((selected) => selected.startsWith('hand-'));
		const played = onLayCard(group.length > 1 ? group : card, cardIndex, touchable || withHand);
		if (played) setSelection([]);
		return played;
	};
	// The cards' callbacks call these, the latest of them: a card that didn't change doesn't render
	// again (DraggableCard is memoized), so the callbacks it holds must not close over old state.
	const live = useRef({ toggleSelected, play, startSpread, playHandCard: (_id: string) => false as boolean });
	useLayoutEffect(() => {
		live.current = {
			toggleSelected,
			play,
			startSpread,
			// By id, at the time of the drop (its index may have changed since the card last rendered).
			playHandCard: (id: string) => {
				const index = handIds.indexOf(id);
				return index >= 0 ? play(hand[index], index, true, id) : false;
			},
		};
	});
	const groupSize = selectedIds.filter((id) => cardsById.has(id)).length;
	// The other selected cards, carried along when card `id` is dragged (it is part of a selection of several).
	const companionsOf = (id: string): Companion[] | undefined =>
		groupSize > 1 && selectedIds.includes(id)
			? selectedIds.flatMap((other) => {
					const card = cardsById.get(other);
					return other !== id && card ? [{ id: other, card }] : [];
				})
			: undefined;

	const hangOff = overlapStacks ? Math.round(cardHeight * HANG_OFF) : 0;
	const { boardRef, enterFrom: drawnFrom } = useDrawnCards(handIds, laidCards?.length ?? 0);

	const handView = handPlayable ? (
		<View
			onLayout={(event) => setMeasured({ width: event.nativeEvent.layout.width, window: windowWidth })}
			// On short windows the hand hangs partly off the bottom edge (its corner indices stay
			// visible), like cards held at the table edge: the piles and seats keep their room.
			style={{ height: arc.height, marginBottom: -hangOff }}
			accessibilityLabel={i18n.t('game.yourHand', { count: hand.length })}
		>
			{hand.map((card, i) => {
				const id = handIds[i];
				const place = places[i];
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
						selected={selectedIds.includes(id)}
						dimmed={dim(card)}
						// Later cards lie on top, so each card's top-left corner index stays visible.
						style={{ position: 'absolute', left: handPadding + place.left, top: place.top, zIndex: i }}
						enterFrom={enterFrom}
						onSelect={() => live.current.toggleSelected(id)}
						onPlay={() => live.current.playHandCard(id)}
						companions={companionsOf(id)}
						onHold={canSpread ? () => live.current.startSpread() : undefined}
						onHoldEnd={() => setSpread(false)}
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
	// While swapping, the face-up cards are full size and never covered (you pick from them).
	const stacksSmall = handPlayable && !onSwap;
	const covered = overlapStacks && stacksSmall;
	const stacks = hasTableCards ? (
		<View className="items-center" style={{ marginBottom: covered ? -Math.round(stackCardHeight * 0.6) : 4 }}>
			<TableStacks
				faceUp={tableFlipped}
				faceDownCount={table}
				spots={spots}
				size={stacksSmall ? 'sm' : swapStackSize}
				faded={stacksSmall}
				play={{
					faceUpPlayable,
					faceDownPlayable,
					dim,
					onLayCard: (card, cardIndex, touchable, id) => live.current.play(card, cardIndex, touchable, id),
					selectedIds,
					onSelect: (id) => live.current.toggleSelected(id),
					companionsOf,
				}}
			/>
		</View>
	) : null;

	// Avatar and name on one line, like at the opponents' seats.
	const you = (
		<View
			accessible
			accessibilityLabel={[i18n.t('game.you', { name: username ?? '' }), ...(active ? [i18n.t('game.seat.onTurn')] : [])].join(', ')}
			className="flex-row items-center justify-center"
		>
			{/* Just the avatar and the name (measured for the winner's shot glass). */}
			<View ref={avatarRef} collapsable={false} className="flex-row items-center gap-1.5">
				<SeatAvatar
					name={username ?? '?'}
					active={active}
					danger={isCloseToWinning(hand.length + tableFlipped.length + table)}
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
				{active && secondsLeft != null ? <TurnCountdown seconds={secondsLeft} mine /> : null}
				{groupSize > 1 ? (
					// Literal colours: the table's palette doesn't follow the app's colours.
					<View style={{ backgroundColor: '#2563eb', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
						<Text accessibilityLiveRegion="polite" style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
							{i18n.t('game.selected', { count: groupSize })}
						</Text>
					</View>
				) : null}
			</View>
		</View>
	);

	// One centred column: you, your table stacks, your hand (drawn last, so it lies on top of
	// covered stacks). The chat button (`corner`) and the lamp switch (`cornerRight`) sit in the
	// bottom corners; the hand keeps room on both sides, so it never covers them and stays centred.
	return (
		<View ref={boardRef} collapsable={false} className="pb-1">
			{/* The same wrapper either way: turning the phone must not rebuild your cards (they faded in again). */}
			<View className={youBeside && stacks ? 'flex-row items-center justify-center gap-4' : ''}>
				{you}
				{stacks}
			</View>
			{handView}
			{corner ? <View className="absolute bottom-2 left-2">{corner}</View> : null}
			{cornerRight ? <View className="absolute bottom-2 right-2">{cornerRight}</View> : null}
		</View>
	);
}

export default PlayerBoard;

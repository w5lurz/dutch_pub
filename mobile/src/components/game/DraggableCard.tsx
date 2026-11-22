import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import i18n from '@/i18n';
import Animated, {
	Easing,
	FadeInDown,
	FadeOut,
	LinearTransition,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { GestureDetector, useCompetingGestures, useLongPressGesture, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import type { TCard } from '@dutch-pub/shared';

import { useCardDrag, type Companion, type ViewRef } from './CardDrag';
import type { CardSize } from './cardSize';
import { cardLabel, PlayingCard } from './PlayingCard';
import { useJustResized } from './resizing';

/** How far a selected card is lifted (along its tilt) by default. */
const SELECTED_LIFT = 8;
/** Card animations: in (dealt / picked up), out (played), and the others closing the gap. */
const ENTERING = FadeInDown.duration(220);
const EXITING = FadeOut.duration(150);
const LAYOUT = LinearTransition.duration(200);
/** How long a drawn card takes to fly from the deck (or the laid pile) into its place. */
const FLY_MS = 420;
/** Holding a card this long (without moving it) is a long press (`onHold`). */
const HOLD_MS = 350;

/** Where a newly drawn card comes from, relative to its place: offset of its centre, size, delay (ms). */
export type EnterFrom = { dx: number; dy: number; scale: number; delay: number };

type DraggableCardProps = {
	/** Unique among your cards right now (selection and drag state). */
	id: string;
	/** The card, or null for a face-down card. */
	card: TCard | null;
	size: CardSize;
	selected?: boolean;
	dimmed?: boolean;
	faded?: boolean;
	/** Tilt in degrees (cards in the hand fan). A selected card lifts along its tilt. */
	rotation?: number;
	/** How far the card lifts when selected. Default 8. */
	lift?: number;
	/** Tap: select / deselect. */
	onSelect: () => void;
	/** Dropped on the laid pile: play it. Returns false if it was not played (it flies back). */
	onPlay: () => boolean;
	accessibilityHint?: string;
	style?: StyleProp<ViewStyle>;
	/** Just drawn: flies in from here (relative to its place) instead of sliding in. */
	enterFrom?: EnterFrom;
	/** The other selected cards, carried along (and laid together) when this one is dragged. */
	companions?: readonly Companion[];
	/** Held down (a long press, not moved): e.g. spread the hand. `onHoldEnd` when the finger lifts. */
	onHold?: () => void;
	onHoldEnd?: () => void;
};

/**
 * One of your cards: tap to select it (lifted, blue outline), drag it onto the laid pile
 * (`CardDropZone`) to play it. The dragged copy lives in `CardDragProvider`'s overlay; the
 * card stays hidden in its place meanwhile. Screen readers get a "Play" action instead.
 * Cards slide in when they arrive, fade out when played, and the rest glide into place
 * (so keep the React `key` tied to the card, not its position).
 */
export function DraggableCard({
	id,
	card,
	size,
	selected = false,
	dimmed = false,
	faded = false,
	rotation = 0,
	lift = SELECTED_LIFT,
	onSelect,
	onPlay,
	accessibilityHint,
	style,
	enterFrom,
	companions,
	onHold,
	onHoldEnd,
}: DraggableCardProps) {
	const ref = useRef<ViewRef>(null);
	const drag = useCardDrag();

	const pan = usePanGesture({
		runOnJS: true,
		// Any direction picks the card up. (No object spread in gesture hook configs: the
		// worklets Babel plugin rejects it.)
		minDistance: 6,
		onActivate: () => {
			if (ref.current) drag.start({ id, card, size, rotation, companions }, ref.current);
		},
		onUpdate: event => drag.move(event.translationX, event.translationY),
		onDeactivate: () => {
			if (drag.release() && onPlay()) drag.finish();
			else drag.returnHome();
		},
		onFinalize: event => {
			if (event.canceled) drag.returnHome();
		},
	});
	const tap = useTapGesture({ runOnJS: true, onActivate: onSelect });
	// Holding still: whichever comes first wins (moving = drag, lifting quickly = tap).
	const hold = useLongPressGesture({
		runOnJS: true,
		enabled: !!onHold,
		minDuration: HOLD_MS,
		// The hold may spread the hand, moving this card away from under the finger: it still
		// lasts until the finger lifts (a long press ends when the finger leaves the view by default).
		shouldCancelWhenOutside: false,
		onActivate: () => onHold?.(),
		onFinalize: () => onHoldEnd?.(),
	});
	const gesture = useCompetingGestures(pan, hold, tap);
	// Right after the phone turned, cards jump to their new places (gliding there felt slow).
	const resized = useJustResized();

	const label = card ? cardLabel(card) : i18n.t('cards.faceDown');
	// Lifted along the card's own axis (straight up for an untilted card), then tilted.
	const angle = (rotation * Math.PI) / 180;
	const lifted = useSharedValue(selected ? 1 : 0);
	useEffect(() => {
		lifted.set(withTiming(selected ? 1 : 0, { duration: 120 }));
	}, [selected, lifted]);
	// A drawn card flies in: 1 = on the deck (untilted, the deck's size), 0 = in its place. Only
	// the flight it mounted with counts (a plain animated value: custom entering animations
	// don't run on web).
	const [flight] = useState(enterFrom);
	const away = useSharedValue(flight ? 1 : 0);
	useEffect(() => {
		if (flight) away.set(withDelay(flight.delay, withTiming(0, { duration: FLY_MS, easing: Easing.out(Easing.cubic) })));
	}, [flight, away]);
	const from = flight ?? { dx: 0, dy: 0, scale: 1 };
	const liftStyle = useAnimatedStyle(() => {
		const a = away.get();
		return {
			transform: [
				{ translateX: Math.sin(angle) * lift * lifted.get() + from.dx * a },
				{ translateY: -Math.cos(angle) * lift * lifted.get() + from.dy * a },
				{ rotate: `${rotation * (1 - a)}deg` },
				{ scale: 1 + (from.scale - 1) * a },
			],
		};
	});

	return (
		// Outer view: position (from `style`) and animations; inner view: gestures, measuring, a11y.
		<Animated.View entering={flight ? undefined : ENTERING} exiting={EXITING} layout={resized ? undefined : LAYOUT} style={[style, liftStyle]}>
			<GestureDetector gesture={gesture}>
				<View
					ref={ref}
					collapsable={false}
					accessible
					accessibilityRole="button"
					accessibilityLabel={label}
					accessibilityHint={accessibilityHint ?? i18n.t('game.cardHint')}
					accessibilityState={{ selected }}
					accessibilityActions={[{ name: 'activate' }, { name: 'play', label: i18n.t('common.play') }]}
					onAccessibilityAction={event => {
						if (event.nativeEvent.actionName === 'play') onPlay();
						else onSelect();
					}}
					style={{ opacity: drag.draggedIds.includes(id) ? 0 : 1 }}
				>
					<PlayingCard card={card} faceDown={!card} size={size} selected={selected} dimmed={dimmed} faded={faded} />
				</View>
			</GestureDetector>
		</Animated.View>
	);
}

export default DraggableCard;

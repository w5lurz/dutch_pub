import { useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import type { TCard } from '@dutch-pub/shared';

import { useCardDrag, type ViewRef } from './CardDrag';
import type { CardSize } from './cardSize';
import { cardLabel, PlayingCard } from './PlayingCard';

/** How far a selected card is lifted (along its tilt) by default. */
const SELECTED_LIFT = 8;
/** Card animations: in (dealt / picked up), out (played), and the others closing the gap. */
const ENTERING = FadeInDown.duration(220);
const EXITING = FadeOut.duration(150);
const LAYOUT = LinearTransition.duration(200);

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
}: DraggableCardProps) {
	const ref = useRef<ViewRef>(null);
	const drag = useCardDrag();

	const pan = usePanGesture({
		runOnJS: true,
		// Any direction picks the card up. (No object spread in gesture hook configs: the
		// worklets Babel plugin rejects it.)
		minDistance: 6,
		onActivate: () => {
			if (ref.current) drag.start({ id, card, size, rotation }, ref.current);
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
	const gesture = useCompetingGestures(pan, tap);

	const label = card ? cardLabel(card) : 'Face-down card';
	// Lifted along the card's own axis (straight up for an untilted card), then tilted.
	const angle = (rotation * Math.PI) / 180;
	const liftStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: withTiming(selected ? Math.sin(angle) * lift : 0, { duration: 120 }) },
			{ translateY: withTiming(selected ? -Math.cos(angle) * lift : 0, { duration: 120 }) },
			{ rotate: `${rotation}deg` },
		],
	}));

	return (
		// Outer view: position (from `style`) and animations; inner view: gestures, measuring, a11y.
		<Animated.View entering={ENTERING} exiting={EXITING} layout={LAYOUT} style={[style, liftStyle]}>
			<GestureDetector gesture={gesture}>
				<View
					ref={ref}
					collapsable={false}
					accessible
					accessibilityRole="button"
					accessibilityLabel={label}
					accessibilityHint={accessibilityHint ?? 'Tap to select, drag onto the laid pile to play'}
					accessibilityState={{ selected }}
					accessibilityActions={[{ name: 'activate' }, { name: 'play', label: 'Play' }]}
					onAccessibilityAction={event => {
						if (event.nativeEvent.actionName === 'play') onPlay();
						else onSelect();
					}}
					style={{ opacity: drag.draggedId === id ? 0 : 1 }}
				>
					<PlayingCard card={card} faceDown={!card} size={size} selected={selected} dimmed={dimmed} faded={faded} />
				</View>
			</GestureDetector>
		</Animated.View>
	);
}

export default DraggableCard;

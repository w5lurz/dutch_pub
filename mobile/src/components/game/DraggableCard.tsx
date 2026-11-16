import { useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import type { TCard } from '@dutch-pub/shared';

import { useCardDrag, type ViewRef } from './CardDrag';
import type { CardSize } from './cardSize';
import { cardLabel, PlayingCard } from './PlayingCard';

/** How far a selected card is lifted. */
const SELECTED_LIFT = 8;

type DraggableCardProps = {
	/** Unique among your cards right now (selection and drag state). */
	id: string;
	/** The card, or null for a face-down card. */
	card: TCard | null;
	size: CardSize;
	selected?: boolean;
	dimmed?: boolean;
	faded?: boolean;
	/** Inside the hand's horizontal ScrollView: only a mostly vertical drag picks the card up. */
	inHorizontalScroll?: boolean;
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
 */
export function DraggableCard({
	id,
	card,
	size,
	selected = false,
	dimmed = false,
	faded = false,
	inHorizontalScroll = false,
	onSelect,
	onPlay,
	accessibilityHint,
	style,
}: DraggableCardProps) {
	const ref = useRef<ViewRef>(null);
	const drag = useCardDrag();

	const pan = usePanGesture({
		runOnJS: true,
		// In the hand, horizontal swipes scroll it; elsewhere any direction picks the card up.
		// (No object spread here: the worklets Babel plugin rejects it in gesture hook configs.)
		activeOffsetY: inHorizontalScroll ? [-10, 10] : undefined,
		failOffsetX: inHorizontalScroll ? [-20, 20] : undefined,
		minDistance: inHorizontalScroll ? undefined : 6,
		onActivate: () => {
			if (ref.current) drag.start({ id, card, size }, ref.current);
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

	return (
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
				style={[
					style,
					{ opacity: drag.draggedId === id ? 0 : 1 },
					selected ? { transform: [{ translateY: -SELECTED_LIFT }] } : null,
				]}
			>
				<PlayingCard card={card} faceDown={!card} size={size} selected={selected} dimmed={dimmed} faded={faded} />
			</View>
		</GestureDetector>
	);
}

export default DraggableCard;

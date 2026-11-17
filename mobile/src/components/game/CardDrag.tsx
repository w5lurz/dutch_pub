import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ComponentRef,
	type ReactNode,
	type RefObject,
} from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { TCard } from '@dutch-pub/shared';

import { cardDimensions, type CardSize } from './cardSize';
import { PlayingCard } from './PlayingCard';
import { useTableTheme } from './tableTheme';

/** A mounted View (refs to host views are element instances, not the `View` component type). */
export type ViewRef = ComponentRef<typeof View>;

export type Rect = { x: number; y: number; width: number; height: number };

/** The card being dragged: `card` null = a face-down card; `rotation` its tilt in place (degrees). */
type DraggedCard = { id: string; card: TCard | null; size: CardSize; rotation?: number };

type CardDragContextValue = {
	/** The drop target (the laid pile). */
	dropZoneRef: RefObject<ViewRef | null>;
	/** The deck (cards you draw fly in from it). */
	deckRef: RefObject<ViewRef | null>;
	/** True while a card is being dragged. */
	dragging: SharedValue<boolean>;
	/** True while the dragged card is over the drop target. */
	hovering: SharedValue<boolean>;
	/** Id of the card being dragged (hidden in its place meanwhile), or null. */
	draggedId: string | null;
	/** Starts dragging the card whose view is `source`. */
	start: (dragged: DraggedCard, source: ViewRef) => void;
	/** Moves the dragged card by the gesture's total translation. */
	move: (translationX: number, translationY: number) => void;
	/** Ends the drag: whether the card was released over the drop target. */
	release: () => boolean;
	/** Removes the dragged card at once (it was played). */
	finish: () => void;
	/** Animates the dragged card back to its place, then removes it. */
	returnHome: () => void;
};

const CardDragContext = createContext<CardDragContextValue | null>(null);

export function useCardDrag(): CardDragContextValue {
	const value = useContext(CardDragContext);
	if (!value) throw new Error('useCardDrag must be used inside <CardDragProvider>');
	return value;
}

/** A view's rect in the window, or null if it is not mounted. */
export function measure(view: ViewRef | null): Promise<Rect | null> {
	return new Promise(resolve => {
		if (!view) return resolve(null);
		view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
	});
}

const RETURN_MS = 160;
/** How long a tilted card takes to straighten once picked up. */
const STRAIGHTEN_MS = 150;

/**
 * The card's untilted rect in the window. A tilted view measures differently per platform
 * (bounding box on web, the frame elsewhere), but every platform agrees on its centre, so
 * the rect is rebuilt around the centre with the card's real size.
 */
function cardRect(measured: Rect, size: CardSize): Rect {
	const { width, height } = cardDimensions(Dimensions.get('window'), size);
	const cx = measured.x + measured.width / 2;
	const cy = measured.y + measured.height / 2;
	return { x: cx - width / 2, y: cy - height / 2, width, height };
}

/**
 * Drag & drop of your cards onto the laid pile. The dragged card is drawn in an overlay
 * above the whole game screen (so it is not clipped by the hand's ScrollView) while the
 * original stays hidden in its place. The drop target is the view behind `dropZoneRef`
 * (`<CardDropZone>`); a card counts as over it when the card's centre is within the target
 * grown by half a card on each side. All rects are window coordinates (`measureInWindow`).
 */
export function CardDragProvider({ children }: { children: ReactNode }) {
	const dropZoneRef = useRef<ViewRef | null>(null);
	const deckRef = useRef<ViewRef | null>(null);
	const hostRef = useRef<ViewRef | null>(null);
	const [dragged, setDragged] = useState<DraggedCard | null>(null);
	const dragging = useSharedValue(false);
	const hovering = useSharedValue(false);
	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const rotation = useSharedValue(0);
	// Window rects captured when the drag starts (measuring is async: moves before it are ignored).
	const geometry = useRef<{ origin: Rect; host: Rect; zone: Rect | null; rotation: number } | null>(null);
	const translation = useRef({ x: 0, y: 0 });
	const returnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	// Bumped by every clear: a drag start whose measuring finishes after that is dropped.
	const generation = useRef(0);

	const clear = useCallback(() => {
		clearTimeout(returnTimer.current);
		generation.current += 1;
		geometry.current = null;
		dragging.set(false);
		hovering.set(false);
		setDragged(null);
	}, [dragging, hovering]);

	const update = useCallback(() => {
		const g = geometry.current;
		if (!g) return;
		const left = g.origin.x + translation.current.x;
		const top = g.origin.y + translation.current.y;
		x.set(left - g.host.x);
		y.set(top - g.host.y);
		const cx = left + g.origin.width / 2;
		const cy = top + g.origin.height / 2;
		const z = g.zone;
		hovering.set(
			!!z &&
				cx >= z.x - g.origin.width / 2 &&
				cx <= z.x + z.width + g.origin.width / 2 &&
				cy >= z.y - g.origin.height / 2 &&
				cy <= z.y + z.height + g.origin.height / 2,
		);
	}, [x, y, hovering]);

	const start = useCallback(
		(card: DraggedCard, source: ViewRef) => {
			clearTimeout(returnTimer.current);
			translation.current = { x: 0, y: 0 };
			geometry.current = null;
			const current = generation.current;
			Promise.all([measure(source), measure(hostRef.current), measure(dropZoneRef.current)]).then(
				([measured, host, zone]) => {
					if (!measured || !host || generation.current !== current) return;
					const tilt = card.rotation ?? 0;
					geometry.current = { origin: cardRect(measured, card.size), host, zone, rotation: tilt };
					// Picked up: straightens from its tilt in the hand.
					rotation.set(tilt);
					rotation.set(withTiming(0, { duration: STRAIGHTEN_MS }));
					dragging.set(true);
					update();
					setDragged(card);
					Haptics.selectionAsync().catch(() => {});
				},
			);
		},
		[dragging, rotation, update],
	);

	const move = useCallback(
		(translationX: number, translationY: number) => {
			translation.current = { x: translationX, y: translationY };
			update();
		},
		[update],
	);

	const release = useCallback(() => !!geometry.current && hovering.get(), [hovering]);

	const returnHome = useCallback(() => {
		const g = geometry.current;
		if (!g) return clear();
		hovering.set(false);
		x.set(withTiming(g.origin.x - g.host.x, { duration: RETURN_MS }));
		y.set(withTiming(g.origin.y - g.host.y, { duration: RETURN_MS }));
		rotation.set(withTiming(g.rotation, { duration: RETURN_MS }));
		clearTimeout(returnTimer.current);
		returnTimer.current = setTimeout(clear, RETURN_MS);
	}, [clear, hovering, rotation, x, y]);

	// The window changed size (phone turned, browser resized): the layout moves, so the
	// measured rects are stale. Drop a drag in progress; the gesture then ends as a no-op.
	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', clear);
		return () => subscription.remove();
	}, [clear]);

	const overlayStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: x.get() },
			{ translateY: y.get() },
			{ rotate: `${rotation.get()}deg` },
			{ scale: hovering.get() ? 1.1 : 1.05 },
		],
	}));

	const value = useMemo<CardDragContextValue>(
		() => ({
			dropZoneRef,
			deckRef,
			dragging,
			hovering,
			draggedId: dragged?.id ?? null,
			start,
			move,
			release,
			finish: clear,
			returnHome,
		}),
		[dragging, hovering, dragged, start, move, release, clear, returnHome],
	);

	return (
		<CardDragContext.Provider value={value}>
			{children}
			<View ref={hostRef} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill}>
				{dragged ? (
					<Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, overlayStyle]}>
						<PlayingCard card={dragged.card} faceDown={!dragged.card} size={dragged.size} selected />
					</Animated.View>
				) : null}
			</View>
		</CardDragContext.Provider>
	);
}

/** Wraps the drop target (the laid pile): outlined while dragging, green while a card is over it. */
export function CardDropZone({ children }: { children: ReactNode }) {
	const { dropZoneRef, dragging, hovering } = useCardDrag();
	// Strong enough to see on the white table by day (blue-600, green-600); lighter on the dark night table.
	const night = useTableTheme().mode === 'night';
	const dragColor = night ? '#93c5fd' : '#2563eb';
	const hoverColor = night ? '#4ade80' : '#16a34a';
	const style = useAnimatedStyle(() => ({
		borderColor: hovering.get() ? hoverColor : dragging.get() ? dragColor : 'transparent',
		backgroundColor: hovering.get() ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
	}));
	return (
		<Animated.View ref={dropZoneRef} collapsable={false} style={[{ borderWidth: 2, borderRadius: 10, padding: 3 }, style]}>
			{children}
		</Animated.View>
	);
}

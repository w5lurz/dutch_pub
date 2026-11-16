import { View } from 'react-native';
import type { Cards, TCard } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize, type CardSize } from './cardSize';
import { DraggableCard } from './DraggableCard';
import { PlayingCard } from './PlayingCard';

/** One table spot: the face-up card on top (if any), whether a face-down card lies below. */
export type TableSpot = { faceUp: TCard | null; faceDown: boolean };

/**
 * The table cards as spots, as dealt in real life (3 face-down, 3 face-up on top of them).
 * The server only sends the face-up cards and the *number* of face-down cards, not which
 * face-down card lies under which face-up one, so: spots = max(face-up, face-down), the
 * face-up cards on the first spots. (PLAN.md, risk 9: keep the dealt pairs on the server.)
 */
export function tableSpots(faceUp: Cards, faceDownCount: number): TableSpot[] {
	const spots: TableSpot[] = [];
	for (let i = 0; i < Math.max(faceUp.length, faceDownCount); i++) {
		spots.push({ faceUp: faceUp[i] ?? null, faceDown: i < faceDownCount });
	}
	return spots;
}

/** Selection / drag id of a face-up table card. */
const upId = (card: TCard, i: number) => `up-${i}-${card.color}-${card.value}`;

/** How far the face-down card peeks out from under the face-up one (right and down). */
export function stackOffset(cardWidth: number): number {
	return Math.max(3, Math.round(cardWidth * 0.125));
}

/** Width of `count` stacks of `size` in a row. */
export function useTableStacksWidth(size: CardSize, count = 3): number {
	const { width } = useCardSize(size);
	return count * (width + stackOffset(width)) + Math.max(0, count - 1) * CARD_GAP;
}

type TableStacksProps = {
	faceUp: Cards;
	faceDownCount: number;
	size: CardSize;
	/** Lightly fade all cards (your table while you still hold cards). */
	faded?: boolean;
	/** Your own table: the top cards can be selected (tap) and played (drag onto the laid pile). Opponents' stacks are not interactive. */
	play?: {
		faceUpPlayable: boolean;
		faceDownPlayable: boolean;
		/** Whether a face-up card is dimmed (cannot be laid on the pile right now). */
		dim: (card: TCard) => boolean;
		/** `touchable`: whether this card may be played at all right now. Returns whether it was played. */
		onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean) => boolean;
		selectedId: string | null;
		onSelect: (id: string) => void;
	};
};

/**
 * A row of table stacks: each spot shows its face-down card peeking out below and to the
 * right of the face-up card on top. A spot without a face-up card shows only its
 * face-down card (in the same place, so nothing jumps).
 */
export function TableStacks({ faceUp, faceDownCount, size, faded = false, play }: TableStacksProps) {
	const { width, height } = useCardSize(size);
	const offset = stackOffset(width);
	const spots = tableSpots(faceUp, faceDownCount);
	if (spots.length === 0) return null;

	return (
		<View className="flex-row" style={{ gap: CARD_GAP }}>
			{spots.map((spot, i) => (
				<View key={i} style={{ width: width + offset, height: height + offset }}>
					{spot.faceDown ? (
						play && !spot.faceUp ? (
							// Only playable once nothing lies on top of it.
							<DraggableCard
								id={`down-${i}`}
								card={null}
								size={size}
								faded={faded}
								style={{ position: 'absolute', left: offset, top: offset }}
								selected={play.selectedId === `down-${i}`}
								accessibilityHint={play.faceDownPlayable ? undefined : 'Play your other cards first'}
								onSelect={() => play.onSelect(`down-${i}`)}
								onPlay={() => play.onLayCard(i, i, play.faceDownPlayable)}
							/>
						) : (
							<PlayingCard faceDown size={size} faded={faded} style={{ position: 'absolute', left: offset, top: offset }} />
						)
					) : null}
					{spot.faceUp ? (
						play ? (
							<DraggableCard
								id={upId(spot.faceUp, i)}
								card={spot.faceUp}
								size={size}
								faded={faded}
								style={{ position: 'absolute', left: 0, top: 0 }}
								selected={play.selectedId === upId(spot.faceUp, i)}
								dimmed={play.faceUpPlayable && play.dim(spot.faceUp)}
								accessibilityHint={play.faceUpPlayable ? undefined : 'Play your hand first'}
								onSelect={() => play.onSelect(upId(spot.faceUp as TCard, i))}
								onPlay={() => play.onLayCard(spot.faceUp as TCard, i, play.faceUpPlayable)}
							/>
						) : (
							<PlayingCard card={spot.faceUp} size={size} faded={faded} style={{ position: 'absolute', left: 0, top: 0 }} />
						)
					) : null}
				</View>
			))}
		</View>
	);
}

export default TableStacks;

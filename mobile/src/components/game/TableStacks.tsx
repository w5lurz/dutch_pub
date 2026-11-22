import { View } from 'react-native';
import i18n from '@/i18n';
import type { Cards, TCard, TableSpot } from '@dutch-pub/shared';

import { CARD_GAP, useCardSize, type CardSize } from './cardSize';
import type { Companion } from './CardDrag';
import { DraggableCard } from './DraggableCard';
import { cardJitter } from './jitter';
import { PlayingCard } from './PlayingCard';

export type { TableSpot };

/**
 * The table cards as spots, as dealt in real life (3 face-down, 3 face-up on top of them):
 * the server's `spots` when it sends them (each card stays on its spot until played). Older
 * servers send only the face-up cards and the *number* of face-down cards: then spots =
 * max(face-up, face-down), the face-up cards on the first spots.
 */
export function tableSpots(faceUp: Cards, faceDownCount: number, dealt?: readonly TableSpot[]): TableSpot[] {
	if (dealt) return [...dealt];
	const spots: TableSpot[] = [];
	for (let i = 0; i < Math.max(faceUp.length, faceDownCount); i++) {
		spots.push({ faceUp: faceUp[i] ?? null, faceDown: i < faceDownCount });
	}
	return spots;
}

/** Small fixed tilts: a face-down card by its spot, a face-up card by itself and its spot. */
const downTilt = (spot: number) => cardJitter(`down-${spot}`, 2.5).rotation;
const upTilt = (card: TCard, spot: number) => cardJitter(`up-${spot}-${card.color}-${card.value}`, 4).rotation;

/** Selection / drag id of a face-up table card. */
export const upId = (card: TCard, i: number) => `up-${i}-${card.color}-${card.value}`;

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
	/** Where the cards lie, from the server (`tableSpots`); older servers: missing. */
	spots?: readonly TableSpot[];
	size: CardSize;
	/** Lightly fade all cards (your table while you still hold cards). */
	faded?: boolean;
	/** Your own table: the top cards can be selected (tap) and played (drag onto the laid pile). Opponents' stacks are not interactive. */
	play?: {
		faceUpPlayable: boolean;
		faceDownPlayable: boolean;
		/** Whether a face-up card is dimmed (cannot be laid on the pile right now). */
		dim: (card: TCard) => boolean;
		/**
		 * `touchable`: whether this card may be played at all right now; `id` its selection id (several
		 * selected cards are laid together). Returns whether it was played.
		 */
		onLayCard: (card: TCard | number, cardIndex: number, touchable: boolean, id: string) => boolean;
		selectedIds: readonly string[];
		/** The other selected cards, carried along when card `id` is dragged. */
		companionsOf?: (id: string) => readonly Companion[] | undefined;
		onSelect: (id: string) => void;
	};
};

/**
 * A row of table stacks: each spot shows its face-down card peeking out below and to the
 * right of the face-up card on top, both lying a little crooked like dealt cards (fixed per
 * spot / card, see `cardJitter`). A spot without a face-up card shows only its face-down
 * card (in the same place, so nothing jumps).
 */
export function TableStacks({ faceUp, faceDownCount, spots: dealt, size, faded = false, play }: TableStacksProps) {
	const { width, height } = useCardSize(size);
	const offset = stackOffset(width);
	const spots = tableSpots(faceUp, faceDownCount, dealt);
	// A face-down card is played by its place among the face-down cards still there (as the server expects).
	const downOrdinal = (spot: number) => spots.slice(0, spot).filter((other) => other.faceDown).length;
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
								rotation={downTilt(i)}
								selected={play.selectedIds.includes(`down-${i}`)}
								accessibilityHint={play.faceDownPlayable ? undefined : i18n.t('game.playOtherCardsFirst')}
								onSelect={() => play.onSelect(`down-${i}`)}
								onPlay={() => play.onLayCard(downOrdinal(i), i, play.faceDownPlayable, `down-${i}`)}
							/>
						) : (
							<PlayingCard
								faceDown
								size={size}
								faded={faded}
								style={{ position: 'absolute', left: offset, top: offset, transform: [{ rotate: `${downTilt(i)}deg` }] }}
							/>
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
								rotation={upTilt(spot.faceUp, i)}
								selected={play.selectedIds.includes(upId(spot.faceUp, i))}
								dimmed={play.faceUpPlayable && play.dim(spot.faceUp)}
								accessibilityHint={play.faceUpPlayable ? undefined : i18n.t('game.playHandFirst')}
								onSelect={() => play.onSelect(upId(spot.faceUp as TCard, i))}
								onPlay={() => play.onLayCard(spot.faceUp as TCard, i, play.faceUpPlayable, upId(spot.faceUp as TCard, i))}
								companions={play.companionsOf?.(upId(spot.faceUp, i))}
							/>
						) : (
							<PlayingCard
								card={spot.faceUp}
								size={size}
								faded={faded}
								style={{ position: 'absolute', left: 0, top: 0, transform: [{ rotate: `${upTilt(spot.faceUp, i)}deg` }] }}
							/>
						)
					) : null}
				</View>
			))}
		</View>
	);
}

export default TableStacks;

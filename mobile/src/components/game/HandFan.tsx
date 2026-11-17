import { Text, View } from 'react-native';

import { useCardSize, type CardSize } from './cardSize';
import { PlayingCard } from './PlayingCard';
import { Rotated } from './Rotated';

/** Share of a card back that the next one leaves visible in a normal fan. */
const STEP = 0.4;
/** A compressed fan still draws at most this many backs (the "×N" says the real count). */
const MAX_DRAWN = 20;

/** Default number of backs that fit before the fan compresses (top seats). */
export const FAN_FIT = 10;

/**
 * Layout of a fan of `count` backs `cardWidth` wide that fits `fit` backs: how many backs
 * are drawn, the distance between them, its total width, and whether it is compressed
 * (more cards than fit: drawn squeezed into the width of `fit` backs, plus "×N").
 */
export function handFanLayout(count: number, cardWidth: number, fit = FAN_FIT) {
	const step = Math.max(2, Math.round(cardWidth * STEP));
	const compressed = count > fit;
	if (count <= 0) return { drawn: 0, step, width: 0, compressed: false };
	if (!compressed) return { drawn: count, step, width: cardWidth + (count - 1) * step, compressed };
	const width = cardWidth + (fit - 1) * step;
	const drawn = Math.min(count, MAX_DRAWN);
	return { drawn, step: (width - cardWidth) / (drawn - 1), width, compressed };
}

type HandFanProps = {
	count: number;
	size?: CardSize;
	/** Backs that fit before the fan compresses to a fixed width and shows "×N". */
	fit?: number;
	/** Turns the backs (a side seat's hand faces the centre); the count stays upright. */
	rotate?: 0 | 90 | -90;
};

/**
 * An opponent's hand: a fan of overlapping card backs, one per card and without a number,
 * like at a real table. With more cards than fit (`fit`), the fan is squeezed to a fixed
 * width and "×N" says the count.
 */
export function HandFan({ count, size = 'xxs', fit = FAN_FIT, rotate = 0 }: HandFanProps) {
	const { width: cardWidth, height: cardHeight } = useCardSize(size);
	const fan = handFanLayout(count, cardWidth, fit);
	const label = `${count} ${count === 1 ? 'card' : 'cards'} in hand`;

	if (fan.drawn === 0) {
		return (
			<Text accessibilityLabel={label} className="text-xs text-gray-500">
				No cards
			</Text>
		);
	}

	return (
		<View
			accessible
			accessibilityLabel={label}
			className={`items-center gap-1 ${rotate === 0 ? 'flex-row' : ''}`}
		>
			<Rotated degrees={rotate} width={fan.width} height={cardHeight}>
				<View style={{ width: fan.width, height: cardHeight }}>
					{Array.from({ length: fan.drawn }, (_, i) => (
						<PlayingCard
							key={i}
							faceDown
							size={size}
							style={{ position: 'absolute', top: 0, left: Math.round(i * fan.step) }}
						/>
					))}
				</View>
			</Rotated>
			{fan.compressed ? <Text className="text-xs font-semibold text-gray-700">×{count}</Text> : null}
		</View>
	);
}

export default HandFan;

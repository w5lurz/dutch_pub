import { Text, View } from 'react-native';

import { useCardSize, type CardSize } from './cardSize';
import { PlayingCard } from './PlayingCard';

/** At most this many card backs are drawn; the count says the rest. */
const MAX_BACKS = 5;
/** Share of each back hidden under the next one. */
const OVERLAP = 0.65;

/** An opponent's hand: a small fan of overlapping card backs plus "×N". */
export function HandFan({ count, size = 'xs' }: { count: number; size?: CardSize }) {
	const { width } = useCardSize(size);
	const shown = Math.min(count, MAX_BACKS);
	const label = `${count} ${count === 1 ? 'card' : 'cards'} in hand`;

	return (
		<View accessible accessibilityLabel={label} className="flex-row items-center gap-1.5">
			{shown === 0 ? (
				<Text className="text-xs text-gray-400">No cards in hand</Text>
			) : (
				<>
					<View className="flex-row">
						{Array.from({ length: shown }, (_, i) => (
							<PlayingCard
								key={i}
								faceDown
								size={size}
								style={i > 0 ? { marginLeft: -Math.round(width * OVERLAP) } : undefined}
							/>
						))}
					</View>
					<Text className="text-sm font-semibold text-gray-700">×{count}</Text>
				</>
			)}
		</View>
	);
}

export default HandFan;

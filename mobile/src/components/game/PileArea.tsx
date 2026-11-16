import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Cards } from '@dutch-pub/shared';

import { EmptyCardSlot, PlayingCard } from './PlayingCard';

type PileAreaProps = {
    deck: number;
    laidCards: Cards | null;
    burntCards: Cards | null;
    /** Whose turn it is: `null` for you, the opponent's name, or `undefined` if unknown. */
    turnOf: string | null | undefined;
};

function Pile({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View className="items-center gap-0.5">
            <Text className="text-xs font-bold text-gray-800">{title}</Text>
            {children}
        </View>
    );
}

/** Centre of the table: deck, laid cards (top card first) and burnt cards, plus whose turn it is. */
export function PileArea({ deck, laidCards, burntCards, turnOf }: PileAreaProps) {
    const laidTop = laidCards?.[0];
    const burntTop = burntCards?.[0];
    const turnText = turnOf === null ? 'Your turn' : turnOf ? `${turnOf}'s turn` : 'Waiting…';

    return (
        <View className="items-center gap-1.5">
            <Text
                accessibilityLiveRegion="polite"
                className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
                    turnOf === null ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-800'
                }`}
            >
                {turnText}
            </Text>
            <View className="flex-row items-start justify-center gap-4">
                <Pile title={`Deck (${deck})`}>
                    {deck > 0 ? (
                        <PlayingCard faceDown size="lg" accessibilityLabel={`Deck, ${deck} cards`} />
                    ) : (
                        <EmptyCardSlot size="lg" label="Deck, empty" />
                    )}
                </Pile>
                <Pile title={`Laid (${laidCards?.length ?? 0})`}>
                    {laidTop ? (
                        <PlayingCard card={laidTop} size="lg" selected />
                    ) : (
                        <EmptyCardSlot size="lg" label="Laid cards, empty" />
                    )}
                </Pile>
                <Pile title={`Burnt (${burntCards?.length ?? 0})`}>
                    {burntTop ? (
                        <PlayingCard card={burntTop} size="lg" dimmed />
                    ) : (
                        <EmptyCardSlot size="lg" label="Burnt cards, empty" />
                    )}
                </Pile>
            </View>
        </View>
    );
}

export default PileArea;

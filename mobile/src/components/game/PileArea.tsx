import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Cards } from '@dutch-pub/shared';

import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { CardDropZone } from './CardDrag';
import type { CardSize } from './cardSize';
import { EmptyCardSlot, PlayingCard } from './PlayingCard';

type PileAreaProps = {
    deck: number;
    laidCards: Cards | null;
    burntCards: Cards | null;
    /** Whose turn it is: `null` for you, the opponent's name, or `undefined` if unknown. */
    turnOf: string | null | undefined;
    /** Pile card size: 'lg', or smaller when seats sit beside the piles on a narrow screen. */
    size?: CardSize;
    /** Less space between the piles (narrow screens). */
    tight?: boolean;
};

/** The drop zone's border + padding, added around the other piles too so all three line up. */
const ZONE_INSET = 5;

function Pile({ title, children, inset = false }: { title: string; children: ReactNode; inset?: boolean }) {
    return (
        <View className="items-center gap-0.5">
            <Text className="text-xs font-bold text-gray-800">{title}</Text>
            {inset ? <View style={{ padding: ZONE_INSET }}>{children}</View> : children}
        </View>
    );
}

/**
 * Centre of the table: deck, laid cards (top card first) and burnt cards in a row, with whose
 * turn it is above them.
 * The laid pile is where you drop a card to play it (`CardDropZone`).
 */
export function PileArea({ deck, laidCards, burntCards, turnOf, size = 'lg', tight = false }: PileAreaProps) {
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
            <View className={`flex-row items-start justify-center ${tight ? 'gap-1' : 'gap-4'}`}>
                <Pile title={`Deck (${deck})`} inset>
                    {deck > 0 ? (
                        <PlayingCard faceDown size={size} accessibilityLabel={`Deck, ${deck} cards`} />
                    ) : (
                        <EmptyCardSlot size={size} label="Deck, empty" />
                    )}
                </Pile>
                <Pile title={`Laid (${laidCards?.length ?? 0})`}>
                    <CardDropZone>
                        {laidTop ? (
                            // Keyed by the pile size: every newly laid card lands with a short zoom.
                            <Animated.View key={`laid-${laidCards?.length ?? 0}`} entering={ZoomIn.duration(200)}>
                                <PlayingCard card={laidTop} size={size} selected />
                            </Animated.View>
                        ) : (
                            <EmptyCardSlot size={size} label="Laid cards, empty" />
                        )}
                    </CardDropZone>
                </Pile>
                <Pile title={`Burnt (${burntCards?.length ?? 0})`} inset>
                    {burntTop ? (
                        // Fades in whenever the laid pile is burnt.
                        <Animated.View key={`burnt-${burntCards?.length ?? 0}`} entering={FadeIn.duration(400)}>
                            <PlayingCard card={burntTop} size={size} dimmed />
                        </Animated.View>
                    ) : (
                        <EmptyCardSlot size={size} label="Burnt cards, empty" />
                    )}
                </Pile>
            </View>
        </View>
    );
}

export default PileArea;

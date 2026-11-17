import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { Cards, TCard } from '@dutch-pub/shared';

import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { CardDropZone } from './CardDrag';
import { useCardSize, type CardSize } from './cardSize';
import { cardJitter } from './jitter';
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
/** Cards shown under the laid pile's top card (peeking out, as on a real messy pile). */
const LAID_BELOW = 3;
/** Most cards drawn for the deck's thickness, and cards per drawn edge. */
const DECK_EDGES = 4;
const CARDS_PER_EDGE = 8;
/** Most backs drawn for the burnt heap, and burnt cards per drawn back. */
const BURNT_BACKS = 5;
const CARDS_PER_BACK = 4;

function Pile({ title, children, inset = false }: { title: string; children: ReactNode; inset?: boolean }) {
    return (
        <View className="items-center gap-0.5">
            <Text className="text-xs font-bold text-gray-800">{title}</Text>
            {inset ? <View style={{ padding: ZONE_INSET }}>{children}</View> : children}
        </View>
    );
}

/** A card's key on a pile: the card plus its place counted from the bottom (stable while the pile grows). */
const pileKey = (card: TCard, fromBottom: number) => `${card.color}-${card.value}-${fromBottom}`;

/**
 * The laid pile: the top card and the few below it, each lying a little crooked (fixed per
 * card, see `cardJitter`), so it looks like a real pile. The newest card lands with a zoom.
 */
function LaidPile({ cards, size }: { cards: Cards; size: CardSize }) {
    const { width, height } = useCardSize(size);
    const shown = cards.slice(0, LAID_BELOW + 1);
    return (
        <View style={{ width, height }}>
            {shown
                .map((card, i) => {
                    const fromBottom = cards.length - i;
                    const { rotation, dx, dy } = cardJitter(pileKey(card, fromBottom), 7, Math.round(width * 0.06));
                    const style = { position: 'absolute' as const, left: dx, top: dy, transform: [{ rotate: `${rotation}deg` }] };
                    return i === 0 ? (
                        // Keyed by the pile size: every newly laid card lands with a short zoom. (The
                        // zoom animates its own transform, so the tilt sits on the card inside.)
                        <Animated.View
                            key={`laid-${cards.length}`}
                            entering={ZoomIn.duration(200)}
                            style={{ position: 'absolute', left: dx, top: dy }}
                        >
                            <PlayingCard card={card} size={size} style={{ transform: [{ rotate: `${rotation}deg` }] }} />
                        </Animated.View>
                    ) : (
                        <PlayingCard key={pileKey(card, fromBottom)} card={card} size={size} style={style} decorative />
                    );
                })
                // Drawn bottom first, so the top card ends up on top.
                .reverse()}
        </View>
    );
}

/** The deck: a neat stack of backs whose visible edge gets thinner as it runs out. */
function Deck({ count, size }: { count: number; size: CardSize }) {
    const { width, height } = useCardSize(size);
    const edges = Math.min(DECK_EDGES, Math.ceil(count / CARDS_PER_EDGE));
    return (
        <View accessible accessibilityLabel={`Deck, ${count} cards`} style={{ width, height }}>
            {Array.from({ length: edges }, (_, i) => {
                // Lower cards sit a little lower-right, so the stack shows its thickness.
                const depth = edges - 1 - i;
                return (
                    <PlayingCard
                        key={i}
                        faceDown
                        size={size}
                        decorative
                        style={{ position: 'absolute', left: depth * 1.5, top: depth * 1.5 }}
                    />
                );
            })}
        </View>
    );
}

/** The burnt pile: a messy heap of backs only (like in real life, nobody sees what was burnt). */
function BurntHeap({ count, size }: { count: number; size: CardSize }) {
    const { width, height } = useCardSize(size);
    const backs = Math.min(BURNT_BACKS, Math.ceil(count / CARDS_PER_BACK));
    return (
        <View accessible accessibilityLabel={`Burnt cards, ${count}`} style={{ width, height }}>
            {Array.from({ length: backs }, (_, i) => {
                const { rotation, dx, dy } = cardJitter(`burnt-${i}`, 18, Math.round(width * 0.08));
                return (
                    <PlayingCard
                        key={i}
                        faceDown
                        size={size}
                        decorative
                        style={{ position: 'absolute', left: dx, top: dy, transform: [{ rotate: `${rotation}deg` }] }}
                    />
                );
            })}
        </View>
    );
}

/**
 * Centre of the table: deck, laid cards (top card first) and burnt cards in a row, with whose
 * turn it is above them. They look like real piles: a deck with thickness, a messy laid pile,
 * a heap of burnt backs.
 * The laid pile is where you drop a card to play it (`CardDropZone`).
 */
export function PileArea({ deck, laidCards, burntCards, turnOf, size = 'lg', tight = false }: PileAreaProps) {
    const burnt = burntCards?.length ?? 0;
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
                    {deck > 0 ? <Deck count={deck} size={size} /> : <EmptyCardSlot size={size} label="Deck, empty" />}
                </Pile>
                <Pile title={`Laid (${laidCards?.length ?? 0})`}>
                    <CardDropZone>
                        {laidCards?.length ? (
                            <LaidPile cards={laidCards} size={size} />
                        ) : (
                            <EmptyCardSlot size={size} label="Laid cards, empty" />
                        )}
                    </CardDropZone>
                </Pile>
                <Pile title={`Burnt (${burnt})`} inset>
                    {burnt > 0 ? (
                        // Fades in whenever the laid pile is burnt.
                        <Animated.View key={`burnt-${burnt}`} entering={FadeIn.duration(400)}>
                            <BurntHeap count={burnt} size={size} />
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

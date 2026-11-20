import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BlindMiss, Cards, TCard } from '@dutch-pub/shared';

import Animated, {
    Easing,
    FadeIn,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';

import { CardDropZone, measure, useCardDrag, type Rect, type ViewRef } from './CardDrag';
import { useCardSize, type CardSize } from './cardSize';
import { cardJitter } from './jitter';
import { EmptyCardSlot, PlayingCard } from './PlayingCard';
import { useTableTheme } from './tableTheme';

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
    /** The piles one above the other (portrait with seats beside them) instead of in a row. */
    column?: boolean;
    /** A face-down card played blind that doesn't fit: it lies on top of the pile for a moment, with a message. */
    blindMiss?: BlindMiss | null;
    /** Your username (the message then says "Your"). */
    username?: string;
    /** The last Ace's call (who must lay a magic card now). */
    call?: { by: string; target: string } | null;
    /** The turn order is reversed (a 6, with the "6 reverses" house rule). */
    reversed?: boolean;
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
    const { labelStyle } = useTableTheme();
    return (
        <View className="items-center gap-0.5">
            <Text className="text-xs font-bold text-gray-800" style={labelStyle}>
                {title}
            </Text>
            {inset ? <View style={{ padding: ZONE_INSET }}>{children}</View> : children}
        </View>
    );
}

/** How long the burnt card takes to sweep from the laid pile onto the burnt heap. */
const BURN_MS = 450;

/**
 * The burn: the card that burnt the pile sweeps from the laid pile onto the burnt heap,
 * spinning, arcing a little and turning face-down on the way (`dx` / `dy`: the heap's centre
 * relative to the pile's).
 */
function BurnSweep({ card, size, dx, dy, onDone }: { card: TCard; size: CardSize; dx: number; dy: number; onDone: () => void }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.set(withTiming(1, { duration: BURN_MS, easing: Easing.inOut(Easing.cubic) }));
        const timer = setTimeout(onDone, BURN_MS + 50);
        return () => clearTimeout(timer);
    }, [progress, onDone]);
    const moving = useAnimatedStyle(() => {
        const p = progress.get();
        return {
            transform: [
                { translateX: dx * p },
                { translateY: dy * p - Math.sin(p * Math.PI) * 18 },
                { rotate: `${interpolate(p, [0, 1], [0, 160])}deg` },
                { scale: interpolate(p, [0, 0.5, 1], [1, 1.08, 0.94]) },
            ],
        };
    });
    const face = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0.3, 0.55], [1, 0], 'clamp') }));
    return (
        <Animated.View pointerEvents="none" style={moving}>
            <PlayingCard faceDown size={size} decorative />
            <Animated.View style={[StyleSheet.absoluteFill, face]}>
                <PlayingCard card={card} size={size} decorative />
            </Animated.View>
        </Animated.View>
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
 * Centre of the table: deck, laid cards (top card first) and burnt cards in a row (or a column), with whose
 * turn it is above them. They look like real piles: a deck with thickness, a messy laid pile,
 * a heap of burnt backs.
 * The laid pile is where you drop a card to play it (`CardDropZone`).
 */
export function PileArea({ deck, laidCards, burntCards, turnOf, size = 'lg', tight = false, column = false, blindMiss, username, call, reversed = false }: PileAreaProps) {
    const burnt = burntCards?.length ?? 0;
    const { deckRef, dropZoneRef } = useCardDrag();
    const still = useReducedMotion();
    const { width: cardWidth, height: cardHeight } = useCardSize(size);

    // The burn sweep: when the burnt pile grows, its newest card (burntCards[0]) sweeps over
    // from the laid pile. The piles are measured after each change, ready for the next burn.
    const areaRef = useRef<ViewRef | null>(null);
    const burntRef = useRef<ViewRef | null>(null);
    const rects = useRef<{ area: Rect | null; laid: Rect | null; heap: Rect | null }>({ area: null, laid: null, heap: null });
    const [sweep, setSweep] = useState<{ key: number; card: TCard; x: number; y: number; dx: number; dy: number } | null>(null);
    const endSweep = useCallback(() => setSweep(null), []);
    const lastBurnt = useRef(burnt);
    useEffect(() => {
        const { area, laid, heap } = rects.current;
        const grew = burnt > lastBurnt.current;
        lastBurnt.current = burnt;
        if (grew && !still && burntCards?.[0] && area && laid && heap) {
            const centre = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
            const from = centre(laid);
            const to = centre(heap);
            setSweep({
                key: burnt,
                card: burntCards[0],
                // Card-sized, centred on the laid pile (the drop zone adds a border and padding).
                x: from.x - area.x - cardWidth / 2,
                y: from.y - area.y - cardHeight / 2,
                dx: to.x - from.x,
                dy: to.y - from.y,
            });
        }
        let cancelled = false;
        Promise.all([measure(areaRef.current), measure(dropZoneRef.current), measure(burntRef.current)]).then(
            ([areaRect, laidRect, heapRect]) => {
                if (!cancelled) rects.current = { area: areaRect, laid: laidRect, heap: heapRect };
            },
        );
        return () => {
            cancelled = true;
        };
    }, [burnt, burntCards, still, dropZoneRef, cardWidth, cardHeight, column]);

    const name = (player: string, you: string) => (player === username ? you : player);
    // An Ace's call, while the called player is on turn.
    const calling = !blindMiss && call && (turnOf === null ? call.target === username : turnOf === call.target);
    const turnText = blindMiss
        ? `${blindMiss.username === username ? 'Your' : `${blindMiss.username}'s`} blind ${blindMiss.card.name} doesn't fit! Picking up…`
        : calling && call
          ? `${name(call.by, 'You')} called ${name(call.target, 'you')}: a magic card or pick up!`
          : turnOf === null
          ? 'Your turn'
          : turnOf
            ? `${turnOf}'s turn`
            : 'Waiting…';
    const turnColours = blindMiss ? 'bg-red-200 text-red-900' : calling ? 'bg-amber-200 text-amber-900' : turnOf === null ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-800';

    return (
        <View ref={areaRef} collapsable={false} className="items-center gap-1.5">
            <View className="flex-row flex-wrap items-center justify-center gap-1.5">
                <Text accessibilityLiveRegion="polite" className={`rounded-full px-3 py-0.5 text-sm font-semibold ${turnColours}`}>
                    {turnText}
                </Text>
                {reversed ? (
                    <Text
                        accessibilityLabel="Turn order reversed"
                        testID="turn-reversed"
                        className="rounded-full bg-purple-200 px-2 py-0.5 text-sm font-semibold text-purple-900"
                    >
                        ↺ Reversed
                    </Text>
                ) : null}
            </View>
            <View className={column ? 'items-center gap-1' : `flex-row items-start justify-center ${tight ? 'gap-1' : 'gap-4'}`}>
                <Pile title={`Deck (${deck})`} inset>
                    {/* Measured by your hand: drawn cards fly in from here. */}
                    <View ref={deckRef} collapsable={false}>
                        {deck > 0 ? <Deck count={deck} size={size} /> : <EmptyCardSlot size={size} label="Deck, empty" />}
                    </View>
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
                    <View ref={burntRef} collapsable={false}>
                        {burnt > 0 ? (
                            // Stays in place when cards are burnt (the burnt card sweeps onto it); the first heap fades in.
                            <Animated.View entering={FadeIn.duration(400)}>
                                <BurntHeap count={burnt} size={size} />
                            </Animated.View>
                        ) : (
                            <EmptyCardSlot size={size} label="Burnt cards, empty" />
                        )}
                    </View>
                </Pile>
            </View>
            {sweep ? (
                <View pointerEvents="none" style={{ position: 'absolute', left: sweep.x, top: sweep.y }}>
                    <BurnSweep key={sweep.key} card={sweep.card} size={size} dx={sweep.dx} dy={sweep.dy} onDone={endSweep} />
                </View>
            ) : null}
        </View>
    );
}

export default PileArea;

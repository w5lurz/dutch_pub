import { memo } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { cardRank, isRedSuit, type CardRank, type CardSuit, type TCard } from '@dutch-pub/shared';

import { iconA11y } from '@/components/icons/types';

import { ACE_OF_SPADES, LAYOUTS, RANK_PATHS, SUIT_PATHS, type LayoutItem } from './art/deck.generated';
import { CardStamp, stampText } from './CardStamp';
import { CourtFigure } from './CourtFigure';
import { CARD_COLORS, CARD_VIEWBOX } from './palette';

export type CardArtVariant = 'full' | 'compact';

/** Below this width (dp) the full face is unreadable; `CardFaceArt` switches to the compact face. */
export const COMPACT_BELOW_WIDTH = 52;

type CardIdentity = { card: TCard; rank?: undefined; suit?: undefined } | { card?: undefined; rank: CardRank; suit: CardSuit };

export type CardFaceArtProps = CardIdentity & {
    width: number;
    height: number;
    /** `full`: indices, pips, court figures. `compact`: a big index only. Default: by width. */
    variant?: CardArtVariant;
    /** Ink stamp with the card's power on special cards (only with `card`). Default true. */
    showStamp?: boolean;
    /** Thin grey edge line around the card (off if the parent draws its own border). Default true. */
    edge?: boolean;
    /** Exposes the art as an image with this label. Without it the art is hidden from screen readers. */
    accessibilityLabel?: string;
};

/** A suit symbol (path in a -600..600 square) placed with its top-left corner at x, y. */
function SuitGlyph({ item, suit, color }: { item: LayoutItem; suit: CardSuit; color: string }) {
    const half = item.size / 2;
    return (
        <G transform={`translate(${item.x + half} ${item.y + half}) scale(${item.size / 1200})`}>
            <Path d={SUIT_PATHS[suit]} fill={color} />
        </G>
    );
}

/** A rank glyph (stroked path in a -500..500 square) placed with its top-left corner at x, y. */
function RankGlyph({ item, rank, color, strokeWidth = 80 }: { item: LayoutItem; rank: CardRank; color: string; strokeWidth?: number }) {
    const half = item.size / 2;
    return (
        <G transform={`translate(${item.x + half} ${item.y + half}) scale(${item.size / 1000})`}>
            <Path
                d={RANK_PATHS[rank]}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                strokeMiterlimit={1.5}
            />
        </G>
    );
}

function LayoutGlyph({ item, rank, suit, color }: { item: LayoutItem; rank: CardRank; suit: CardSuit; color: string }) {
    const glyph =
        item.kind === 'rank' ? <RankGlyph item={item} rank={rank} color={color} /> : <SuitGlyph item={item} suit={suit} color={color} />;
    return item.rotated ? <G transform="rotate(180)">{glyph}</G> : glyph;
}

function FullFace({ rank, suit, color }: { rank: CardRank; suit: CardSuit; color: string }) {
    return (
        <>
            {rank === 'J' || rank === 'Q' || rank === 'K' ? <CourtFigure rank={rank} suit={suit} /> : null}
            {rank === 'A' && suit === 'spades'
                ? ACE_OF_SPADES.map((pip, i) => (
                      <G key={i} transform={`translate(${pip.x + pip.size / 2} ${pip.y + pip.size / 2}) scale(${pip.size / 1200})`}>
                          <Path
                              d={SUIT_PATHS.spades}
                              fill={CARD_COLORS.black}
                              stroke={pip.stroke ? CARD_COLORS[pip.stroke] : undefined}
                              strokeWidth={pip.strokeWidth}
                              strokeDasharray={pip.strokeDasharray}
                              strokeLinecap={pip.strokeLinecap}
                          />
                      </G>
                  ))
                : null}
            {LAYOUTS[suit][rank].map((item, i) => (
                <LayoutGlyph key={i} item={item} rank={rank} suit={suit} color={color} />
            ))}
        </>
    );
}

/** Compact face for small cards (below `COMPACT_BELOW_WIDTH`, e.g. 25-50 dp wide): a big rank and suit top-left, a large suit bottom-right. */
const COMPACT_RANK: LayoutItem = { kind: 'rank', x: -114, y: -160, size: 112, rotated: false };
const COMPACT_SMALL_SUIT: LayoutItem = { kind: 'suit', x: -104, y: -44, size: 92, rotated: false };
const COMPACT_BIG_SUIT: LayoutItem = { kind: 'suit', x: -38, y: 2, size: 150, rotated: false };

function CompactFace({ rank, suit, color }: { rank: CardRank; suit: CardSuit; color: string }) {
    return (
        <>
            <RankGlyph item={COMPACT_RANK} rank={rank} color={color} strokeWidth={105} />
            <SuitGlyph item={COMPACT_SMALL_SUIT} suit={suit} color={color} />
            <SuitGlyph item={COMPACT_BIG_SUIT} suit={suit} color={color} />
        </>
    );
}

/**
 * The face of a French-suited playing card (RevK / Goodall & Son art, CC0): corner indices,
 * classic pip layouts, double-headed court figures. Small cards get a compact face (rank + suit
 * only). Special cards can carry an ink stamp with their power ("CLEAR ALL", ...).
 */
export const CardFaceArt = memo(function CardFaceArt({
    card,
    rank: rankProp,
    suit: suitProp,
    width,
    height,
    variant,
    showStamp = true,
    edge = true,
    accessibilityLabel,
}: CardFaceArtProps) {
    const rank = card ? cardRank(card) : rankProp!;
    const suit = card ? (card.color as CardSuit) : suitProp!;
    const color = isRedSuit(suit) ? CARD_COLORS.red : CARD_COLORS.black;
    const compact = (variant ?? (width < COMPACT_BELOW_WIDTH ? 'compact' : 'full')) === 'compact';
    const stamp = card && showStamp ? stampText(card) : null;

    return (
        <View style={{ width, height }} {...viewA11y(accessibilityLabel)}>
            <Svg width={width} height={height} viewBox={CARD_VIEWBOX} preserveAspectRatio="none" {...iconA11y(accessibilityLabel)}>
                <Rect
                    x={-119.5}
                    y={-167.5}
                    width={239}
                    height={335}
                    rx={12}
                    fill={CARD_COLORS.face}
                    stroke={edge ? CARD_COLORS.edge : 'none'}
                    strokeWidth={edge ? 1.5 : 0}
                />
                {compact ? <CompactFace rank={rank} suit={suit} color={color} /> : <FullFace rank={rank} suit={suit} color={color} />}
            </Svg>
            {stamp ? <CardStamp text={stamp} cardWidth={width} cardHeight={height} /> : null}
        </View>
    );
});

/** The wrapping View is only a box: the Svg carries the label (or hides the art). */
function viewA11y(accessibilityLabel?: string) {
    return accessibilityLabel
        ? {}
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
}

export default CardFaceArt;

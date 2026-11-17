import { memo } from 'react';
import { G, Path, Rect } from 'react-native-svg';
import type { CardSuit } from '@dutch-pub/shared';

import { COURT_FRAME, COURTS, type CourtLayer } from './art/courts.generated';
import { SUIT_PATHS } from './art/deck.generated';
import { CARD_COLORS, courtColor } from './palette';

/** Maps the figure's 0 0 1300 2000 box onto the frame (non-uniform, as in the source deck). */
const FIGURE_TRANSFORM = `translate(${COURT_FRAME.x} ${COURT_FRAME.y}) scale(${COURT_FRAME.width / 1300} ${
    COURT_FRAME.height / 2000
})`;

function Layer({ layer, suitPath, suitColor }: { layer: CourtLayer; suitPath: string; suitColor: string }) {
    if (layer.mark !== undefined) {
        return (
            <G transform={layer.mark}>
                <Path d={suitPath} fill={suitColor} />
            </G>
        );
    }
    return (
        <Path
            d={layer.d}
            fill={layer.fill ? courtColor(layer.fill) : 'none'}
            stroke={layer.stroke ? courtColor(layer.stroke) : undefined}
            strokeWidth={layer.strokeWidth}
            strokeLinecap={layer.stroke ? 'round' : undefined}
            strokeLinejoin={layer.stroke ? 'round' : undefined}
        />
    );
}

/**
 * A double-headed court figure (J / Q / K) inside its frame, for the card's -120 -168 240 336
 * viewBox. Only the top half is stored; it is drawn twice, the second time turned 180°.
 */
export const CourtFigure = memo(function CourtFigure({ rank, suit }: { rank: 'J' | 'Q' | 'K'; suit: CardSuit }) {
    const layers = COURTS[`${rank}-${suit}`];
    const suitPath = SUIT_PATHS[suit];
    const suitColor = suit === 'hearts' || suit === 'diamonds' ? CARD_COLORS.red : CARD_COLORS.black;
    const half = (
        <G transform={FIGURE_TRANSFORM}>
            {layers.map((layer, i) => (
                <Layer key={i} layer={layer} suitPath={suitPath} suitColor={suitColor} />
            ))}
        </G>
    );
    return (
        <G>
            {half}
            <G transform="rotate(180)">{half}</G>
            <Rect {...COURT_FRAME} fill="none" stroke={CARD_COLORS.blue} strokeWidth={1} />
        </G>
    );
});

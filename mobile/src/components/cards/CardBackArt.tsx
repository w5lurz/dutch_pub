import { memo, useId } from 'react';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { iconA11y } from '@/components/icons/types';

import { BACK_COLORS, CARD_COLORS, CARD_VIEWBOX, type CardBackColor } from './palette';

export type CardBackArtProps = {
    width: number;
    height: number;
    /** Classic red or blue back. Default red. */
    color?: CardBackColor;
    /** Thin grey edge line around the card. Default true. */
    edge?: boolean;
    /** Exposes the art as an image with this label. Without it the art is hidden from screen readers. */
    accessibilityLabel?: string;
};

/**
 * A classic card back: a fine diamond lattice in a coloured field, framed by a white border and
 * a thin inner line, all inside the card's edge. Same 240 x 336 viewBox as `CardFaceArt`.
 */
export const CardBackArt = memo(function CardBackArt({
    width,
    height,
    color = 'red',
    edge = true,
    accessibilityLabel,
}: CardBackArtProps) {
    // Pattern ids are global on web: unique per instance.
    const patternId = `cardback${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const { field, line } = BACK_COLORS[color];

    return (
        <Svg width={width} height={height} viewBox={CARD_VIEWBOX} preserveAspectRatio="none" {...iconA11y(accessibilityLabel)}>
            <Defs>
                <Pattern id={patternId} x={0} y={0} width={12} height={12} patternUnits="userSpaceOnUse">
                    <Rect width={12} height={12} fill={field} />
                    {/* Lattice: diagonals both ways, a small diamond on each crossing. */}
                    <Path d="M0 0L12 12M12 0L0 12" stroke={line} strokeWidth={1.1} strokeOpacity={0.7} />
                    <Path d="M6 3.6L8.4 6L6 8.4L3.6 6Z" fill={line} fillOpacity={0.8} />
                </Pattern>
            </Defs>
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
            <Rect x={-106} y={-154} width={212} height={308} rx={7} fill={`url(#${patternId})`} />
            <Rect x={-99} y={-147} width={198} height={294} rx={4} fill="none" stroke={line} strokeWidth={2} strokeOpacity={0.9} />
            <Rect x={-106} y={-154} width={212} height={308} rx={7} fill="none" stroke={field} strokeWidth={2.5} />
        </Svg>
    );
});

export default CardBackArt;

import { useId } from 'react';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { iconA11y, iconSize, type IconProps } from './types';

/**
 * Back of a playing card (copied from the web). Default 80x112 (w-20 h-28); the web also
 * applies `-m-2`, pass a negative margin on the parent if you need that. `color` is the
 * pattern / outline color (default black). The picture is the card itself (outline to
 * the edges) with a thin white margin around the pattern.
 */
export function CardBackSide({ color = 'black', accessibilityLabel, ...props }: IconProps) {
    // Unique pattern id per instance (several card backs render at once; ids are global on web).
    const patternId = `B1${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

    return (
        <Svg viewBox="-120 -168 240 336" preserveAspectRatio="none" {...iconSize(props, 80, 112)} {...iconA11y(accessibilityLabel)}>
            <Defs>
                <Pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse">
                    <Path d="M3 0L6 3L3 6L0 3Z" fill={color} />
                </Pattern>
            </Defs>
            <Rect width="239" height="335" x="-119.5" y="-167.5" rx="12" ry="12" fill="white" stroke={color} />
            <Rect fill={`url(#${patternId})`} width="222" height="318" x="-111" y="-159" rx="8" ry="8" />
        </Svg>
    );
}

export default CardBackSide;

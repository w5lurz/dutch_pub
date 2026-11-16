import { useId } from 'react';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { iconA11y, iconSize, type IconProps } from './types';

/**
 * Back of a playing card (copied from the web). Default 80x112 (w-20 h-28); the web also
 * applies `-m-2`, pass a negative margin on the parent if you need that. `color` is the
 * pattern / outline color (default black).
 */
export function CardBackSide({ color = 'black', accessibilityLabel, ...props }: IconProps) {
    // Unique pattern id per instance (several card backs render at once; ids are global on web).
    const patternId = `B1${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

    return (
        <Svg viewBox="-132 -180 264 360" preserveAspectRatio="none" {...iconSize(props, 80, 112)} {...iconA11y(accessibilityLabel)}>
            <Defs>
                <Pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse">
                    <Path d="M3 0L6 3L3 6L0 3Z" fill={color} />
                </Pattern>
            </Defs>
            <Rect x="-240" y="-336" width="480" height="672" fill="white" />
            <Rect width="239" height="335" x="-119.5" y="-167.5" rx="12" ry="12" fill="white" stroke={color} />
            <Rect fill={`url(#${patternId})`} width="204" height="300" x="-102" y="-150" rx="12" ry="12" />
        </Svg>
    );
}

export default CardBackSide;

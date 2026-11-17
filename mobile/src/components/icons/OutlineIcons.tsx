import Svg, { Path } from 'react-native-svg';

import { iconA11y, iconSize, type IconProps } from './types';

type OutlineIconProps = IconProps & { strokeWidth?: number };

// Heroicons outline paths, copied from the web app. Default size 24, `color` is the stroke.

export function ChatIcon({ color = '#000000', strokeWidth = 1.5, accessibilityLabel, ...props }: OutlineIconProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <Path
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
        </Svg>
    );
}

/** The "X" used by the web's create-room form and chat panel. */
export function CloseIcon({ color = '#000000', strokeWidth = 1.5, accessibilityLabel, ...props }: OutlineIconProps) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <Path stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </Svg>
    );
}

/** Heroicons' light bulb, for the game's lamp switch. `glow` fills the bulb (the lamp is on). */
export function LampIcon({ color = '#000000', strokeWidth = 1.5, glow, accessibilityLabel, ...props }: OutlineIconProps & { glow?: string }) {
    return (
        <Svg viewBox="0 0 24 24" fill="none" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            {glow ? <Path fill={glow} d="M12 3a7.5 7.5 0 00-3.76 13.99c.85.49 1.51 1.33 1.51 2.31V18h4.5v-.19c0-.98.66-1.82 1.51-2.32A7.5 7.5 0 0012 3z" /> : null}
            <Path
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
        </Svg>
    );
}

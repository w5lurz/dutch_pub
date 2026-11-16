import Svg, { G, Path } from 'react-native-svg';

import { iconA11y, iconSize, type IconProps } from './types';

// Paths copied from the web app (frontend/src/components/util/UtilComponents.tsx). Default size 24 (w-6 h-6).

export function SpadeIcon({ color = '#000000', accessibilityLabel, ...props }: IconProps) {
    return (
        <Svg viewBox="0 0 40.679 40.679" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <G>
                <Path
                    fill={color}
                    d="M34.592,20.101c1.006,1.808,2.146,3.854,1.892,7.08c-0.298,3.947-2.771,6.509-6.785,7.023
		c-1.688,0.223-3.075,0.096-4.066-0.394c-0.666-0.326-1.243-0.768-1.76-1.26c0.55,2.049,1.516,3.729,2.46,5.371
		c0.224,0.391,0.445,0.775,0.66,1.163c0.167,0.303,0.167,0.67-0.002,0.972c-0.169,0.303-0.48,0.496-0.826,0.512
		c-1.631,0.076-3.376,0.11-5.496,0.11c-1.595,0-3.21-0.021-4.851-0.04l-1.082-0.013c-0.32-0.005-0.618-0.16-0.804-0.421
		c-0.185-0.262-0.234-0.594-0.133-0.897c0.175-0.521,0.456-0.964,0.703-1.354c0.081-0.128,0.162-0.255,0.238-0.384l0.14-0.254
		c0.23-0.41,0.46-0.822,0.671-1.271l0.216-0.474c0.428-0.928,0.87-1.888,1.12-2.897c0.01-0.042,0.02-0.083,0.03-0.125
		c-0.935,0.938-2.134,1.735-3.778,1.819c-2.358,0.1-4.16-0.604-4.813-0.896c-2.51-1.153-3.902-3.391-4.145-6.653
		c-0.098-1.347,0.145-2.904,0.666-4.278c0.705-1.886,1.973-3.858,3.092-5.602c0.569-0.869,1.188-1.697,1.785-2.498
		c0.309-0.408,2.857-3.774,3.25-4.259c1.899-2.346,3.56-5.104,5.166-7.774c0.389-0.646,0.776-1.291,1.168-1.93
		C19.488,0.182,19.811,0,20.158,0c0,0,0,0,0.001,0c0.348,0,0.67,0.181,0.852,0.477c0.838,1.364,1.722,2.698,2.656,4.11l1.039,1.574
		c1.256,1.929,2.707,3.8,4.108,5.608c1.983,2.56,4.034,5.204,5.689,8.177L34.592,20.101z"
                />
            </G>
        </Svg>
    );
}

export function DiamondsIcon({ color = 'red', accessibilityLabel, ...props }: IconProps) {
    return (
        <Svg viewBox="0 0 32 32" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <Path fill={color} d="M16.050 5.438l8.537 10.501-8.537 10.501-8.537-10.501 8.537-10.501z" />
        </Svg>
    );
}

export function ClubsIcon({ color = '#000000', accessibilityLabel, ...props }: IconProps) {
    return (
        <Svg viewBox="0 0 512 512" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <Path
                fill={color}
                d="M477.443 295.143a104.45 104.45 0 0 1-202.26 36.67c-.08 68.73 4.33 114.46 69.55 149h-177.57c65.22-34.53 69.63-80.25 69.55-149a104.41 104.41 0 1 1-66.34-136.28 104.45 104.45 0 1 1 171.14 0 104.5 104.5 0 0 1 135.93 99.61z"
            />
        </Svg>
    );
}

export function HeartsIcon({ color = 'red', accessibilityLabel, ...props }: IconProps) {
    return (
        <Svg viewBox="0 0 512 512" {...iconSize(props, 24)} {...iconA11y(accessibilityLabel)}>
            <Path
                fill={color}
                d="M480.25 156.355c0 161.24-224.25 324.43-224.25 324.43S31.75 317.595 31.75 156.355c0-91.41 70.63-125.13 107.77-125.13 77.65 0 116.48 65.72 116.48 65.72s38.83-65.73 116.48-65.73c37.14.01 107.77 33.72 107.77 125.14z"
            />
        </Svg>
    );
}

export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type CardIconProps = Omit<IconProps, 'color'> & {
    /** A card's `color` from the server (`TCard.color`). Unknown values render a spade, as on the web. */
    suit: CardSuit | (string & {});
};

/** The suit icon for a card color name (the web's `CardIcon`). */
export function CardIcon({ suit, ...props }: CardIconProps) {
    switch (suit) {
        case 'hearts':
            return <HeartsIcon {...props} />;
        case 'diamonds':
            return <DiamondsIcon {...props} />;
        case 'clubs':
            return <ClubsIcon {...props} />;
        case 'spades':
        default:
            return <SpadeIcon {...props} />;
    }
}

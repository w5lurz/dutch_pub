import Svg, { Line, Polyline, Rect } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

import { iconA11y, iconSize, type IconProps } from './types';

/**
 * The Dutch Pub logo: "Holland" above "Kocsma" (Dutch Pub in Hungarian), the big H shared by both
 * rows, drawn with straight strokes (once "Holland Kártya", from the web). Default 40x40 (h-10 w-10), `color` is the
 * stroke (default: the accent blue, readable on the light background; the web's blue-300 was faint).
 */
export function DutchPubLogo({ color, accessibilityLabel = 'Dutch Pub', ...props }: IconProps) {
    const { accent } = useTheme();
    const stroke = color ?? accent;
    const thick = { stroke, strokeWidth: 16, fill: 'none', strokeMiterlimit: 10 };
    const thin = { stroke, strokeWidth: 12, fill: 'none', strokeMiterlimit: 10 };

    return (
        <Svg viewBox="0 0 564.41 459.03" {...iconSize(props, 40)} {...iconA11y(accessibilityLabel)}>
            <Line {...thick} x1="4.5" y1="0" x2="4.5" y2="459.03" />
            <Line {...thick} x1="559.91" y1="0" x2="559.91" y2="459.03" />
            <Line {...thick} x1="4.5" y1="216.66" x2="559.91" y2="216.66" />
            <Polyline {...thin} points="306.76 176.35 227.04 176.35 227.04 96.93 306.76 96.93 306.76 193.85" />
            <Line {...thin} x1="152.47" y1="31.85" x2="152.47" y2="182.28" />
            <Line {...thin} x1="194.9" y1="31.85" x2="194.9" y2="182.28" />
            <Rect {...thin} x="45.52" y="95.61" width="79.71" height="79.42" />
            <Polyline {...thin} points="342.76 96.93 342.76 107.07 342.76 182.28" />
            <Polyline {...thin} points="342.76 107.07 421.18 107.07 421.18 182.28" />
            <Polyline {...thin} points="518.89 107.07 446.9 107.07 446.9 182.28 518.89 182.28 518.89 31.85" />
            <Line {...thin} x1="28.29" y1="245.58" x2="28.29" y2="425.57" />
            <Polyline {...thin} points="34.72 335.58 73.29 335.58 162.65 246.22" />
            <Line {...thin} x1="162.65" y1="425.57" x2="72.97" y2="335.9" />
            {/* "ocsma" on the bottom row's x-height, the m's stems like the top row's n. */}
            <Rect {...thin} x="146.58" y="298.29" width="54" height="79.42" />
            <Polyline {...thin} points="272.58 298.29 226.58 298.29 226.58 377.71 272.58 377.71" />
            <Polyline {...thin} points="344.58 298.29 298.58 298.29 298.58 338 344.58 338 344.58 377.71 298.58 377.71" />
            <Polyline {...thin} points="370.58 290.9 370.58 308.43 370.58 383.64" />
            <Polyline {...thin} points="370.58 308.43 408.58 308.43 408.58 383.64" />
            <Polyline {...thin} points="408.58 308.43 446.58 308.43 446.58 383.64" />
            <Polyline {...thin} points="536.12 377.71 472.58 377.71 472.58 298.29 536.12 298.29 536.12 395.21" />
        </Svg>
    );
}

export default DutchPubLogo;

import Svg, { Line, Polyline, Rect } from 'react-native-svg';

import { iconA11y, iconSize, type IconProps } from './types';

/**
 * The Dutch Pub logo (copied from the web). Default 40x40 (h-10 w-10), `color` is the
 * stroke (default blue-300, as on the web).
 */
export function DutchPubLogo({ color = '#93c5fd', accessibilityLabel = 'Dutch Pub', ...props }: IconProps) {
    const thick = { stroke: color, strokeWidth: 16, fill: 'none', strokeMiterlimit: 10 };
    const thin = { stroke: color, strokeWidth: 12, fill: 'none', strokeMiterlimit: 10 };

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
            <Polyline {...thin} points="226.29 377.71 146.58 377.71 146.58 298.29 226.29 298.29 226.29 395.21" />
            <Line {...thin} x1="226.29" y1="234.01" x2="194.15" y2="275.3" />
            <Polyline {...thin} points="253.34 290.9 253.34 313.53 253.34 395.21" />
            <Line {...thin} x1="253.34" y1="313.53" x2="317.22" y2="313.53" />
            <Line {...thin} x1="336.1" y1="245.55" x2="336.1" y2="424.91" />
            <Line {...thin} x1="352.52" y1="268.47" x2="320.58" y2="268.47" />
            <Polyline {...thin} points="362.28 290.9 362.28 356.2 430.22 356.2 430.22 290.9 430.22 418.18 362.28 418.18 362.28 391.71" />
            <Polyline {...thin} points="536.12 377.71 456.41 377.71 456.41 298.29 536.12 298.29 536.12 395.21" />
        </Svg>
    );
}

export default DutchPubLogo;

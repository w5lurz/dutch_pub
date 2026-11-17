import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

/** The drawing's box: the thumb points up, the heel of the palm runs off the bottom. */
const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 160;
/** The thumb and the heel of the palm, as one outline. */
const OUTLINE = 'M 28 160 C 25 128 29 98 32 70 C 33 38 40 13 53 12 C 67 11 73 36 73 62 C 73 95 81 128 99 160 Z';

/** Width of the drawing per card width, and its tilt (the thumb leans toward the fan's right). */
const WIDTH_OF_CARD = 0.68;
const TILT = 20;
/** Share of the drawing above the hand's visible bottom edge (the rest runs off below it). */
const SHOWN = 0.8;

/**
 * Your thumb holding the fan, seen from above: it lies over the lower middle of the front
 * cards, the heel of the palm running off below them (the fingers are hidden behind the
 * cards). Only a drawing: touches go through to the cards, hidden from screen readers.
 * `centre` is the fan's middle (x) and `bottom` the hand's visible bottom edge (y): the thumb
 * stands on that edge, its base running off below it, so it looks the same at any hand size
 * (a bigger fan sits higher above its own bottom) and when the hand hangs off the screen.
 */
export function HandSilhouette({
    centre,
    bottom,
    cardWidth,
    style,
}: {
    centre: number;
    bottom: number;
    cardWidth: number;
    style?: StyleProp<ViewStyle>;
}) {
    const id = useId().replace(/:/g, '');
    const width = Math.round(cardWidth * WIDTH_OF_CARD);
    const height = Math.round((width * VIEW_HEIGHT) / VIEW_WIDTH);
    return (
        <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="hand-silhouette"
            style={[
                {
                    position: 'absolute',
                    width,
                    height,
                    // A little left of the middle; a fifth of it (the palm's heel) below the edge.
                    left: Math.round(centre - width / 2 - cardWidth * 0.12),
                    top: Math.round(bottom - height * SHOWN),
                    transform: [{ rotate: `${TILT}deg` }],
                },
                style,
            ]}
        >
            <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
                <Defs>
                    {/* Rounder in the middle, darker toward the edges. */}
                    <LinearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0">
                        <Stop offset={0} stopColor="#c48a63" />
                        <Stop offset={0.5} stopColor="#e8b994" />
                        <Stop offset={1} stopColor="#d49c76" />
                    </LinearGradient>
                </Defs>
                {/* Its shadow on the cards. */}
                <Path d={OUTLINE} fill="#000" opacity={0.22} transform="translate(4 3)" />
                <Path d={OUTLINE} fill={`url(#${id}-skin)`} stroke="#b47a54" strokeWidth={1} strokeOpacity={0.5} />
                {/* Nail, knuckle crease and a soft highlight. */}
                <G>
                    <Path
                        d="M 42 42 C 41 27 46 17 53 17 C 61 17 65 27 64 42 C 64 49 59 51 53 51 C 47 51 42 49 42 42 Z"
                        fill="#f1cdb9"
                        stroke="#d3a184"
                        strokeWidth={0.8}
                    />
                    <Path d="M 48 24 C 50 22 55 22 57 24" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.2} fill="none" />
                    <Path d="M 38 92 Q 53 98 69 90" stroke="#a96f4a" strokeOpacity={0.45} strokeWidth={1.2} fill="none" />
                    <Ellipse cx={56} cy={110} rx={6} ry={22} fill="#ffffff" opacity={0.12} />
                </G>
            </Svg>
        </View>
    );
}

export default HandSilhouette;

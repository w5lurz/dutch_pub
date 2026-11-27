import type { ReactNode } from 'react';
import { View } from 'react-native';

type RotatedProps = {
    /** 0, 90 (clockwise) or -90. */
    degrees: 0 | 90 | -90;
    /** Size of the content before rotating (React Native rotates the drawing, not the layout box). */
    width: number;
    height: number;
    children: ReactNode;
};

/**
 * Draws its content rotated by a quarter turn and takes up the rotated size in the layout
 * (width and height swapped), so rotated content lines up with its neighbours. Used for the
 * side seats' cards, which face the centre of the table.
 */
export function Rotated({ degrees, width, height, children }: RotatedProps) {
    if (degrees === 0) return <>{children}</>;
    return (
        <View style={{ width: height, height: width }}>
            <View
                style={{
                    position: 'absolute',
                    width,
                    height,
                    left: (height - width) / 2,
                    top: (width - height) / 2,
                    transform: [{ rotate: `${degrees}deg` }],
                }}
            >
                {children}
            </View>
        </View>
    );
}

export default Rotated;

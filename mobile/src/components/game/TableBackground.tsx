import { Image, StyleSheet } from 'react-native';

import type { TableLayout } from './cardSize';

const TABLE = {
    wide: require('../../../assets/images/table.jpg'),
    // The same photo turned by 90 degrees.
    portrait: require('../../../assets/images/table-portrait.jpg'),
};

/**
 * Top view of a white plastic garden table on grass, the game's background: the landscape
 * photo for the wide layout, the same photo turned upright for portrait. It is cropped
 * close to the table and stretched to the screen, so the table always fills it. Fills its
 * parent; put it first, behind the game content.
 */
export function TableBackground({ layout = 'wide' }: { layout?: TableLayout }) {
    return (
        <Image
            source={TABLE[layout]}
            resizeMode="stretch"
            // Explicit 100% size: on web and native the image otherwise keeps the photo's own size.
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
        />
    );
}

export default TableBackground;

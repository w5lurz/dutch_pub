import { Platform } from 'react-native';

export type IconProps = {
    /** Sets both width and height. */
    size?: number;
    width?: number;
    height?: number;
    /** Fill (or stroke, for outline icons) color. */
    color?: string;
    /** If set, the icon is exposed to screen readers as an image; otherwise it is decorative. */
    accessibilityLabel?: string;
};

/** Resolves width/height from `size`, then the explicit props, then the default. */
export const iconSize = ({ size, width, height }: IconProps, defaultWidth: number, defaultHeight = defaultWidth) => ({
    width: width ?? size ?? defaultWidth,
    height: height ?? size ?? defaultHeight,
});

/**
 * Accessibility props for an Svg root. On web, react-native-svg passes props straight to
 * the <svg> element, so it gets ARIA attributes there (`accessible` would end up in the DOM
 * and React warns "Received `true` for a non-boolean attribute").
 */
export const iconA11y = (accessibilityLabel?: string) => {
    if (Platform.OS === 'web') {
        return accessibilityLabel ? { role: 'img' as const, 'aria-label': accessibilityLabel } : { 'aria-hidden': true };
    }
    return accessibilityLabel
        ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
        : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
};

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

/** Accessibility props for an Svg root. */
export const iconA11y = (accessibilityLabel?: string) =>
    accessibilityLabel
        ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
        : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

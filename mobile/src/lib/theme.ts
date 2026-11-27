import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

/**
 * Colours for places that take a colour value instead of a className (navigation,
 * spinners, SVG icons, animated styles). They follow the same rule as the CSS palette
 * in src/global.css: in dark mode each Tailwind scale is reversed (gray-900 <-> gray-100,
 * blue-600 <-> blue-400, ...) and white becomes gray-900.
 */
export type ThemeColors = {
    dark: boolean;
    /** Screen background (`bg-gray-50`). */
    background: string;
    /** Panels, sheets, tab bar (`bg-white`). */
    surface: string;
    /** Main text (`text-gray-900`). */
    text: string;
    /** Secondary text and icons (`text-gray-700`). */
    textMuted: string;
    /** Placeholder text (`text-gray-400`, the middle of the scale: same in both). */
    placeholder: string;
    /** Borders (`border-gray-200`). */
    border: string;
    /** Links, spinners, active tab (`blue-600`). */
    accent: string;
    /** Icons on light-blue chips (`blue-700`). */
    accentStrong: string;
};

const LIGHT: ThemeColors = {
    dark: false,
    background: '#f9fafb', // gray-50
    surface: '#ffffff',
    text: '#111827', // gray-900
    textMuted: '#374151', // gray-700
    placeholder: '#9ca3af', // gray-400
    border: '#e5e7eb', // gray-200
    accent: '#2563eb', // blue-600
    accentStrong: '#1d4ed8', // blue-700
};

const DARK: ThemeColors = {
    dark: true,
    background: '#030712', // gray-950
    surface: '#111827', // gray-900
    text: '#f3f4f6', // gray-100
    textMuted: '#d1d5db', // gray-300
    placeholder: '#4b5563', // gray-600
    border: '#1f2937', // gray-800
    accent: '#60a5fa', // blue-400
    accentStrong: '#93c5fd', // blue-300
};

/** The current colours (follows the system colour scheme, as the CSS palette does). */
export function useTheme(): ThemeColors {
    return useColorScheme() === 'dark' ? DARK : LIGHT;
}

/** React Navigation theme (tab bar, screen backgrounds) from our colours. */
export function navigationTheme(colors: ThemeColors): Theme {
    const base = colors.dark ? DarkTheme : DefaultTheme;
    return {
        ...base,
        colors: {
            ...base.colors,
            primary: colors.accent,
            background: colors.surface,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
        },
    };
}

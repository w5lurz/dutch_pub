/** Palette colour backed by a CSS variable from src/global.css (switches in dark mode). */
const themed = name => `rgb(var(--${name}) / <alpha-value>)`;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const palette = name => Object.fromEntries(SHADES.map(shade => [shade, themed(`${name}-${shade}`)]));

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    // 'class' instead of the default 'media': with 'media', NativeWind's web runtime throws
    // "Cannot manually set color scheme, as dark mode is type 'media'" on startup.
    // Dark mode does not use dark: variants anyway: the palette below is made of CSS
    // variables that src/global.css switches with the system colour scheme.
    darkMode: 'class',
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            white: themed('white'),
            black: themed('black'),
            gray: palette('gray'),
            red: palette('red'),
            green: palette('green'),
            blue: palette('blue'),
            yellow: palette('yellow'),
            orange: palette('orange'),
            // Playing card faces: fixed, light in both colour schemes (like real cards).
            card: {
                face: '#f9fafb', // gray-50
                border: '#d1d5db', // gray-300
                red: '#dc2626', // red-600
                black: '#111827', // gray-900
            },
        },
        extend: {},
    },
    plugins: [],
};

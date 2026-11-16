/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    // 'class' instead of the default 'media': with 'media', NativeWind's web runtime throws
    // "Cannot manually set color scheme, as dark mode is type 'media'" on startup.
    // The app has no dark: styles, so this changes nothing visually.
    darkMode: 'class',
    theme: {
        extend: {},
    },
    plugins: [],
};
